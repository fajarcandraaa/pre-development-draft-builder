/**
 * Unit tests for OpenAIProvider (with mocked SDK).
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { OpenAIProvider } from '../../../src/ai/providers/OpenAIProvider.js'
import type { GenerateRequest } from '../../../src/ai/types.js'

// Mock the OpenAI SDK
const mockChatCompletionsCreate = vi.fn()
const mockModelsList = vi.fn()

vi.mock('openai', () => {
  class MockOpenAI {
    chat = {
      completions: {
        create: mockChatCompletionsCreate,
      },
    }
    models = {
      list: mockModelsList,
    }
  }
  return {
    default: MockOpenAI,
  }
})

describe('OpenAIProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should have correct name and supported modes', () => {
    const provider = new OpenAIProvider('test-key')

    expect(provider.name).toBe('openai')
    expect(provider.supportedModes).toEqual(['fast-draft', 'balanced', 'deep-analysis'])
  })

  it('should call OpenAI SDK with correct parameters', async () => {
    mockChatCompletionsCreate.mockResolvedValue({
      choices: [{ message: { content: 'Test response' } }],
      usage: { prompt_tokens: 10, completion_tokens: 20 },
    })

    const provider = new OpenAIProvider('test-key')
    const request: GenerateRequest = {
      systemPrompt: 'You are a test assistant.',
      userPrompt: 'Generate test content.',
      model: 'gpt-4o',
      maxTokens: 1000,
      temperature: 0.5,
    }

    const response = await provider.generate(request)

    expect(mockChatCompletionsCreate).toHaveBeenCalledWith({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: 'You are a test assistant.' },
        { role: 'user', content: 'Generate test content.' },
      ],
      max_tokens: 1000,
      temperature: 0.5,
    })

    expect(response.content).toBe('Test response')
    expect(response.tokensUsed).toEqual({ input: 10, output: 20, total: 30 })
    expect(response.model).toBe('gpt-4o')
    expect(response.provider).toBe('openai')
  })

  it('should return true on successful ping', async () => {
    mockModelsList.mockResolvedValue({})

    const provider = new OpenAIProvider('test-key')

    expect(await provider.isAvailable()).toBe(true)
  })

  it('should return false on failed ping', async () => {
    mockModelsList.mockRejectedValue(new Error('API error'))

    const provider = new OpenAIProvider('test-key')

    expect(await provider.isAvailable()).toBe(false)
  })
})
