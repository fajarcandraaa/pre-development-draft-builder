/**
 * Unit tests for ContextBuilder.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ContextBuilder } from '../../../src/core/ContextBuilder.js'
import { AIGateway } from '../../../src/ai/AIGateway.js'
import { FileManager } from '../../../src/storage/FileManager.js'
import { Logger } from '../../../src/utils/logger.js'
import type { BriefEvaluationResult, ClarificationSession } from '../../../src/core/types.js'

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
    writeInput = vi.fn()
  }
  return {
    FileManager: MockFileManager,
  }
})

// Mock Logger
vi.mock('../../../src/utils/logger.js', () => {
  class MockLogger {
    warning = vi.fn()
  }
  return {
    Logger: MockLogger,
  }
})

describe('ContextBuilder', () => {
  let contextBuilder: ContextBuilder
  let mockAi: AIGateway
  let mockFileManager: FileManager
  let mockLogger: Logger

  beforeEach(() => {
    mockAi = new AIGateway(undefined as any, undefined as any) as any
    mockFileManager = new FileManager('/test') as any
    mockLogger = new Logger() as any
    contextBuilder = new ContextBuilder(mockAi, mockFileManager, mockLogger)
  })

  describe('evaluateBrief', () => {
    it('should return evaluation with high score for complete brief', async () => {
      const completeBrief = `
        Project: EOffice System
        Client: PT Teknologi Indonesia
        Timeline: 6 months
        Budget: $50,000
        Stakeholders: CEO, CTO, Product Manager
        Goals: Build web-based office management system
        Constraints: Must use React, Node.js
        Success Criteria: System handles 1000 concurrent users
      `

      const mockResponse = {
        content: JSON.stringify({
          completenessScore: 9,
          missingFields: [],
          questions: [],
        }),
        tokensUsed: { input: 100, output: 50, total: 150 },
        model: 'gpt-4o',
        provider: 'mock',
      }

      vi.spyOn(mockAi, 'generate').mockResolvedValue(mockResponse)

      const result = await contextBuilder.evaluateBrief(completeBrief)

      expect(result.completenessScore).toBe(9)
      expect(result.missingFields).toEqual([])
      expect(result.questions).toEqual([])
    })

    it('should return evaluation with low score for incomplete brief', async () => {
      const incompleteBrief = 'Project: EOffice System'

      const mockResponse = {
        content: JSON.stringify({
          completenessScore: 3,
          missingFields: ['stakeholders', 'timeline', 'constraints'],
          questions: [
            { field: 'stakeholders', question: 'Who are the stakeholders?', required: true },
            { field: 'timeline', question: 'What is the timeline?', required: true },
            { field: 'constraints', question: 'Any constraints?', required: false },
          ],
        }),
        tokensUsed: { input: 50, output: 30, total: 80 },
        model: 'gpt-4o',
        provider: 'mock',
      }

      vi.spyOn(mockAi, 'generate').mockResolvedValue(mockResponse)

      const result = await contextBuilder.evaluateBrief(incompleteBrief)

      expect(result.completenessScore).toBe(3)
      expect(result.missingFields).toContain('stakeholders')
      expect(result.questions.length).toBeGreaterThan(0)
    })

    it('should return fallback evaluation for empty brief', async () => {
      const result = await contextBuilder.evaluateBrief('')

      expect(result.completenessScore).toBe(3)
      expect(result.missingFields).toContain('stakeholders')
      expect(result.questions.length).toBe(5)
    })

    it('should return fallback evaluation when AI fails', async () => {
      vi.spyOn(mockAi, 'generate').mockRejectedValue(new Error('AI failed'))

      const result = await contextBuilder.evaluateBrief('Some brief')

      expect(result.completenessScore).toBe(3)
      expect(result.questions.length).toBe(5)
      expect(mockLogger.warning).toHaveBeenCalled()
    })

    it('should parse JSON wrapped in markdown', async () => {
      const brief = 'Project: Test'

      const mockResponse = {
        content: '```json\n{"completenessScore": 7, "missingFields": [], "questions": []}\n```',
        tokensUsed: { input: 50, output: 30, total: 80 },
        model: 'gpt-4o',
        provider: 'mock',
      }

      vi.spyOn(mockAi, 'generate').mockResolvedValue(mockResponse)

      const result = await contextBuilder.evaluateBrief(brief)

      expect(result.completenessScore).toBe(7)
    })
  })

  describe('runInteractiveMode', () => {
    it('should skip interactive mode when flag is set', async () => {
      const result = await contextBuilder.runInteractiveMode('Brief', { skipInteractive: true })

      expect(result.skipped).toBe(true)
      expect(result.questions).toEqual([])
      expect(result.answers).toEqual({})
    })

    it('should use pre-answers when provided', async () => {
      const preAnswers = { stakeholders: 'CEO, CTO', timeline: '6 months' }

      const mockEvaluation: BriefEvaluationResult = {
        completenessScore: 5,
        missingFields: ['stakeholders', 'timeline'],
        questions: [
          { field: 'stakeholders', question: 'Who are stakeholders?', required: true },
          { field: 'timeline', question: 'What is timeline?', required: true },
        ],
      }

      vi.spyOn(contextBuilder, 'evaluateBrief').mockResolvedValue(mockEvaluation)

      const result = await contextBuilder.runInteractiveMode('Brief', { preAnswers })

      expect(result.skipped).toBe(false)
      expect(result.answers).toEqual(preAnswers)
      expect(result.questions).toEqual(mockEvaluation.questions)
    })

    it('should return empty session when brief is complete', async () => {
      const mockEvaluation: BriefEvaluationResult = {
        completenessScore: 10,
        missingFields: [],
        questions: [],
      }

      vi.spyOn(contextBuilder, 'evaluateBrief').mockResolvedValue(mockEvaluation)

      const result = await contextBuilder.runInteractiveMode('Complete brief')

      expect(result.questions).toEqual([])
      expect(result.answers).toEqual({})
      expect(result.skipped).toBe(false)
    })

    it('should limit questions to 5', async () => {
      const mockEvaluation: BriefEvaluationResult = {
        completenessScore: 2,
        missingFields: ['a', 'b', 'c', 'd', 'e', 'f', 'g'],
        questions: [
          { field: 'a', question: 'Q1', required: true },
          { field: 'b', question: 'Q2', required: true },
          { field: 'c', question: 'Q3', required: true },
          { field: 'd', question: 'Q4', required: true },
          { field: 'e', question: 'Q5', required: true },
          { field: 'f', question: 'Q6', required: true },
          { field: 'g', question: 'Q7', required: true },
        ],
      }

      vi.spyOn(contextBuilder, 'evaluateBrief').mockResolvedValue(mockEvaluation)

      // Mock promptUser to return answers
      vi.spyOn(contextBuilder as any, 'promptUser').mockResolvedValue('Answer')

      const result = await contextBuilder.runInteractiveMode('Brief')

      expect(result.questions.length).toBe(5)
    })
  })

  describe('buildEnrichedBrief', () => {
    it('should return original brief when session is skipped', async () => {
      const brief = 'Original brief content'
      const session: ClarificationSession = {
        questions: [],
        answers: {},
        skipped: true,
      }

      const result = await contextBuilder.buildEnrichedBrief(brief, session)

      expect(result).toBe(brief)
    })

    it('should return original brief when no answers', async () => {
      const brief = 'Original brief content'
      const session: ClarificationSession = {
        questions: [],
        answers: {},
        skipped: false,
      }

      const result = await contextBuilder.buildEnrichedBrief(brief, session)

      expect(result).toBe(brief)
    })

    it('should append answers to brief', async () => {
      const brief = 'Original brief content'
      const session: ClarificationSession = {
        questions: [
          { field: 'stakeholders', question: 'Who?', required: true },
          { field: 'timeline', question: 'When?', required: true },
        ],
        answers: {
          stakeholders: 'CEO, CTO',
          timeline: '6 months',
        },
        skipped: false,
      }

      const result = await contextBuilder.buildEnrichedBrief(brief, session)

      expect(result).toContain('Original brief content')
      expect(result).toContain('## Additional Clarifications')
      expect(result).toContain('**stakeholders:** CEO, CTO')
      expect(result).toContain('**timeline:** 6 months')
    })
  })

  describe('buildContext', () => {
    it('should generate context from brief', async () => {
      const brief = 'Project: EOffice System'
      const mockResponse = {
        content: '# Project Context\n## Brief Summary\nEOffice System project\n...',
        tokensUsed: { input: 100, output: 200, total: 300 },
        model: 'gpt-4o',
        provider: 'mock',
      }

      vi.spyOn(mockAi, 'generate').mockResolvedValue(mockResponse)

      const result = await contextBuilder.buildContext(brief)

      expect(result).toContain('# Project Context')
      expect(result).toContain('## Brief Summary')
    })

    it('should include answers in context generation', async () => {
      const brief = 'Project: EOffice'
      const answers = { stakeholders: 'CEO, CTO' }
      const mockResponse = {
        content: '# Project Context\n## Stakeholders\nCEO, CTO\n...',
        tokensUsed: { input: 100, output: 200, total: 300 },
        model: 'gpt-4o',
        provider: 'mock',
      }

      vi.spyOn(mockAi, 'generate').mockResolvedValue(mockResponse)

      await contextBuilder.buildContext(brief, answers)

      const call = vi.mocked(mockAi.generate).mock.calls[0]
      expect(call[0].userPrompt).toContain('stakeholders: CEO, CTO')
    })
  })

  describe('saveContext', () => {
    it('should write context using FileManager', async () => {
      const contextContent = '# Project Context\n...'

      await contextBuilder.saveContext('/test/project', contextContent)

      expect(mockFileManager.writeInput).toHaveBeenCalledWith('context.md', contextContent)
    })
  })
})
