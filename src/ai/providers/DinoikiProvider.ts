/**
 * Dinoiki AI Gateway provider implementation.
 * Fully OpenAI-compatible — uses the official OpenAI SDK pointed at
 * https://ai.dinoiki.com/v1 which proxies 50+ models (GPT, Claude,
 * Gemini, DeepSeek, Grok, Kimi, GLM) under a single API key.
 */

import OpenAI from 'openai'
import type { AIProvider, GenerateRequest, GenerateResponse, QualityMode } from '../types.js'

/**
 * Dinoiki AI Gateway provider.
 * Drop-in OpenAI-compatible provider — only the baseURL differs.
 */
export class DinoikiProvider implements AIProvider {
  readonly name = 'dinoiki'
  readonly supportedModes: QualityMode[] = ['fast-draft', 'balanced', 'deep-analysis']

  private client: OpenAI

  constructor(apiKey: string) {
    if (!apiKey) {
      throw new Error('Dinoiki API key is required')
    }
    this.client = new OpenAI({
      apiKey,
      baseURL: 'https://ai.dinoiki.com/v1',
    })
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
        provider: 'dinoiki',
      }
    } catch (error) {
      this.handleError(error)
    }
  }

  async isAvailable(): Promise<boolean> {
    try {
      const res = await fetch('https://dinoiki.com/api/ai/models')
      return res.ok
    } catch {
      return false
    }
  }

  private handleError(error: unknown): never {
    if (error instanceof Error) {
      const statusCode = (error as Error & { status?: number }).status || 0
      const isRetryable = this.isRetryableStatus(statusCode)

      throw new Error(`Dinoiki API error: ${error.message}`, {
        cause: { statusCode, provider: 'dinoiki', retryable: isRetryable },
      })
    }
    throw new Error('Unknown Dinoiki error')
  }

  private isRetryableStatus(statusCode: number): boolean {
    return [429, 500, 502, 503].includes(statusCode)
  }
}
