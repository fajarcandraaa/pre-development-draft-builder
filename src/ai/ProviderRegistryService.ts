/**
 * Provider registry service (SDD §6.3).
 * Manages registration and instantiation of AI providers.
 */

import type { AIProvider } from './types.js'
import { OpenAIProvider } from './providers/OpenAIProvider.js'
import { AnthropicProvider } from './providers/AnthropicProvider.js'
import { DinoikiProvider } from './providers/DinoikiProvider.js'
import { MockProvider } from './providers/MockProvider.js'

/**
 * Registry of available AI providers.
 * Maps provider name to provider class constructor.
 */
const PROVIDER_REGISTRY = new Map<string, new (apiKey: string) => AIProvider>([
  ['openai', OpenAIProvider],
  ['anthropic', AnthropicProvider],
  ['dinoiki', DinoikiProvider],
  ['mock', MockProvider as new (apiKey: string) => AIProvider],
])

/**
 * Service for managing AI provider registration and instantiation.
 * Uses dependency injection pattern (no singletons).
 */
export class ProviderRegistryService {
  /**
   * Get a provider instance by name.
   * @param name - Provider name (e.g., 'openai', 'anthropic', 'mock')
   * @param apiKey - API key for the provider (ignored for MockProvider)
   * @throws Error if provider is not registered
   */
  getProvider(name: string, apiKey: string): AIProvider {
    const ProviderClass = PROVIDER_REGISTRY.get(name)
    if (!ProviderClass) {
      throw new Error(`Provider '${name}' is not registered`)
    }
    return new ProviderClass(apiKey)
  }

  /**
   * List all registered provider names.
   */
  listAvailable(): string[] {
    return Array.from(PROVIDER_REGISTRY.keys())
  }

  /**
   * Check if a provider is registered.
   */
  isRegistered(name: string): boolean {
    return PROVIDER_REGISTRY.has(name)
  }
}
