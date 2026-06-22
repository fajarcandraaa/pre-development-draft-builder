/**
 * Unit tests for QualityGate.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { QualityGate } from '../../../src/core/QualityGate.js'
import { AIGateway } from '../../../src/ai/AIGateway.js'
import { FileManager } from '../../../src/storage/FileManager.js'
import { Logger } from '../../../src/utils/logger.js'
import type { QualityMode } from '../../../src/ai/types.js'

// Mock AIGateway
vi.mock('../../../src/ai/AIGateway.js', () => {
  class MockAIGateway {
    constructor(..._args: any[]) {
      // Accept any constructor args for testing
    }
    generate = vi.fn()
  }
  return {
    AIGateway: MockAIGateway,
  }
})

// Mock FileManager
vi.mock('../../../src/storage/FileManager.js', () => {
  class MockFileManager {
    writeReview = vi.fn()
  }
  return {
    FileManager: MockFileManager,
  }
})

// Mock Logger
vi.mock('../../../src/utils/logger.js', () => {
  class MockLogger {
    error = vi.fn()
  }
  return {
    Logger: MockLogger,
  }
})

describe('QualityGate', () => {
  let qualityGate: QualityGate
  let mockAi: AIGateway
  let mockFileManager: FileManager
  let mockLogger: Logger

  beforeEach(() => {
    mockAi = new AIGateway(undefined as any, undefined as any) as any
    mockFileManager = new FileManager('/test') as any
    mockLogger = new Logger() as any
    qualityGate = new QualityGate(mockAi, mockFileManager, mockLogger)
  })

  describe('run', () => {
    it('should run quality check with AI', async () => {
      const doc = {
        id: 'brd' as const,
        order: 2,
        stage: 1 as const,
        filename: '02-brd.md',
        displayName: 'BRD',
        rolePersona: 'Business Analyst',
        promptTemplateFile: 'templates/02-brd.prompt.md',
        dependsOn: ['discovery-notes' as const],
      }

      const docContent = '# BRD\n\nThis is a business requirements document.'
      const context = {
        previousDocs: {},
        state: {},
      }

      const mockResponse = {
        content: JSON.stringify({
          completeness: 8,
          consistency: 7,
          risks: ['Risk 1'],
          requiredDecisions: ['Decision 1'],
          reviewerNotes: 'Good document.',
        }),
        tokensUsed: { input: 100, output: 200, total: 300 },
        model: 'gpt-4o',
        provider: 'mock',
      }

      vi.spyOn(mockAi, 'generate').mockResolvedValue(mockResponse)

      const result = await qualityGate.run(doc, docContent, context, 'balanced')

      expect(result.completeness).toBe(8)
      expect(result.consistency).toBe(7)
      expect(result.confidence).toBe(8)
      expect(result.risks).toEqual(['Risk 1'])
      expect(result.requiredDecisions).toEqual(['Decision 1'])
      expect(mockAi.generate).toHaveBeenCalled()
    })

    it('should handle JSON parsing errors gracefully', async () => {
      const doc = {
        id: 'brd' as const,
        order: 2,
        stage: 1 as const,
        filename: '02-brd.md',
        displayName: 'BRD',
        rolePersona: 'Business Analyst',
        promptTemplateFile: 'templates/02-brd.prompt.md',
        dependsOn: [],
      }

      const docContent = '# BRD'
      const context = {
        previousDocs: {},
        state: {},
      }

      const mockResponse = {
        content: 'Invalid JSON response',
        tokensUsed: { input: 100, output: 200, total: 300 },
        model: 'gpt-4o',
        provider: 'mock',
      }

      vi.spyOn(mockAi, 'generate').mockResolvedValue(mockResponse)

      const result = await qualityGate.run(doc, docContent, context, 'balanced')

      expect(result.completeness).toBe(5)
      expect(result.consistency).toBe(5)
      expect(result.confidence).toBe(5)
      expect(result.risks).toContain('Unable to parse AI response')
    })

    it('should normalize scores to 1-10 range', async () => {
      const doc = {
        id: 'brd' as const,
        order: 2,
        stage: 1 as const,
        filename: '02-brd.md',
        displayName: 'BRD',
        rolePersona: 'Business Analyst',
        promptTemplateFile: 'templates/02-brd.prompt.md',
        dependsOn: [],
      }

      const docContent = '# BRD'
      const context = {
        previousDocs: {},
        state: {},
      }

      const mockResponse = {
        content: JSON.stringify({
          completeness: 15,
          consistency: -5,
          risks: [],
          requiredDecisions: [],
          reviewerNotes: '',
        }),
        tokensUsed: { input: 100, output: 200, total: 300 },
        model: 'gpt-4o',
        provider: 'mock',
      }

      vi.spyOn(mockAi, 'generate').mockResolvedValue(mockResponse)

      const result = await qualityGate.run(doc, docContent, context, 'balanced')

      expect(result.completeness).toBe(10)
      expect(result.consistency).toBe(1)
      expect(result.confidence).toBe(6)
    })

    it('should include previous documents in prompt', async () => {
      const doc = {
        id: 'brd' as const,
        order: 2,
        stage: 1 as const,
        filename: '02-brd.md',
        displayName: 'BRD',
        rolePersona: 'Business Analyst',
        promptTemplateFile: 'templates/02-brd.prompt.md',
        dependsOn: [],
      }

      const docContent = '# BRD'
      const context = {
        previousDocs: {
          'discovery-notes': '# Discovery Notes\n\nContent...',
        },
        state: {},
      }

      const mockResponse = {
        content: JSON.stringify({
          completeness: 8,
          consistency: 8,
          risks: [],
          requiredDecisions: [],
          reviewerNotes: '',
        }),
        tokensUsed: { input: 100, output: 200, total: 300 },
        model: 'gpt-4o',
        provider: 'mock',
      }

      vi.spyOn(mockAi, 'generate').mockResolvedValue(mockResponse)

      await qualityGate.run(doc, docContent, context, 'balanced')

      const call = vi.mocked(mockAi.generate).mock.calls[0]
      expect(call[0].userPrompt).toContain('Previous Documents Context')
      expect(call[0].userPrompt).toContain('discovery-notes')
    })
  })

  describe('saveReport', () => {
    it('should save quality gate report', async () => {
      const doc = {
        id: 'brd' as const,
        order: 2,
        stage: 1 as const,
        filename: '02-brd.md',
        displayName: 'BRD',
        rolePersona: 'Business Analyst',
        promptTemplateFile: 'templates/02-brd.prompt.md',
        dependsOn: [],
      }

      const result = {
        completeness: 8,
        consistency: 7,
        risks: ['Risk 1'],
        requiredDecisions: ['Decision 1'],
        reviewerNotes: 'Good document.',
        confidence: 8,
      }

      await qualityGate.saveReport(doc, result)

      expect(mockFileManager.writeReview).toHaveBeenCalledWith(
        'brd',
        expect.stringContaining('# Quality Gate Report: BRD'),
      )
    })

    it('should format report with all sections', async () => {
      const doc = {
        id: 'brd' as const,
        order: 2,
        stage: 1 as const,
        filename: '02-brd.md',
        displayName: 'BRD',
        rolePersona: 'Business Analyst',
        promptTemplateFile: 'templates/02-brd.prompt.md',
        dependsOn: [],
      }

      const result = {
        completeness: 8,
        consistency: 7,
        risks: ['Risk 1', 'Risk 2'],
        requiredDecisions: ['Decision 1'],
        reviewerNotes: 'Review notes.',
        confidence: 8,
      }

      await qualityGate.saveReport(doc, result)

      const call = vi.mocked(mockFileManager.writeReview).mock.calls[0]
      const report = call[1]

      expect(report).toContain('## Scores')
      expect(report).toContain('**Completeness:** 8/10')
      expect(report).toContain('**Consistency:** 7/10')
      expect(report).toContain('**Confidence:** 8/10')
      expect(report).toContain('## Risks')
      expect(report).toContain('Risk 1')
      expect(report).toContain('## Required Decisions')
      expect(report).toContain('Decision 1')
      expect(report).toContain('## Reviewer Notes')
    })
  })

  describe('confidence calculation', () => {
    it('should calculate confidence as average of completeness and consistency', async () => {
      const doc = {
        id: 'brd' as const,
        order: 2,
        stage: 1 as const,
        filename: '02-brd.md',
        displayName: 'BRD',
        rolePersona: 'Business Analyst',
        promptTemplateFile: 'templates/02-brd.prompt.md',
        dependsOn: [],
      }

      const docContent = '# BRD'
      const context = {
        previousDocs: {},
        state: {},
      }

      const mockResponse = {
        content: JSON.stringify({
          completeness: 9,
          consistency: 7,
          risks: [],
          requiredDecisions: [],
          reviewerNotes: '',
        }),
        tokensUsed: { input: 100, output: 200, total: 300 },
        model: 'gpt-4o',
        provider: 'mock',
      }

      vi.spyOn(mockAi, 'generate').mockResolvedValue(mockResponse)

      const result = await qualityGate.run(doc, docContent, context, 'balanced')

      expect(result.confidence).toBe(8) // (9 + 7) / 2 = 8
    })
  })
})
