import { z } from 'zod'

/**
 * Zod schemas for persisted data (SDD §5.1–5.2). All external file reads MUST
 * be validated through these schemas (SDD §9 constraint #3).
 */

// ── state.json (per project) ────────────────────────────────────────────────

export const DocumentStatusSchema = z.object({
  status: z.enum(['pending', 'generating', 'generated', 'stale']),
  version: z.number().int().min(0),
  confidence: z.number().min(1).max(10).nullable(),
  generatedAt: z.string().datetime().nullable(),
  providerUsed: z.string().nullable(),
  modelUsed: z.string().nullable(),
  tokensUsed: z.number().nullable(),
})

export type DocumentStatus = z.infer<typeof DocumentStatusSchema>

export const ProjectStateSchema = z.object({
  project: z.object({
    name: z.string(),
    slug: z.string(),
    language: z.enum(['id', 'en']),
    qualityMode: z.enum(['fast-draft', 'balanced', 'deep-analysis']),
    inputMethod: z.enum(['text', 'file']),
    platform: z.enum(['web', 'mobile', 'desktop', 'cli', 'api']).default('web'),
    interactiveModeSkipped: z.boolean().default(false),
    createdAt: z.string().datetime(),
  }),
  pipeline: z.object({
    stage1Approved: z.boolean().default(false),
    stage1ApprovedAt: z.string().datetime().nullable(),
    stage1SummaryGenerated: z.boolean().default(false),
  }),
  documents: z.object({
    'discovery-notes': DocumentStatusSchema,
    brd: DocumentStatusSchema,
    sow: DocumentStatusSchema,
    prd: DocumentStatusSchema,
    'uiux-flow': DocumentStatusSchema,
    srs: DocumentStatusSchema,
    trd: DocumentStatusSchema,
    sdd: DocumentStatusSchema,
    'task-breakdown': DocumentStatusSchema,
  }),
  answers: z.record(z.string(), z.string()).default({}),
  askedQuestions: z.array(z.string()).default([]),
})

export type ProjectState = z.infer<typeof ProjectStateSchema>

// ── provider.json (global) ──────────────────────────────────────────────────

export const ProviderModelConfigSchema = z.object({
  'fast-draft': z.string(),
  balanced: z.string(),
  'deep-analysis': z.string(),
})

export const ProviderMaxTokensSchema = z.object({
  'fast-draft': z.number(),
  balanced: z.number(),
  'deep-analysis': z.number(),
})

export const ProviderEntrySchema = z.object({
  apiKey: z.string().nullable(),
  models: ProviderModelConfigSchema,
  maxTokens: ProviderMaxTokensSchema,
  temperature: z.object({
    'fast-draft': z.number().default(0.7),
    balanced: z.number().default(0.5),
    'deep-analysis': z.number().default(0.3),
  }),
})

export type ProviderEntry = z.infer<typeof ProviderEntrySchema>

export const ProviderConfigSchema = z.object({
  default: z.string(),
  encryption: z.enum(['none', 'aes-256']).default('none'),
  providers: z.record(z.string(), ProviderEntrySchema),
  updatedAt: z.string().datetime(),
})

export type ProviderConfig = z.infer<typeof ProviderConfigSchema>
