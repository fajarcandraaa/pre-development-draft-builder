/**
 * Unit tests for MockProvider.
 */

import { describe, it, expect } from 'vitest'
import { MockProvider } from '../../../src/ai/providers/MockProvider.js'
import type { GenerateRequest } from '../../../src/ai/types.js'

describe('MockProvider', () => {
  it('should have correct name and supported modes', () => {
    const provider = new MockProvider('test-key')

    expect(provider.name).toBe('mock')
    expect(provider.supportedModes).toEqual(['fast-draft', 'balanced', 'deep-analysis'])
  })

  it('should return placeholder content', async () => {
    const provider = new MockProvider('test-key')
    const request: GenerateRequest = {
      systemPrompt: 'You are a test assistant.',
      userPrompt: 'Generate test content.',
      model: 'gpt-4o',
      maxTokens: 1000,
      temperature: 0.5,
    }

    const response = await provider.generate(request)

    expect(response.content).toContain('[DRY RUN / MOCK]')
    expect(response.content).toContain('gpt-4o')
  })

  it('should return zero token usage', async () => {
    const provider = new MockProvider('test-key')
    const request: GenerateRequest = {
      systemPrompt: 'You are a test assistant.',
      userPrompt: 'Generate test content.',
      model: 'gpt-4o',
      maxTokens: 1000,
      temperature: 0.5,
    }

    const response = await provider.generate(request)

    expect(response.tokensUsed).toEqual({ input: 0, output: 0, total: 0 })
  })

  it('should return provider name as mock', async () => {
    const provider = new MockProvider('test-key')
    const request: GenerateRequest = {
      systemPrompt: 'You are a test assistant.',
      userPrompt: 'Generate test content.',
      model: 'gpt-4o',
      maxTokens: 1000,
      temperature: 0.5,
    }

    const response = await provider.generate(request)

    expect(response.provider).toBe('mock')
  })

  it('should always be available', async () => {
    const provider = new MockProvider('test-key')

    expect(await provider.isAvailable()).toBe(true)
  })
})
