/**
 * OpenAI provider implementation (SDD §6.3).
 * Uses the official OpenAI SDK.
 */

import OpenAI from 'openai'
import type { AIProvider, GenerateRequest, GenerateResponse, QualityMode } from '../types.js'

/**
 * OpenAI provider using the official SDK.
 */
export class OpenAIProvider implements AIProvider {
  readonly name = 'openai'
  readonly supportedModes: QualityMode[] = ['fast-draft', 'balanced', 'deep-analysis']

  private client: OpenAI

  constructor(apiKey: string) {
    if (!apiKey) {
      throw new Error('OpenAI API key is required')
    }
    this.client = new OpenAI({ apiKey })
  }

  async generate(request: GenerateRequest): Promise<GenerateResponse> {
    try {
      const response = await this.client.chat.completions.create({
        model: request.model,
        messages: [
          { role: 'system', content: request.systemPrompt },
          { role: 'user', content: request.userPrompt },
        ],
        max_tokens: request.maxTokens,
        temperature: request.temperature,
      })

      const content = response.choices[0]?.message?.content || ''
      const inputTokens = response.usage?.prompt_tokens || 0
      const outputTokens = response.usage?.completion_tokens || 0

      return {
        content,
        tokensUsed: {
          input: inputTokens,
          output: outputTokens,
          total: inputTokens + outputTokens,
        },
        model: request.model,
        provider: 'openai',
      }
    } catch (error) {
      this.handleError(error)
    }
  }

  async isAvailable(): Promise<boolean> {
    try {
      // Ping the models endpoint to verify API key and connectivity
      await this.client.models.list()
      return true
    } catch {
      return false
    }
  }

  private handleError(error: unknown): never {
    if (error instanceof Error) {
      // OpenAI SDK errors have a status property
      const statusCode = (error as Error & { status?: number }).status || 0
      const isRetryable = this.isRetryableStatus(statusCode)

      throw new Error(`OpenAI API error: ${error.message}`, {
        cause: { statusCode, provider: 'openai', retryable: isRetryable },
      })
    }
    throw new Error('Unknown OpenAI error')
  }

  private isRetryableStatus(statusCode: number): boolean {
    // Retry on 429, 500, 502, 503 (TRD §5.6.1)
    return [429, 500, 502, 503].includes(statusCode)
  }
}
