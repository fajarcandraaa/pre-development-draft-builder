/**
 * Unit tests for DocumentGenerator.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { DocumentGenerator } from '../../../src/core/DocumentGenerator.js'
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
    readDocument = vi.fn()
    readPlanning = vi.fn()
  }
  return {
    FileManager: MockFileManager,
  }
})

// Mock Logger
vi.mock('../../../src/utils/logger.js', () => {
  class MockLogger {
    error = vi.fn()
    warning = vi.fn()
  }
  return {
    Logger: MockLogger,
  }
})

describe('DocumentGenerator', () => {
  let documentGenerator: DocumentGenerator
  let mockAi: AIGateway
  let mockFileManager: FileManager
  let mockLogger: Logger

  beforeEach(() => {
    mockAi = new AIGateway(undefined as any, undefined as any) as any
    mockFileManager = new FileManager('/test') as any
    mockLogger = new Logger() as any
    documentGenerator = new DocumentGenerator(mockAi, mockFileManager, mockLogger)
  })

  describe('generate', () => {
    it('should generate document with AI', async () => {
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

      const context = {
        state: { context: '# Project Context' },
        previousDocs: {} as Record<string, string>,
        revisionNote: undefined,
      }

      const mockResponse = {
        content: '# BRD\n\nGenerated content...',
        tokensUsed: { input: 100, output: 200, total: 300 },
        model: 'gpt-4o',
        provider: 'mock',
      }

      vi.spyOn(mockAi, 'generate').mockResolvedValue(mockResponse)

      const result = await documentGenerator.generate(doc, context, 'balanced')

      expect(result).toContain('# BRD')
      expect(mockAi.generate).toHaveBeenCalled()
    })

    it('should include revision note in template', async () => {
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

      const context = {
        state: { context: '# Context' },
        previousDocs: {} as Record<string, string>,
        revisionNote: 'Update stakeholders section',
      }

      const mockResponse = {
        content: '# BRD\n...',
        tokensUsed: { input: 100, output: 200, total: 300 },
        model: 'gpt-4o',
        provider: 'mock',
      }

      vi.spyOn(mockAi, 'generate').mockResolvedValue(mockResponse)

      await documentGenerator.generate(doc, context, 'balanced')

      const call = vi.mocked(mockAi.generate).mock.calls[0]
      expect(call[0].userPrompt).toContain('Update stakeholders section')
    })
  })

  describe('loadTemplate', () => {
    it('should return fallback template when file not found', async () => {
      const result = await documentGenerator.loadTemplate('templates/nonexistent.prompt.md')
      expect(result).toContain('Generate a document based on the following context')
    })
  })

  describe('assembleCarryForward', () => {
    it('should return empty string for no dependencies', async () => {
      const result = await documentGenerator.assembleCarryForward([], 1, 'balanced')
      expect(result).toBe('')
    })

    it('should assemble Stage 1 carry-forward with token limit', async () => {
      const docIds = ['discovery-notes' as const]
      vi.spyOn(mockFileManager, 'readDocument').mockResolvedValue('# Discovery Notes\n\nContent...')

      const result = await documentGenerator.assembleCarryForward(docIds, 1, 'balanced')

      expect(result).toContain('## Discovery Notes')
      expect(mockFileManager.readDocument).toHaveBeenCalledWith('discovery-notes')
    })

    it('should truncate content when token limit exceeded', async () => {
      const docIds = ['discovery-notes' as const, 'brd' as const]
      vi.spyOn(mockFileManager, 'readDocument')
        .mockResolvedValueOnce('# Discovery Notes\n\n'.repeat(1000)) // Large content
        .mockResolvedValueOnce('# BRD\n\nContent')

      const result = await documentGenerator.assembleCarryForward(docIds, 1, 'fast-draft')

      expect(result).toContain('truncated due to token limit')
    })

    it('should assemble Stage 2 carry-forward with summary', async () => {
      const docIds = ['srs' as const]
      vi.spyOn(mockFileManager, 'readPlanning').mockResolvedValue('# Stage 1 Summary\n\n...')
      vi.spyOn(mockFileManager, 'readDocument').mockResolvedValue('# SRS\n\nContent')

      const result = await documentGenerator.assembleCarryForward(docIds, 2, 'balanced')

      expect(result).toContain('## Stage 1 Summary')
      expect(mockFileManager.readPlanning).toHaveBeenCalledWith('stage-1-summary.md')
    })

    it('should handle missing documents gracefully', async () => {
      const docIds = ['discovery-notes' as const]
      vi.spyOn(mockFileManager, 'readDocument').mockRejectedValue(new Error('File not found'))

      const result = await documentGenerator.assembleCarryForward(docIds, 1, 'balanced')

      expect(result).toBe('')
    })
  })
})
