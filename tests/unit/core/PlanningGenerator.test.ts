/**
 * Unit tests for PlanningGenerator.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { PlanningGenerator } from '../../../src/core/PlanningGenerator.js'
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
    writePlanning = vi.fn()
  }
  return {
    FileManager: MockFileManager,
  }
})

// Mock Logger
vi.mock('../../../src/utils/logger.js', () => {
  class MockLogger {}
  return {
    Logger: MockLogger,
  }
})

describe('PlanningGenerator', () => {
  let planningGenerator: PlanningGenerator
  let mockAi: AIGateway
  let mockFileManager: FileManager
  let mockLogger: Logger

  beforeEach(() => {
    mockAi = new AIGateway(undefined as any, undefined as any) as any
    mockFileManager = new FileManager('/test') as any
    mockLogger = new Logger() as any
    planningGenerator = new PlanningGenerator(mockAi, mockFileManager, mockLogger)
  })

  describe('estimateDuration', () => {
    it('should estimate duration for fast-draft mode', () => {
      const result = planningGenerator.estimateDuration('fast-draft')
      expect(result.perDocument['discovery-notes']).toBe(2)
      expect(result.perDocument.brd).toBe(3)
      expect(result.total).toBeGreaterThan(0)
    })

    it('should estimate duration for balanced mode', () => {
      const result = planningGenerator.estimateDuration('balanced')
      expect(result.perDocument['discovery-notes']).toBe(5)
      expect(result.perDocument.brd).toBe(7)
      expect(result.total).toBeGreaterThan(0)
    })

    it('should estimate duration for deep-analysis mode', () => {
      const result = planningGenerator.estimateDuration('deep-analysis')
      expect(result.perDocument['discovery-notes']).toBe(10)
      expect(result.perDocument.brd).toBe(15)
      expect(result.total).toBeGreaterThan(0)
    })

    it('should return all 9 documents in estimates', () => {
      const result = planningGenerator.estimateDuration('balanced')
      expect(Object.keys(result.perDocument).length).toBe(9)
    })
  })

  describe('generate', () => {
    it('should generate planning document with context', async () => {
      const contextContent = '# Project Context\nProject: EOffice'
      const mockResponse = {
        content: '# Initiate Planning\n## Document Sequence\n...',
        tokensUsed: { input: 100, output: 200, total: 300 },
        model: 'gpt-4o',
        provider: 'mock',
      }

      vi.spyOn(mockAi, 'generate').mockResolvedValue(mockResponse)

      const result = await planningGenerator.generate(contextContent, 'balanced')

      expect(result.content).toContain('# Initiate Planning')
      expect(result.estimates.perDocument['discovery-notes']).toBe(5)
      expect(mockAi.generate).toHaveBeenCalled()
    })

    it('should use default balanced mode if not specified', async () => {
      const contextContent = '# Project Context'
      const mockResponse = {
        content: '# Initiate Planning\n...',
        tokensUsed: { input: 100, output: 200, total: 300 },
        model: 'gpt-4o',
        provider: 'mock',
      }

      vi.spyOn(mockAi, 'generate').mockResolvedValue(mockResponse)

      await planningGenerator.generate(contextContent)

      const call = vi.mocked(mockAi.generate).mock.calls[0]
      expect(call[1]).toBe('balanced')
    })

    it('should include context in AI prompt', async () => {
      const contextContent = '# Project Context\nProject: Test'
      const mockResponse = {
        content: '# Initiate Planning\n...',
        tokensUsed: { input: 100, output: 200, total: 300 },
        model: 'gpt-4o',
        provider: 'mock',
      }

      vi.spyOn(mockAi, 'generate').mockResolvedValue(mockResponse)

      await planningGenerator.generate(contextContent, 'balanced')

      const call = vi.mocked(mockAi.generate).mock.calls[0]
      expect(call[0].userPrompt).toContain(contextContent)
    })
  })

  describe('savePlanning', () => {
    it('should write planning document using FileManager', async () => {
      const content = '# Initiate Planning\n...'

      await planningGenerator.savePlanning('/test/project', content)

      expect(mockFileManager.writePlanning).toHaveBeenCalledWith('initiate-planning.md', content)
    })
  })
})
