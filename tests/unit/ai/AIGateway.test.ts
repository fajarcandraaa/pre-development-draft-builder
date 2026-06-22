/**
 * Unit tests for AIGateway.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { AIGateway } from '../../../src/ai/AIGateway.js'
import { ProviderRegistryService } from '../../../src/ai/ProviderRegistryService.js'
import { ProviderStore } from '../../../src/storage/ProviderStore.js'
import { MockProvider } from '../../../src/ai/providers/MockProvider.js'
import type { GenerateRequest, QualityMode } from '../../../src/ai/types.js'
import type { ProviderConfig } from '../../../src/storage/schemas.js'

// Mock ProviderStore
vi.mock('../../../src/storage/ProviderStore.js', () => {
  class MockProviderStore {
    read = vi.fn()
  }
  return {
    ProviderStore: MockProviderStore,
  }
})

describe('AIGateway', () => {
  let gateway: AIGateway
  let mockProviderStore: ProviderStore
  let mockRegistry: ProviderRegistryService

  const mockConfig: ProviderConfig = {
    default: 'mock',
    encryption: 'none',
    providers: {
      mock: {
        apiKey: 'test-key',
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
    updatedAt: '2026-06-15T10:00:00Z',
  }

  beforeEach(() => {
    mockProviderStore = new ProviderStore() as any
    mockRegistry = new ProviderRegistryService()
    gateway = new AIGateway(mockRegistry, mockProviderStore)

    vi.spyOn(mockProviderStore, 'read').mockResolvedValue(mockConfig)
  })

  describe('token budget enforcement', () => {
    it('should clamp maxTokens for fast-draft mode', async () => {
      const request: GenerateRequest = {
        systemPrompt: 'Test',
        userPrompt: 'Test',
        model: 'gpt-4o',
        maxTokens: 100000, // Exceeds budget
        temperature: 0.5,
      }

      const response = await gateway.generate(request, 'fast-draft')

      // MockProvider returns the request's model in the response
      expect(response.model).toBe('gpt-4o')
    })

    it('should clamp maxTokens for balanced mode', async () => {
      const request: GenerateRequest = {
        systemPrompt: 'Test',
        userPrompt: 'Test',
        model: 'gpt-4o',
        maxTokens: 100000,
        temperature: 0.5,
      }

      await gateway.generate(request, 'balanced')
      // Token budget is 12000 for balanced
    })

    it('should clamp maxTokens for deep-analysis mode', async () => {
      const request: GenerateRequest = {
        systemPrompt: 'Test',
        userPrompt: 'Test',
        model: 'gpt-4o',
        maxTokens: 100000,
        temperature: 0.5,
      }

      await gateway.generate(request, 'deep-analysis')
      // Token budget is 24000 for deep-analysis
    })
  })

  describe('provider resolution', () => {
    it('should resolve provider from config default', async () => {
      const request: GenerateRequest = {
        systemPrompt: 'Test',
        userPrompt: 'Test',
        model: 'gpt-4o',
        maxTokens: 1000,
        temperature: 0.5,
      }

      const response = await gateway.generate(request, 'fast-draft')

      expect(response.provider).toBe('mock')
    })

    it('should throw error if no API key configured', async () => {
      vi.spyOn(mockProviderStore, 'read').mockResolvedValue({
        ...mockConfig,
        providers: {
          mock: {
            ...mockConfig.providers.mock,
            apiKey: null,
          },
        },
      })

      const request: GenerateRequest = {
        systemPrompt: 'Test',
        userPrompt: 'Test',
        model: 'gpt-4o',
        maxTokens: 1000,
        temperature: 0.5,
      }

      await expect(gateway.generate(request, 'fast-draft')).rejects.toThrow(
        'No API key configured',
      )
    })
  })

  describe('retry strategy', () => {
    it('should retry on retryable errors', async () => {
      vi.useFakeTimers()

      const mockProvider = new MockProvider('test-key')
      const generateSpy = vi.spyOn(mockProvider, 'generate')

      // First 3 attempts fail, 4th succeeds
      generateSpy
        .mockRejectedValueOnce(new Error('429'))
        .mockRejectedValueOnce(new Error('429'))
        .mockRejectedValueOnce(new Error('429'))
        .mockResolvedValueOnce({
          content: 'Success',
          tokensUsed: { input: 0, output: 0, total: 0 },
          model: 'gpt-4o',
          provider: 'mock',
        })

      const request: GenerateRequest = {
        systemPrompt: 'Test',
        userPrompt: 'Test',
        model: 'gpt-4o',
        maxTokens: 1000,
        temperature: 0.5,
      }

      // Use a custom registry with our mock provider
      const customRegistry = new ProviderRegistryService()
      vi.spyOn(customRegistry, 'getProvider').mockReturnValue(mockProvider)

      const customGateway = new AIGateway(customRegistry, mockProviderStore)

      const promise = customGateway.generate(request, 'fast-draft')

      // Fast-forward through all retry delays
      await vi.runAllTimersAsync()

      const response = await promise

      expect(generateSpy).toHaveBeenCalledTimes(4)
      expect(response.content).toBe('Success')

      vi.useRealTimers()
    })

    it('should throw error after 4 failed attempts', async () => {
      vi.useFakeTimers()

      const mockProvider = new MockProvider('test-key')
      const generateSpy = vi.spyOn(mockProvider, 'generate')

      const error = new Error('429')
      generateSpy.mockRejectedValue(error)

      const request: GenerateRequest = {
        systemPrompt: 'Test',
        userPrompt: 'Test',
        model: 'gpt-4o',
        maxTokens: 1000,
        temperature: 0.5,
      }

      const customRegistry = new ProviderRegistryService()
      vi.spyOn(customRegistry, 'getProvider').mockReturnValue(mockProvider)

      const customGateway = new AIGateway(customRegistry, mockProviderStore)

      const promise = customGateway.generate(request, 'fast-draft').catch((e) => e)

      // Fast-forward through all retry delays
      await vi.runAllTimersAsync()

      const result = await promise
      expect(result).toBe(error)
      expect(generateSpy).toHaveBeenCalledTimes(4)

      vi.useRealTimers()
    })

    it('should not retry on 401 authentication error', async () => {
      const mockProvider = new MockProvider('test-key')
      const generateSpy = vi.spyOn(mockProvider, 'generate')

      const error = new Error('401 Unauthorized')
      // Add cause with statusCode to simulate API error
      ;(error as any).cause = { statusCode: 401, provider: 'mock', retryable: false }
      generateSpy.mockRejectedValue(error)

      const request: GenerateRequest = {
        systemPrompt: 'Test',
        userPrompt: 'Test',
        model: 'gpt-4o',
        maxTokens: 1000,
        temperature: 0.5,
      }

      const customRegistry = new ProviderRegistryService()
      vi.spyOn(customRegistry, 'getProvider').mockReturnValue(mockProvider)

      const customGateway = new AIGateway(customRegistry, mockProviderStore)

      await expect(customGateway.generate(request, 'fast-draft')).rejects.toThrow('401 Unauthorized')
      expect(generateSpy).toHaveBeenCalledTimes(1) // Only 1 attempt, no retry
    })

    it('should not retry on 400 bad request error', async () => {
      const mockProvider = new MockProvider('test-key')
      const generateSpy = vi.spyOn(mockProvider, 'generate')

      const error = new Error('400 Bad Request')
      ;(error as any).cause = { statusCode: 400, provider: 'mock', retryable: false }
      generateSpy.mockRejectedValue(error)

      const request: GenerateRequest = {
        systemPrompt: 'Test',
        userPrompt: 'Test',
        model: 'gpt-4o',
        maxTokens: 1000,
        temperature: 0.5,
      }

      const customRegistry = new ProviderRegistryService()
      vi.spyOn(customRegistry, 'getProvider').mockReturnValue(mockProvider)

      const customGateway = new AIGateway(customRegistry, mockProviderStore)

      await expect(customGateway.generate(request, 'fast-draft')).rejects.toThrow('400 Bad Request')
      expect(generateSpy).toHaveBeenCalledTimes(1)
    })

    it('should not retry on 404 not found error', async () => {
      const mockProvider = new MockProvider('test-key')
      const generateSpy = vi.spyOn(mockProvider, 'generate')

      const error = new Error('404 Not Found')
      ;(error as any).cause = { statusCode: 404, provider: 'mock', retryable: false }
      generateSpy.mockRejectedValue(error)

      const request: GenerateRequest = {
        systemPrompt: 'Test',
        userPrompt: 'Test',
        model: 'gpt-4o',
        maxTokens: 1000,
        temperature: 0.5,
      }

      const customRegistry = new ProviderRegistryService()
      vi.spyOn(customRegistry, 'getProvider').mockReturnValue(mockProvider)

      const customGateway = new AIGateway(customRegistry, mockProviderStore)

      await expect(customGateway.generate(request, 'fast-draft')).rejects.toThrow('404 Not Found')
      expect(generateSpy).toHaveBeenCalledTimes(1)
    })

    it('should retry on 500 server error', async () => {
      vi.useFakeTimers()

      const mockProvider = new MockProvider('test-key')
      const generateSpy = vi.spyOn(mockProvider, 'generate')

      const error = new Error('500 Internal Server Error')
      ;(error as any).cause = { statusCode: 500, provider: 'mock', retryable: true }
      generateSpy.mockRejectedValue(error)

      const request: GenerateRequest = {
        systemPrompt: 'Test',
        userPrompt: 'Test',
        model: 'gpt-4o',
        maxTokens: 1000,
        temperature: 0.5,
      }

      const customRegistry = new ProviderRegistryService()
      vi.spyOn(customRegistry, 'getProvider').mockReturnValue(mockProvider)

      const customGateway = new AIGateway(customRegistry, mockProviderStore)

      const promise = customGateway.generate(request, 'fast-draft').catch((e) => e)

      await vi.runAllTimersAsync()

      const result = await promise
      expect(result).toBe(error)
      expect(generateSpy).toHaveBeenCalledTimes(4)

      vi.useRealTimers()
    })

    it('should retry on 502 bad gateway error', async () => {
      vi.useFakeTimers()

      const mockProvider = new MockProvider('test-key')
      const generateSpy = vi.spyOn(mockProvider, 'generate')

      const error = new Error('502 Bad Gateway')
      ;(error as any).cause = { statusCode: 502, provider: 'mock', retryable: true }
      generateSpy.mockRejectedValue(error)

      const request: GenerateRequest = {
        systemPrompt: 'Test',
        userPrompt: 'Test',
        model: 'gpt-4o',
        maxTokens: 1000,
        temperature: 0.5,
      }

      const customRegistry = new ProviderRegistryService()
      vi.spyOn(customRegistry, 'getProvider').mockReturnValue(mockProvider)

      const customGateway = new AIGateway(customRegistry, mockProviderStore)

      const promise = customGateway.generate(request, 'fast-draft').catch((e) => e)

      await vi.runAllTimersAsync()

      const result = await promise
      expect(result).toBe(error)
      expect(generateSpy).toHaveBeenCalledTimes(4)

      vi.useRealTimers()
    })

    it('should retry on 503 service unavailable error', async () => {
      vi.useFakeTimers()

      const mockProvider = new MockProvider('test-key')
      const generateSpy = vi.spyOn(mockProvider, 'generate')

      const error = new Error('503 Service Unavailable')
      ;(error as any).cause = { statusCode: 503, provider: 'mock', retryable: true }
      generateSpy.mockRejectedValue(error)

      const request: GenerateRequest = {
        systemPrompt: 'Test',
        userPrompt: 'Test',
        model: 'gpt-4o',
        maxTokens: 1000,
        temperature: 0.5,
      }

      const customRegistry = new ProviderRegistryService()
      vi.spyOn(customRegistry, 'getProvider').mockReturnValue(mockProvider)

      const customGateway = new AIGateway(customRegistry, mockProviderStore)

      const promise = customGateway.generate(request, 'fast-draft').catch((e) => e)

      await vi.runAllTimersAsync()

      const result = await promise
      expect(result).toBe(error)
      expect(generateSpy).toHaveBeenCalledTimes(4)

      vi.useRealTimers()
    })
  })

  describe('isProviderAvailable', () => {
    it('should return true if provider is available', async () => {
      const available = await gateway.isProviderAvailable('mock')

      expect(available).toBe(true)
    })

    it('should return false if no API key', async () => {
      vi.spyOn(mockProviderStore, 'read').mockResolvedValue({
        ...mockConfig,
        providers: {
          mock: {
            ...mockConfig.providers.mock,
            apiKey: null,
          },
        },
      })

      const available = await gateway.isProviderAvailable('mock')

      expect(available).toBe(false)
    })
  })
})
