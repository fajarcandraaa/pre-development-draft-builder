/**
 * Unit tests for ProviderRegistryService.
 */

import { describe, it, expect } from 'vitest'
import { ProviderRegistryService } from '../../../src/ai/ProviderRegistryService.js'
import { MockProvider } from '../../../src/ai/providers/MockProvider.js'

describe('ProviderRegistryService', () => {
  it('should list all available providers', () => {
    const service = new ProviderRegistryService()
    const providers = service.listAvailable()

    expect(providers).toEqual(['openai', 'anthropic', 'dinoiki', 'mock'])
  })

  it('should return true for registered providers', () => {
    const service = new ProviderRegistryService()

    expect(service.isRegistered('openai')).toBe(true)
    expect(service.isRegistered('anthropic')).toBe(true)
    expect(service.isRegistered('mock')).toBe(true)
  })

  it('should return false for unregistered providers', () => {
    const service = new ProviderRegistryService()

    expect(service.isRegistered('invalid')).toBe(false)
    expect(service.isRegistered('')).toBe(false)
  })

  it('should get provider instance for registered name', () => {
    const service = new ProviderRegistryService()
    const provider = service.getProvider('mock', 'test-key')

    expect(provider).toBeInstanceOf(MockProvider)
    expect(provider.name).toBe('mock')
  })

  it('should throw error for unregistered provider', () => {
    const service = new ProviderRegistryService()

    expect(() => service.getProvider('invalid', 'test-key')).toThrow(
      "Provider 'invalid' is not registered",
    )
  })
})
