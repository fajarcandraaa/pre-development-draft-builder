/**
 * AI Gateway type definitions (SDD §6.3).
 */

/** Quality mode for document generation (from storage/schemas.ts). */
export type QualityMode = 'fast-draft' | 'balanced' | 'deep-analysis'

/** Request to generate content from an AI provider. */
export interface GenerateRequest {
  systemPrompt: string
  userPrompt: string
  model: string
  maxTokens: number
  temperature: number
}

/** Response from an AI provider. */
export interface GenerateResponse {
  content: string
  tokensUsed: {
    input: number
    output: number
    total: number
  }
  model: string
  provider: string
}

/** Interface for AI provider implementations (SDD §6.3). */
export interface AIProvider {
  /** Provider name (e.g., 'openai', 'anthropic', 'mock'). */
  readonly name: string
  /** Quality modes supported by this provider. */
  readonly supportedModes: QualityMode[]

  /**
   * Generate content using the provider's API.
   * @throws APIError on API failure
   */
  generate(request: GenerateRequest): Promise<GenerateResponse>

  /**
   * Check if the provider is available (API key valid, endpoint reachable).
   */
  isAvailable(): Promise<boolean>
}
