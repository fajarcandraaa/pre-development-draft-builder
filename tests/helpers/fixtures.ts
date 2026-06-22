import { mkdtemp } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import type { ProjectState, ProviderConfig } from '../../src/storage/schemas'

/** Creates an isolated temp directory for a test and returns its path. */
export async function makeTempDir(prefix = 'docbuilder-test-'): Promise<string> {
  return mkdtemp(join(tmpdir(), prefix))
}

const PENDING_DOC = {
  status: 'pending' as const,
  version: 0,
  confidence: null,
  generatedAt: null,
  providerUsed: null,
  modelUsed: null,
  tokensUsed: null,
}

/** Returns a valid, fully-pending ProjectState for tests. */
export function makeProjectState(overrides: Partial<ProjectState> = {}): ProjectState {
  return {
    project: {
      name: 'Test Project',
      slug: 'test-project',
      language: 'id',
      qualityMode: 'balanced',
      inputMethod: 'text',
      interactiveModeSkipped: false,
      createdAt: '2026-06-18T00:00:00.000Z',
    },
    pipeline: {
      stage1Approved: false,
      stage1ApprovedAt: null,
      stage1SummaryGenerated: false,
    },
    documents: {
      'discovery-notes': { ...PENDING_DOC },
      brd: { ...PENDING_DOC },
      sow: { ...PENDING_DOC },
      prd: { ...PENDING_DOC },
      'uiux-flow': { ...PENDING_DOC },
      srs: { ...PENDING_DOC },
      trd: { ...PENDING_DOC },
      sdd: { ...PENDING_DOC },
      'task-breakdown': { ...PENDING_DOC },
    },
    ...overrides,
  }
}

/** Returns a valid ProviderConfig (matches SDD §5.2 default example). */
export function makeProviderConfig(overrides: Partial<ProviderConfig> = {}): ProviderConfig {
  return {
    default: 'openai',
    encryption: 'none',
    providers: {
      openai: {
        apiKey: 'sk-test-1234',
        models: {
          'fast-draft': 'gpt-4o-mini',
          balanced: 'gpt-4o',
          'deep-analysis': 'gpt-4o',
        },
        maxTokens: {
          'fast-draft': 2000,
          balanced: 4000,
          'deep-analysis': 8000,
        },
        temperature: {
          'fast-draft': 0.7,
          balanced: 0.5,
          'deep-analysis': 0.3,
        },
      },
    },
    updatedAt: '2026-06-18T00:00:00.000Z',
    ...overrides,
  }
}
