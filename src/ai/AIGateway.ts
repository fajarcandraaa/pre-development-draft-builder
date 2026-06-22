/**
 * AI Gateway facade (SDD §6.3).
 * Provides provider resolution, token budget enforcement, and retry strategy.
 */

import type { AIProvider, GenerateRequest, GenerateResponse, QualityMode } from './types.js'
import { ProviderRegistryService } from './ProviderRegistryService.js'
import { ProviderStore } from '../storage/ProviderStore.js'
import { ProviderNotConfiguredError } from '../core/errors.js'

/**
 * Token budget limits per quality mode (TRD §5.5.3).
 */
const TOKEN_BUDGET: Record<QualityMode, number> = {
  'fast-draft': 6000,
  balanced: 12000,
  'deep-analysis': 24000,
}

/**
 * Retry delays in milliseconds (TRD §5.6.1).
 */
const RETRY_DELAYS = [0, 2000, 5000, 10000]

/**
 * Status codes that should NOT trigger retry (TRD §5.6.1).
 */
const NON_RETRYABLE_STATUS_CODES = [400, 401, 404]

/**
 * AI Gateway facade.
 * Resolves provider, applies token budget, and manages retry strategy.
 */
export class AIGateway {
  constructor(
    private providerRegistry: ProviderRegistryService,
    private providerStore: ProviderStore,
  ) {}

  /**
   * Generate content using the active provider.
   * @param request - Generation request
   * @param mode - Quality mode for token budget
   * @throws APIError on API failure after retries
   * @throws ProviderNotConfiguredError if provider has no API key
   */
  async generate(request: GenerateRequest, mode: QualityMode): Promise<GenerateResponse> {
    const provider = await this.resolveProvider()
    const apiKey = await this.resolveApiKey(provider.name)

    if (!apiKey) {
      throw new ProviderNotConfiguredError(
        `No API key configured for provider '${provider.name}'. Set it via environment variable or 'docbuilder provider add'.`,
      )
    }

    const providerInstance = this.providerRegistry.getProvider(provider.name, apiKey)
    const clampedRequest = this.applyTokenBudget(request, mode)

    return this.generateWithRetry(providerInstance, clampedRequest)
  }

  /**
   * Check if a provider is available (API key valid, endpoint reachable).
   * @param providerName - Provider name (uses default if not specified)
   */
  async isProviderAvailable(providerName?: string): Promise<boolean> {
    const name = providerName || (await this.resolveProvider()).name
    const apiKey = await this.resolveApiKey(name)

    if (!apiKey) {
      return false
    }

    const provider = this.providerRegistry.getProvider(name, apiKey)
    return provider.isAvailable()
  }

  /**
   * Resolve the active provider from config.
   * @throws ProviderNotConfiguredError if config is invalid
   */
  private async resolveProvider(): Promise<{ name: string }> {
    const config = await this.providerStore.read()
    return { name: config.default }
  }

  /**
   * Resolve API key for a provider (env var takes precedence).
   * @param providerName - Provider name
   * @returns API key or null if not configured
   */
  private async resolveApiKey(providerName: string): Promise<string | null> {
    // Priority 1: Environment variable (TRD §5.3.4)
    const envVar = this.getEnvVarForProvider(providerName)
    if (envVar) {
      return envVar
    }

    // Priority 2: provider.json
    const config = await this.providerStore.read()
    const entry = config.providers[providerName]
    return entry?.apiKey || null
  }

  /**
   * Get environment variable for a provider.
   */
  private getEnvVarForProvider(providerName: string): string | undefined {
    switch (providerName) {
      case 'openai':
        return process.env.OPENAI_API_KEY
      case 'anthropic':
        return process.env.ANTHROPIC_API_KEY
      case 'dinoiki':
        return process.env.DINOIKI_API_KEY
      default:
        return undefined
    }
  }

  /**
   * Apply token budget clamping to request.
   * @param request - Original request
   * @param mode - Quality mode
   * @returns Request with clamped maxTokens
   */
  private applyTokenBudget(request: GenerateRequest, mode: QualityMode): GenerateRequest {
    const budget = TOKEN_BUDGET[mode]
    return {
      ...request,
      maxTokens: Math.min(request.maxTokens, budget),
    }
  }

  /**
   * Generate with retry strategy (4 attempts with exponential backoff).
   * @param provider - Provider instance
   * @param request - Generation request
   * @throws Error after 4 failed attempts
   */
  private async generateWithRetry(
    provider: AIProvider,
    request: GenerateRequest,
  ): Promise<GenerateResponse> {
    let lastError: Error | null = null

    for (let attempt = 0; attempt < RETRY_DELAYS.length; attempt++) {
      const delay = RETRY_DELAYS[attempt]

      if (attempt > 0) {
        await this.sleep(delay)
      }

      try {
        return await provider.generate(request)
      } catch (error) {
        lastError = error as Error

        // Extract status code from error if available
        const statusCode = this.extractStatusCode(error)

        // Don't retry on non-retryable status codes
        if (statusCode && NON_RETRYABLE_STATUS_CODES.includes(statusCode)) {
          throw error
        }

        // Don't retry on the last attempt
        if (attempt === RETRY_DELAYS.length - 1) {
          throw error
        }

        // Continue to next attempt for retryable errors
        continue
      }
    }

    // This should never be reached, but TypeScript needs it
    throw lastError || new Error('Generate failed after retries')
  }

  /**
   * Extract HTTP status code from error.
   */
  private extractStatusCode(error: unknown): number | null {
    if (error instanceof Error) {
      const cause = (error as Error & { cause?: { statusCode?: number } }).cause
      if (cause && typeof cause.statusCode === 'number') {
        return cause.statusCode
      }
    }
    return null
  }

  /**
   * Sleep for a specified duration.
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }
}
