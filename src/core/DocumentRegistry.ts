import {
  DOCUMENT_REGISTRY,
  getDocumentDefinition,
  type DocumentDefinition,
} from '../config/registry.js'
import type { ProjectState } from '../storage/schemas.js'

/**
 * Source of truth for document ordering, dependencies, and metadata (SDD §6.2).
 * Pure — no I/O. Wraps the static `DOCUMENT_REGISTRY` data.
 */
export class DocumentRegistry {
  private readonly docs: DocumentDefinition[]

  constructor(docs: DocumentDefinition[] = DOCUMENT_REGISTRY) {
    this.docs = [...docs].sort((a, b) => a.order - b.order)
  }

  getAll(): DocumentDefinition[] {
    return [...this.docs]
  }

  getById(id: string): DocumentDefinition {
    return getDocumentDefinition(id)
  }

  /** First document (by order) whose status is `pending`, or null if none. */
  getNextPending(state: ProjectState): DocumentDefinition | null {
    for (const doc of this.docs) {
      if (state.documents[doc.id].status === 'pending') {
        return doc
      }
    }
    return null
  }

  getStage(stage: 1 | 2): DocumentDefinition[] {
    return this.docs.filter((doc) => doc.stage === stage)
  }

  getDependencies(id: string): DocumentDefinition[] {
    return this.getById(id).dependsOn.map((depId) => getDocumentDefinition(depId))
  }
}
