/**
 * DocumentPipeline (SDD §6.4).
 * Orchestrator that coordinates document generation, quality checks, and state management.
 */

import type { DocumentDefinition, DocumentId } from '../config/registry.js'
import { DOCUMENT_REGISTRY, getDocumentDefinition } from '../config/registry.js'
import type { StateManager } from './StateManager.js'
import type { DocumentGenerator } from './DocumentGenerator.js'
import type { QualityGate, QGContext, QGResult } from './QualityGate.js'
import type { FileManager } from '../storage/FileManager.js'
import type { Logger } from '../utils/logger.js'
import type { ProjectState } from '../storage/schemas.js'
import type { QualityMode } from '../ai/types.js'
import type { FinalReview } from './FinalReview.js'
import type { QuestionExtractor } from './QuestionExtractor.js'
import type { QuestionPrompter } from './QuestionPrompter.js'

/** Maximum total questions that can be asked across the entire Stage 1 pipeline run. */
const GLOBAL_QUESTION_CAP = 10

/**
 * Generate options for document generation.
 */
export interface GenerateOptions {
  modeOverride?: QualityMode
  force?: boolean
  dryRun?: boolean
  revisionNote?: string
  promptForAnswers?: boolean
}

/**
 * DocumentPipeline orchestrator for document generation and quality checks.
 */
export class DocumentPipeline {
  constructor(
    private stateManager: StateManager,
    private generator: DocumentGenerator,
    private qualityGate: QualityGate,
    private fileManager: FileManager,
    private logger: Logger,
    private finalReview?: FinalReview,
    private questionExtractor?: QuestionExtractor,
    private questionPrompter?: QuestionPrompter,
  ) {}

  /**
   * Get next pending document from registry.
   * @param state - Current project state
   * @returns Next pending document or null
   */
  private getNextPending(state: ProjectState): DocumentDefinition | null {
    for (const doc of DOCUMENT_REGISTRY) {
      const docStatus = state.documents[doc.id]
      if (docStatus.status === 'pending') {
        return doc
      }
    }
    return null
  }

  /**
   * Get stale documents from registry.
   * @param state - Current project state
   * @returns Stale documents
   */
  private getStaleDocuments(state: ProjectState): DocumentDefinition[] {
    return DOCUMENT_REGISTRY.filter((doc) => state.documents[doc.id].status === 'stale')
  }

  /**
   * Get documents for a specific stage.
   * @param stage - Stage number (1 or 2)
   * @returns Documents in the stage
   */
  private getStage(stage: 1 | 2): DocumentDefinition[] {
    return DOCUMENT_REGISTRY.filter((doc) => doc.stage === stage)
  }

  /**
   * Get dependencies for a document.
   * @param docId - Document ID
   * @returns Dependency documents
   */
  private getDependencies(docId: DocumentId): DocumentDefinition[] {
    const doc = getDocumentDefinition(docId)
    return doc.dependsOn.map((depId) => getDocumentDefinition(depId))
  }

