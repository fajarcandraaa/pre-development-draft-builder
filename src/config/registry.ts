/**
 * Document Registry data (TRD §5.8). Pure data + lookup helpers — no I/O.
 * The DocumentRegistry class wrapper lands in S1-T03.
 */

export type DocumentId =
  | 'discovery-notes'
  | 'brd'
  | 'sow'
  | 'prd'
  | 'uiux-flow'
  | 'srs'
  | 'trd'
  | 'sdd'
  | 'task-breakdown'

export interface DocumentDefinition {
  id: DocumentId
  order: number
  stage: 1 | 2
  filename: string
  displayName: string
  rolePersona: string
  promptTemplateFile: string
  dependsOn: DocumentId[]
}

export const DOCUMENT_REGISTRY: DocumentDefinition[] = [
  {
    id: 'discovery-notes',
    order: 1,
    stage: 1,
    filename: '01-discovery-notes.md',
    displayName: 'Discovery Notes',
    rolePersona: 'Business Analyst (BA)',
    promptTemplateFile: 'templates/01-discovery-notes.prompt.md',
    dependsOn: [],
  },
  {
    id: 'brd',
    order: 2,
    stage: 1,
    filename: '02-brd.md',
    displayName: 'Business Requirements Document (BRD)',
    rolePersona: 'Business Analyst (BA)',
    promptTemplateFile: 'templates/02-brd.prompt.md',
    dependsOn: ['discovery-notes'],
  },
  {
    id: 'sow',
    order: 3,
    stage: 1,
    filename: '03-sow.md',
    displayName: 'Scope of Work (SOW)',
    rolePersona: 'Project Manager (PM)',
    promptTemplateFile: 'templates/03-sow.prompt.md',
    dependsOn: ['brd'],
  },
  {
    id: 'prd',
    order: 4,
    stage: 1,
    filename: '04-prd.md',
    displayName: 'Product Requirements Document (PRD)',
    rolePersona: 'Product Manager',
    promptTemplateFile: 'templates/04-prd.prompt.md',
    dependsOn: ['sow'],
  },
  {
    id: 'uiux-flow',
    order: 5,
    stage: 2,
    filename: '05-uiux-flow.md',
    displayName: 'UI/UX Flow',
    rolePersona: 'UI/UX Designer',
    promptTemplateFile: 'templates/05-uiux-flow.prompt.md',
    dependsOn: ['prd'],
  },
  {
    id: 'srs',
    order: 6,
    stage: 2,
    filename: '06-srs.md',
    displayName: 'Software Requirements Specification (SRS)',
    rolePersona: 'System Analyst',
    promptTemplateFile: 'templates/06-srs.prompt.md',
    dependsOn: ['uiux-flow'],
  },
  {
    id: 'trd',
    order: 7,
    stage: 2,
    filename: '07-trd.md',
    displayName: 'Technical Requirements Document (TRD)',
    rolePersona: 'Tech Lead',
    promptTemplateFile: 'templates/07-trd.prompt.md',
    dependsOn: ['srs'],
  },
  {
    id: 'sdd',
    order: 8,
    stage: 2,
    filename: '08-sdd.md',
    displayName: 'System Design Document (SDD)',
    rolePersona: 'Solution Architect',
    promptTemplateFile: 'templates/08-sdd.prompt.md',
    dependsOn: ['trd'],
  },
  {
    id: 'task-breakdown',
    order: 9,
    stage: 2,
    filename: '09-task-breakdown.md',
    displayName: 'Task Breakdown',
    rolePersona: 'Tech Lead + Project Manager',
    promptTemplateFile: 'templates/09-task-breakdown.prompt.md',
    dependsOn: ['sdd'],
  },
]

const BY_ID = new Map<string, DocumentDefinition>(
  DOCUMENT_REGISTRY.map((doc) => [doc.id, doc]),
)

/** Returns the document definition for an id, or throws if unknown. */
export function getDocumentDefinition(id: string): DocumentDefinition {
  const doc = BY_ID.get(id)
  if (!doc) {
    throw new Error(`Unknown document id: ${id}`)
  }
  return doc
}

/** Returns the on-disk filename for a document id (e.g. '02-brd.md'). */
export function getDocumentFilename(id: string): string {
  return getDocumentDefinition(id).filename
}
