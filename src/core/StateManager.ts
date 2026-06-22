import { DOCUMENT_REGISTRY } from '../config/registry.js'
import type { StateStore } from '../storage/StateStore.js'
import type { DocumentStatus, ProjectState } from '../storage/schemas.js'
import { StateTransitionError } from './errors.js'

/** Project metadata required to initialize a new state. */
export interface ProjectInit {
  name: string
  slug: string
  language: ProjectState['project']['language']
  qualityMode: ProjectState['project']['qualityMode']
  inputMethod: ProjectState['project']['inputMethod']
  platform?: ProjectState['project']['platform']
  interactiveModeSkipped?: boolean
  createdAt?: string
}

type DocStatus = DocumentStatus['status']

/** Allowed document status transitions (SDD state model). */
const ALLOWED_TRANSITIONS: Record<DocStatus, DocStatus[]> = {
  pending: ['generating'],
  generating: ['generated', 'pending'], // pending = interrupt reset
  generated: ['generating', 'stale'], // generating = regenerate
  stale: ['generating'],
}

/**
 * The only module permitted to read/write `state.json` (SDD §6.2). All other
 * modules must go through here. Delegates persistence to an injected StateStore.
 */
export class StateManager {
  constructor(private readonly store: StateStore) {}

  /** Builds a fresh state with all 9 documents `pending`. */
  static createInitialState(project: ProjectInit): ProjectState {
    const pendingDoc: DocumentStatus = {
      status: 'pending',
      version: 0,
      confidence: null,
      generatedAt: null,
      providerUsed: null,
      modelUsed: null,
      tokensUsed: null,
    }
    const documents = Object.fromEntries(
      DOCUMENT_REGISTRY.map((doc) => [doc.id, { ...pendingDoc }]),
    ) as ProjectState['documents']

    return {
      project: {
        name: project.name,
        slug: project.slug,
        language: project.language,
        qualityMode: project.qualityMode,
        inputMethod: project.inputMethod,
        platform: project.platform ?? 'web',
        interactiveModeSkipped: project.interactiveModeSkipped ?? false,
        createdAt: project.createdAt ?? new Date().toISOString(),
      },
      pipeline: {
        stage1Approved: false,
        stage1ApprovedAt: null,
        stage1SummaryGenerated: false,
      },
      documents,
      answers: {},
      askedQuestions: [],
    }
  }

  async getState(): Promise<ProjectState> {
    return this.store.read()
  }

  /**
   * Validates a status transition for a document. No-op when the status is
   * unchanged. Throws StateTransitionError for disallowed transitions.
   */
  validateTransition(current: DocStatus, next: DocStatus): void {
    if (current === next) return
    if (!ALLOWED_TRANSITIONS[current].includes(next)) {
      throw new StateTransitionError(
        `Invalid transition: '${current}' → '${next}'. Allowed: ${ALLOWED_TRANSITIONS[current].join(', ') || '(none)'}.`,
      )
    }
  }

  /** Merges a partial update into a document's status, validating transitions. */
  async updateDocumentStatus(
    docId: keyof ProjectState['documents'],
    update: Partial<DocumentStatus>,
  ): Promise<void> {
    const state = await this.store.read()
    const current = state.documents[docId]
    if (!current) {
      throw new StateTransitionError(`Unknown document id: ${String(docId)}`)
    }
    if (update.status !== undefined) {
      this.validateTransition(current.status, update.status)
    }
    state.documents[docId] = { ...current, ...update }
    await this.store.write(state)
  }

  /** Marks Stage 1 as approved and records the summary + timestamp. */
  async setStage1Approved(): Promise<void> {
    const state = await this.store.read()
    state.pipeline.stage1Approved = true
    state.pipeline.stage1ApprovedAt = new Date().toISOString()
    state.pipeline.stage1SummaryGenerated = true
    await this.store.write(state)
  }

  /**
   * Revokes Stage 1 approval and marks the given (Stage 2) documents as `stale`
   * (SDD §6.2). Used when a Stage 1 document is regenerated after approval.
   */
  async revokeStage1Approval(staleDocIds: Array<keyof ProjectState['documents']>): Promise<void> {
    const state = await this.store.read()
    state.pipeline.stage1Approved = false
    state.pipeline.stage1ApprovedAt = null
    for (const docId of staleDocIds) {
      const current = state.documents[docId]
      if (current && current.status === 'generated') {
        this.validateTransition(current.status, 'stale')
        state.documents[docId] = { ...current, status: 'stale' }
      }
    }
    await this.store.write(state)
  }

  /** Set an answer for a specific question. Also records it as asked. */
  async setAnswer(question: string, answer: string): Promise<void> {
    const state = await this.store.read()
    state.answers[question] = answer
    if (!state.askedQuestions.includes(question)) {
      state.askedQuestions.push(question)
    }
    await this.store.write(state)
  }

  /** Get all answers. */
  async getAnswers(): Promise<Record<string, string>> {
    const state = await this.store.read()
    return state.answers
  }

  /** Get a specific answer. */
  async getAnswer(question: string): Promise<string | undefined> {
    const state = await this.store.read()
    return state.answers[question]
  }

  /**
   * Record questions as asked (answered or skipped) so they are not re-asked
   * in subsequent documents. Deduplicates against existing entries.
   */
  async addAskedQuestions(questions: string[]): Promise<void> {
    if (questions.length === 0) return
    const state = await this.store.read()
    for (const question of questions) {
      if (!state.askedQuestions.includes(question)) {
        state.askedQuestions.push(question)
      }
    }
    await this.store.write(state)
  }

  /** Get all previously asked questions (answered or skipped). */
  async getAskedQuestions(): Promise<string[]> {
    const state = await this.store.read()
    return state.askedQuestions
  }
}