  /**
   * Generate the next pending document.
   * @param options - Generation options
   */
  async generateNext(options: GenerateOptions = {}): Promise<void> {
    const state = await this.stateManager.getState()

    // Check for stale documents first
    const staleDocs = this.getStaleDocuments(state)
    if (staleDocs.length > 0) {
      this.logger.warning(`Found ${staleDocs.length} stale document(s). Regenerating...`)
      for (const staleDoc of staleDocs) {
        await this.regenerateDocument(staleDoc, state, options)
      }
      // Refresh state after regenerating stale documents
      const updatedState = await this.stateManager.getState()
      return this.generateNext(options) // Recursively call to process next document
    }

    const nextDoc = this.getNextPending(state)

    if (!nextDoc) {
      this.logger.info('No pending documents to generate.')
      // Run Final Review if all documents are generated and FinalReview is available
      await this.runFinalReviewIfComplete(state)
      return
    }

    // Validate Stage 1 approval if Stage 2
    if (nextDoc.stage === 2 && !state.pipeline.stage1Approved) {
      this.logger.error('Stage 1 must be approved before generating Stage 2 documents.')
      throw new Error('Stage 1 not approved')
    }

    // Set status to generating
    await this.stateManager.updateDocumentStatus(nextDoc.id, { status: 'generating' })
    this.logger.info(`Generating ${nextDoc.displayName}...`)

    try {
      // Build generation context
      const context = await this.buildGenerationContext(nextDoc, state, options)

      // Generate document
      const content = await this.generator.generate(nextDoc, context, options.modeOverride || state.project.qualityMode)

      // Save document
      if (!options.dryRun) {
        await this.fileManager.writeDocument(nextDoc.id, content)
        this.logger.success(`${nextDoc.displayName} generated successfully.`)
      } else {
        this.logger.info(`Dry run: ${nextDoc.displayName} would be generated.`)
      }

      // Set status to generated
      await this.stateManager.updateDocumentStatus(nextDoc.id, {
        status: 'generated',
        generatedAt: new Date().toISOString(),
      })

      // Run quality gate
      if (!options.dryRun) {
        const qgContext: QGContext = {
          previousDocs: await this.getPreviousDocs(nextDoc, state),
          state: state as Record<string, unknown>,
        }
        const qgResult = await this.qualityGate.run(nextDoc, content, qgContext, options.modeOverride || state.project.qualityMode)
        await this.qualityGate.saveReport(nextDoc, qgResult)

        // Update state with confidence
        await this.stateManager.updateDocumentStatus(nextDoc.id, { confidence: qgResult.confidence })

        // Display summary
        this.displayQGSummary(nextDoc, qgResult)

        // Warn if low confidence
        if (qgResult.confidence <= 5 && !options.force) {
          this.logger.warning(`Low confidence (${qgResult.confidence}/10). Use --force to proceed.`)
        }
      }

      // Prompt for answers if enabled and available (Stage 1 only)
      if (options.promptForAnswers !== false && this.questionExtractor && this.questionPrompter && nextDoc.stage === 1 && !options.dryRun) {
        await this.promptForAnswers(nextDoc, content, state, options)
      }

      // Check Stage 1 completion
      await this.checkStage1Complete(state)
    } catch (error) {
      // Rollback to pending on error
      await this.stateManager.updateDocumentStatus(nextDoc.id, { status: 'pending' })
      this.logger.error(`Failed to generate ${nextDoc.displayName}: ${error instanceof Error ? error.message : String(error)}`)
      throw error
    }
  }

  /**
   * Regenerate a stale document.
   * @param doc - Document definition
   * @param state - Current project state
   * @param options - Generation options
   */
  private async regenerateDocument(
    doc: DocumentDefinition,
    state: ProjectState,
    options: GenerateOptions,
  ): Promise<void> {
    this.logger.info(`Regenerating stale document: ${doc.displayName}`)

    // Set status to generating
    await this.stateManager.updateDocumentStatus(doc.id, { status: 'generating' })

    try {
      // Build generation context
      const context = await this.buildGenerationContext(doc, state, options)

      // Generate document
      const content = await this.generator.generate(doc, context, options.modeOverride || state.project.qualityMode)

      // Save document
      if (!options.dryRun) {
        await this.fileManager.writeDocument(doc.id, content)
        this.logger.success(`${doc.displayName} regenerated successfully.`)
      }

      // Set status to generated
      await this.stateManager.updateDocumentStatus(doc.id, {
        status: 'generated',
        generatedAt: new Date().toISOString(),
      })

      // Run quality gate
      if (!options.dryRun) {
        const qgContext: QGContext = {
          previousDocs: await this.getPreviousDocs(doc, state),
          state: state as Record<string, unknown>,
        }
        const qgResult = await this.qualityGate.run(doc, content, qgContext, options.modeOverride || state.project.qualityMode)
        await this.qualityGate.saveReport(doc, qgResult)

        // Update state with confidence
        await this.stateManager.updateDocumentStatus(doc.id, { confidence: qgResult.confidence })

        // Display summary
        this.displayQGSummary(doc, qgResult)
      }
    } catch (error) {
      // Rollback to stale on error
      await this.stateManager.updateDocumentStatus(doc.id, { status: 'stale' })
      this.logger.error(`Failed to regenerate ${doc.displayName}: ${error instanceof Error ? error.message : String(error)}`)
      throw error
    }
  }

  /**
   * Check if Stage 1 is complete and display summary.
   * @param state - Current project state
   */
  async checkStage1Complete(state: ProjectState): Promise<void> {
    const stage1Docs = this.getStage(1)
    const allGenerated = stage1Docs.every((doc) => state.documents[doc.id].status === 'generated')

    if (allGenerated && !state.pipeline.stage1Approved) {
      this.logger.info('Stage 1 documents complete.')
      this.logger.info('Run "docbuilder approve stage-1" to approve Stage 1 and generate summary.')
    }
  }

