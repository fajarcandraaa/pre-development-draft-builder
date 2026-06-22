/**
 * Mock AI provider for testing and dry-run mode (SDD §6.3).
 * Returns placeholder content without making API calls.
 */

import type { AIProvider, GenerateRequest, GenerateResponse, QualityMode } from '../types.js'

/**
 * Mock provider that returns placeholder content.
 * Used for --dry-run flag and unit tests.
 */
export class MockProvider implements AIProvider {
  readonly name = 'mock'
  readonly supportedModes: QualityMode[] = ['fast-draft', 'balanced', 'deep-analysis']

  constructor(_apiKey: string) {
    // API key ignored for mock provider
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    void _apiKey
  }

  async generate(request: GenerateRequest): Promise<GenerateResponse> {
    return {
      content: `[DRY RUN / MOCK] Dokumen akan dihasilkan menggunakan model ${request.model}.`,
      tokensUsed: { input: 0, output: 0, total: 0 },
      model: request.model,
      provider: 'mock',
    }
  }

  async isAvailable(): Promise<boolean> {
    return true
  }
}
