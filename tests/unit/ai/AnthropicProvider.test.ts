/**
 * Unit tests for AnthropicProvider (with mocked SDK).
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { AnthropicProvider } from '../../../src/ai/providers/AnthropicProvider.js'
import type { GenerateRequest } from '../../../src/ai/types.js'

// Mock the Anthropic SDK
const mockMessagesCreate = vi.fn()

vi.mock('@anthropic-ai/sdk', () => {
  class MockAnthropic {
    messages = {
      create: mockMessagesCreate,
    }
  }
  return {
    default: MockAnthropic,
  }
})

describe('AnthropicProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should have correct name and supported modes', () => {
    const provider = new AnthropicProvider('test-key')

    expect(provider.name).toBe('anthropic')
    expect(provider.supportedModes).toEqual(['fast-draft', 'balanced', 'deep-analysis'])
  })

  it('should call Anthropic SDK with correct parameters', async () => {
    mockMessagesCreate.mockResolvedValue({
      content: [{ type: 'text', text: 'Test response' }],
      usage: { input_tokens: 10, output_tokens: 20 },
    })

    const provider = new AnthropicProvider('test-key')
    const request: GenerateRequest = {
      systemPrompt: 'You are a test assistant.',
      userPrompt: 'Generate test content.',
      model: 'claude-sonnet-4-6',
      maxTokens: 1000,
      temperature: 0.5,
    }

    const response = await provider.generate(request)

    expect(mockMessagesCreate).toHaveBeenCalledWith({
      model: 'claude-sonnet-4-6',
      max_tokens: 1000,
      system: 'You are a test assistant.',
      messages: [{ role: 'user', content: 'Generate test content.' }],
      temperature: 0.5,
    })

    expect(response.content).toBe('Test response')
    expect(response.tokensUsed).toEqual({ input: 10, output: 20, total: 30 })
    expect(response.model).toBe('claude-sonnet-4-6')
    expect(response.provider).toBe('anthropic')
  })

  it('should return true on successful ping', async () => {
    mockMessagesCreate.mockResolvedValue({
      content: [{ type: 'text', text: 'pong' }],
    })

    const provider = new AnthropicProvider('test-key')

    expect(await provider.isAvailable()).toBe(true)
  })

  it('should return false on failed ping', async () => {
    mockMessagesCreate.mockRejectedValue(new Error('API error'))

    const provider = new AnthropicProvider('test-key')

    expect(await provider.isAvailable()).toBe(false)
  })
})
