/**
 * Anthropic provider implementation (SDD §6.3).
 * Uses the official Anthropic SDK.
 */

import Anthropic from '@anthropic-ai/sdk'
import type { AIProvider, GenerateRequest, GenerateResponse, QualityMode } from '../types.js'

/**
 * Anthropic provider using the official SDK.
 */
export class AnthropicProvider implements AIProvider {
  readonly name = 'anthropic'
  readonly supportedModes: QualityMode[] = ['fast-draft', 'balanced', 'deep-analysis']

  private client: Anthropic

  constructor(apiKey: string) {
    if (!apiKey) {
      throw new Error('Anthropic API key is required')
    }
    this.client = new Anthropic({ apiKey })
  }

  async generate(request: GenerateRequest): Promise<GenerateResponse> {
    try {
      const response = await this.client.messages.create({
        model: request.model,
        max_tokens: request.maxTokens,
        system: request.systemPrompt,
        messages: [{ role: 'user', content: request.userPrompt }],
        temperature: request.temperature,
      })

      const content = response.content[0]?.type === 'text' ? response.content[0].text : ''
      const inputTokens = response.usage?.input_tokens || 0
      const outputTokens = response.usage?.output_tokens || 0

      return {
        content,
        tokensUsed: {
          input: inputTokens,
          output: outputTokens,
          total: inputTokens + outputTokens,
        },
        model: request.model,
        provider: 'anthropic',
      }
    } catch (error) {
      this.handleError(error)
    }
  }

  async isAvailable(): Promise<boolean> {
    try {
      // Ping with a minimal message to verify API key and connectivity
      await this.client.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1,
        messages: [{ role: 'user', content: 'ping' }],
      })
      return true
    } catch {
      return false
    }
  }

  private handleError(error: unknown): never {
    if (error instanceof Error) {
      // Anthropic SDK errors have a status property
      const statusCode = (error as Error & { status?: number }).status || 0
      const isRetryable = this.isRetryableStatus(statusCode)

      throw new Error(`Anthropic API error: ${error.message}`, {
        cause: { statusCode, provider: 'anthropic', retryable: isRetryable },
      })
    }
    throw new Error('Unknown Anthropic error')
  }

  private isRetryableStatus(statusCode: number): boolean {
    // Retry on 429, 500, 502, 503 (TRD §5.6.1)
    return [429, 500, 502, 503].includes(statusCode)
  }
}
