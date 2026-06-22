import type { ProviderEntry } from '../storage/schemas.js'

/**
 * Lightweight provider catalog for Sprint 1 — enough for `provider add/set/
 * test/status` without the full AI Gateway (Sprint 2). When AIGateway lands,
 * `provider test` should delegate to `AIProvider.isAvailable()`.
 */
export type ProviderName = 'openai' | 'anthropic' | 'dinoiki'

interface QualityModeMap<T> {
  'fast-draft': T
  balanced: T
  'deep-analysis': T
}

export interface ProviderCatalogEntry {
  name: ProviderName
  displayName: string
  envVar: string
  defaultModels: QualityModeMap<string>
  defaultMaxTokens: QualityModeMap<number>
  defaultTemperature: QualityModeMap<number>
  /** Lightweight, no-cost reachability/auth endpoint (GET). */
  modelsUrl: string
  authHeaders: (apiKey: string) => Record<string, string>
}

const DEFAULT_MAX_TOKENS: QualityModeMap<number> = {
  'fast-draft': 2000,
  balanced: 4000,
  'deep-analysis': 8000,
}

const DEFAULT_TEMPERATURE: QualityModeMap<number> = {
  'fast-draft': 0.7,
  balanced: 0.5,
  'deep-analysis': 0.3,
}

export const PROVIDER_CATALOG: Record<ProviderName, ProviderCatalogEntry> = {
  openai: {
    name: 'openai',
    displayName: 'OpenAI',
    envVar: 'OPENAI_API_KEY',
    defaultModels: {
      'fast-draft': 'gpt-4o-mini',
      balanced: 'gpt-4o',
      'deep-analysis': 'gpt-4o',
    },
    defaultMaxTokens: { ...DEFAULT_MAX_TOKENS },
    defaultTemperature: { ...DEFAULT_TEMPERATURE },
    modelsUrl: 'https://api.openai.com/v1/models',
    authHeaders: (apiKey) => ({ Authorization: `Bearer ${apiKey}` }),
  },
  anthropic: {
    name: 'anthropic',
    displayName: 'Anthropic',
    envVar: 'ANTHROPIC_API_KEY',
    defaultModels: {
      'fast-draft': 'claude-3-5-haiku-20241022',
      balanced: 'claude-3-5-sonnet-20241022',
      'deep-analysis': 'claude-3-5-sonnet-20241022',
    },
    defaultMaxTokens: { ...DEFAULT_MAX_TOKENS },
    defaultTemperature: { ...DEFAULT_TEMPERATURE },
    modelsUrl: 'https://api.anthropic.com/v1/models',
    authHeaders: (apiKey) => ({ 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' }),
  },
  dinoiki: {
    name: 'dinoiki',
    displayName: 'Dinoiki AI Gateway',
    envVar: 'DINOIKI_API_KEY',
    defaultModels: {
      'fast-draft': 'gpt-4o-mini',
      balanced: 'gpt-4o',
      'deep-analysis': 'gpt-4o',
    },
    defaultMaxTokens: { ...DEFAULT_MAX_TOKENS },
    defaultTemperature: { ...DEFAULT_TEMPERATURE },
    modelsUrl: 'https://dinoiki.com/api/ai/models',
    authHeaders: (apiKey) => ({ Authorization: `Bearer ${apiKey}` }),
  },
}

export function isKnownProvider(name: string): name is ProviderName {
  return Object.prototype.hasOwnProperty.call(PROVIDER_CATALOG, name)
}

export function listProviderNames(): ProviderName[] {
  return Object.keys(PROVIDER_CATALOG) as ProviderName[]
}

/** Returns the first 4 chars of a key followed by '**', or '' for empty. */
export function maskKey(key: string): string {
  return key ? `${key.slice(0, 4)}**` : ''
}

export type KeySource = 'env' | 'file' | null

/** Resolves an API key with env-var precedence over the stored file key. */
export function resolveApiKey(
  name: ProviderName,
  fileKey: string | null,
): { key: string | null; source: KeySource } {
  const envKey = process.env[PROVIDER_CATALOG[name].envVar]
  if (envKey) return { key: envKey, source: 'env' }
  if (fileKey) return { key: fileKey, source: 'file' }
  return { key: null, source: null }
}

/** Builds a default ProviderEntry for a provider, seeded with `apiKey`. */
export function buildDefaultEntry(name: ProviderName, apiKey: string | null): ProviderEntry {
  const entry = PROVIDER_CATALOG[name]
  return {
    apiKey,
    models: { ...entry.defaultModels },
    maxTokens: { ...entry.defaultMaxTokens },
    temperature: { ...entry.defaultTemperature },
  }
}

export interface PingResult {
  ok: boolean
  ms: number
  error?: string
}

/** Minimal reachability/auth ping via the provider's models endpoint. */
export async function pingProvider(name: ProviderName, apiKey: string): Promise<PingResult> {
  const entry = PROVIDER_CATALOG[name]
  const start = Date.now()
  try {
    const res = await fetch(entry.modelsUrl, { headers: entry.authHeaders(apiKey) })
    const ms = Date.now() - start
    if (!res.ok) {
      return { ok: false, ms, error: `HTTP ${res.status} ${res.statusText}`.trim() }
    }
    return { ok: true, ms }
  } catch (err) {
    return { ok: false, ms: Date.now() - start, error: (err as Error).message }
  }
}