  /**
   * Run Final Review if all documents are generated and FinalReview is available.
   * @param state - Current project state
   */
  private async runFinalReviewIfComplete(state: ProjectState): Promise<void> {
    if (!this.finalReview) {
      return
    }

    const allGenerated = DOCUMENT_REGISTRY.every((doc) => state.documents[doc.id].status === 'generated')

    if (allGenerated) {
      this.logger.info('All documents generated. Running Final Review...')
      try {
        const result = await this.finalReview.run(state, state.project.qualityMode)
        await this.finalReview.saveReport(result)
        this.logger.success('Final Review completed successfully.')
      } catch (error) {
        this.logger.error(`Final Review failed: ${error instanceof Error ? error.message : String(error)}`)
        // Don't throw error - Final Review failure should not block pipeline completion
      }
    }
  }

  /**
   * Build generation context for document.
   * @param doc - Document definition
   * @param state - Current project state
   * @param options - Generation options
   * @returns Generation context
   */
  private async buildGenerationContext(
    doc: DocumentDefinition,
    state: ProjectState,
    options: GenerateOptions,
  ): Promise<{ state: ProjectState & { context: string }; previousDocs: Record<string, string>; dryRun?: boolean; revisionNote?: string; answers?: Record<string, string> }> {
    const previousDocs = await this.getPreviousDocs(doc, state)
    const context = await this.loadProjectContext()

    return {
      state: { ...state, context },
      previousDocs,
      dryRun: options.dryRun,
      revisionNote: options.revisionNote || (options.modeOverride ? `Quality mode: ${options.modeOverride}` : undefined),
      answers: state.answers,
    }
  }

  /**
   * Load the project context for prompt injection. Prefers the enriched
   * planning/context.md (Sprint 2 ContextBuilder output); falls back to the
   * raw brief saved at input/raw-brief.md.
   */
  private async loadProjectContext(): Promise<string> {
    try {
      return await this.fileManager.readPlanning('context.md')
    } catch {
      try {
        return await this.fileManager.readInput('raw-brief.md')
      } catch {
        this.logger.warning('No project context found (context.md or raw-brief.md).')
        return ''
      }
    }
  }

  /**
   * Get previous documents content.
   * @param doc - Current document
   * @param state - Current project state
   * @returns Previous documents content
   */
  private async getPreviousDocs(doc: DocumentDefinition, state: ProjectState): Promise<Record<string, string>> {
    const previousDocs: Record<string, string> = {}
    const dependencies = this.getDependencies(doc.id)

    for (const dep of dependencies) {
      const depStatus = state.documents[dep.id]
      if (depStatus.status === 'generated') {
        try {
          previousDocs[dep.id] = await this.fileManager.readDocument(dep.id)
        } catch (error) {
          this.logger.warning(`Failed to read ${dep.id}: ${error instanceof Error ? error.message : String(error)}`)
        }
      }
    }

    return previousDocs
  }

  /**
   * Display quality gate summary.
   * @param doc - Document definition
   * @param result - Quality gate result
   */
  private displayQGSummary(doc: DocumentDefinition, result: QGResult): void {
    this.logger.info(`Quality Gate: ${doc.displayName}`)
    this.logger.info(`  Completeness: ${result.completeness}/10`)
    this.logger.info(`  Consistency: ${result.consistency}/10`)
    this.logger.info(`  Confidence: ${result.confidence}/10`)

    if (result.risks.length > 0) {
      this.logger.warning(`  Risks: ${result.risks.length} identified`)
    }

    if (result.requiredDecisions.length > 0) {
      this.logger.warning(`  Required Decisions: ${result.requiredDecisions.length} pending`)
    }
  }

