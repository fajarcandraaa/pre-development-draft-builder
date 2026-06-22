import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  buildDefaultEntry,
  isKnownProvider,
  listProviderNames,
  maskKey,
  pingProvider,
  resolveApiKey,
} from '../../../src/ai/providerCatalog'

describe('providerCatalog', () => {
  const ORIGINAL_ENV = { ...process.env }

  beforeEach(() => {
    delete process.env.OPENAI_API_KEY
    delete process.env.ANTHROPIC_API_KEY
  })

  afterEach(() => {
    process.env = { ...ORIGINAL_ENV }
    vi.unstubAllGlobals()
  })

  it('knows the supported providers', () => {
    expect(listProviderNames()).toEqual(['openai', 'anthropic', 'dinoiki'])
    expect(isKnownProvider('openai')).toBe(true)
    expect(isKnownProvider('dinoiki')).toBe(true)
    expect(isKnownProvider('gemini')).toBe(false)
  })

  it('maskKey shows only the first 4 chars', () => {
    expect(maskKey('sk-abcdef')).toBe('sk-a**')
    expect(maskKey('')).toBe('')
  })

  it('resolveApiKey prefers env over file', () => {
    expect(resolveApiKey('openai', 'file-key')).toEqual({ key: 'file-key', source: 'file' })
    process.env.OPENAI_API_KEY = 'env-key'
    expect(resolveApiKey('openai', 'file-key')).toEqual({ key: 'env-key', source: 'env' })
    expect(resolveApiKey('anthropic', null)).toEqual({ key: null, source: null })
  })

  it('buildDefaultEntry seeds models/tokens/temperature + key', () => {
    const entry = buildDefaultEntry('openai', 'sk-1')
    expect(entry.apiKey).toBe('sk-1')
    expect(entry.models.balanced).toBe('gpt-4o')
    expect(entry.maxTokens['deep-analysis']).toBe(8000)
    expect(entry.temperature['fast-draft']).toBe(0.7)
  })

  it('pingProvider returns ok on a 200 response', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, status: 200 }) as Response))
    const result = await pingProvider('openai', 'sk-1')
    expect(result.ok).toBe(true)
    expect(typeof result.ms).toBe('number')
  })

  it('pingProvider reports HTTP errors', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({ ok: false, status: 401, statusText: 'Unauthorized' }) as Response),
    )
    const result = await pingProvider('openai', 'bad')
    expect(result.ok).toBe(false)
    expect(result.error).toContain('401')
  })

  it('pingProvider catches network errors', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new Error('ENOTFOUND')
      }),
    )
    const result = await pingProvider('anthropic', 'sk-1')
    expect(result.ok).toBe(false)
    expect(result.error).toContain('ENOTFOUND')
  })
})