  /**
   * Prompt user for answers to questions extracted from document.
   * @param doc - Document definition
   * @param content - Generated document content
   * @param state - Current project state
   * @param options - Generation options
   */
  private async promptForAnswers(
    doc: DocumentDefinition,
    content: string,
    state: ProjectState,
    options: GenerateOptions,
  ): Promise<void> {
    if (!this.questionExtractor || !this.questionPrompter) {
      return
    }

    try {
      // Collect questions already answered or asked so the extractor can
      // exclude semantically similar duplicates across documents.
      const answeredQuestions = Object.keys(await this.stateManager.getAnswers())
      const askedQuestions = await this.stateManager.getAskedQuestions()
      const previouslyAsked = Array.from(new Set([...answeredQuestions, ...askedQuestions]))

      // Enforce global cap: skip prompting if we have already asked enough questions.
      if (askedQuestions.length >= GLOBAL_QUESTION_CAP) {
        return
      }

      const remainingSlots = GLOBAL_QUESTION_CAP - askedQuestions.length
      const maxQuestions = Math.min(5, remainingSlots)

      const extractionResult = await this.questionExtractor.extractQuestions(
        content,
        options.modeOverride || state.project.qualityMode,
        previouslyAsked,
        maxQuestions,
      )

      if (!extractionResult.hasQuestions) {
        return
      }

      await this.questionPrompter.promptForAnswersWithSkip(extractionResult.questions)
    } catch (error) {
      this.logger.warning(
        `Failed to prompt for answers: ${error instanceof Error ? error.message : String(error)}`,
      )
    }
  }

  /**
   * Regenerate a specific document with optional revision note.
   * @param docId - Document ID to regenerate
   * @param options - Generation options including revision note
   */
  async regenerate(docId: string, options: GenerateOptions = {}): Promise<void> {
    const state = await this.stateManager.getState()

    // Validate document ID
    const doc = getDocumentDefinition(docId as DocumentId)
    if (!doc) {
      this.logger.error(`Invalid document ID: ${docId}`)
      throw new Error(`Invalid document ID: ${docId}`)
    }

    // Check if document exists
    const docStatus = state.documents[doc.id]
    if (docStatus.status !== 'generated') {
      this.logger.error(`Document ${docId} has not been generated yet. Status: ${docStatus.status}`)
      throw new Error(`Document ${docId} has not been generated yet`)
    }

    this.logger.info(`Regenerating ${doc.displayName}...`)
    if (options.revisionNote) {
      this.logger.info(`Revision note: ${options.revisionNote}`)
    }

    // Archive current version
    const currentVersion = docStatus.version
    try {
      await this.fileManager.archiveVersion(doc.id, currentVersion)
      this.logger.info(`Archived version ${currentVersion} to versions/ directory`)
    } catch (error) {
      this.logger.warning(`Failed to archive version ${currentVersion}: ${error instanceof Error ? error.message : String(error)}`)
    }

    // Set status to generating
    await this.stateManager.updateDocumentStatus(doc.id, { status: 'generating' })

    try {
      // Build generation context
      const context = await this.buildGenerationContext(doc, state, options)

      // Generate document
      const content = await this.generator.generate(doc, context, options.modeOverride || state.project.qualityMode)

      // Save document
      if (!options.dryRun) {
        await this.fileManager.writeDocument(doc.id, content)
        this.logger.success(`${doc.displayName} regenerated successfully.`)
      } else {
        this.logger.info(`Dry run: ${doc.displayName} would be regenerated.`)
      }

      // Set status to generated with incremented version
      await this.stateManager.updateDocumentStatus(doc.id, {
        status: 'generated',
        version: currentVersion + 1,
        generatedAt: new Date().toISOString(),
      })

      // Run quality gate
      if (!options.dryRun) {
        const qgContext: QGContext = {
          previousDocs: await this.getPreviousDocs(doc, state),
          state: state as Record<string, unknown>,
        }
        const qgResult = await this.qualityGate.run(doc, content, qgContext, options.modeOverride || state.project.qualityMode)
        await this.qualityGate.saveReport(doc, qgResult)

        // Update state with confidence
        await this.stateManager.updateDocumentStatus(doc.id, { confidence: qgResult.confidence })

        // Display summary
        this.displayQGSummary(doc, qgResult)

        // Warn if low confidence
        if (qgResult.confidence <= 5 && !options.force) {
          this.logger.warning(`Low confidence (${qgResult.confidence}/10). Use --force to proceed.`)
        }
      }
    } catch (error) {
      // Rollback to generated on error
      await this.stateManager.updateDocumentStatus(doc.id, { status: 'generated' })
      this.logger.error(`Failed to regenerate ${doc.displayName}: ${error instanceof Error ? error.message : String(error)}`)
      throw error
    }
  }
}
