/**
 * Unit tests for DocumentPipeline.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { DocumentPipeline } from '../../../src/core/DocumentPipeline.js'
import { StateManager } from '../../../src/core/StateManager.js'
import { DocumentGenerator } from '../../../src/core/DocumentGenerator.js'
import { QualityGate } from '../../../src/core/QualityGate.js'
import { FileManager } from '../../../src/storage/FileManager.js'
import { Logger } from '../../../src/utils/logger.js'
import type { ProjectState } from '../../../src/storage/schemas.js'
import type { QualityMode } from '../../../src/ai/types.js'

// Mock StateManager
vi.mock('../../../src/core/StateManager.js', () => {
  class MockStateManager {
    constructor(..._args: any[]) {
      // Accept any constructor args for testing
    }
    getState = vi.fn()
    updateDocumentStatus = vi.fn()
  }
  return {
    StateManager: MockStateManager,
  }
})

// Mock DocumentGenerator
vi.mock('../../../src/core/DocumentGenerator.js', () => {
  class MockDocumentGenerator {
    constructor(..._args: any[]) {
      // Accept any constructor args for testing
    }
    generate = vi.fn()
  }
  return {
    DocumentGenerator: MockDocumentGenerator,
  }
})

// Mock QualityGate
vi.mock('../../../src/core/QualityGate.js', () => {
  class MockQualityGate {
    constructor(..._args: any[]) {
      // Accept any constructor args for testing
    }
    run = vi.fn()
    saveReport = vi.fn()
  }
  return {
    QualityGate: MockQualityGate,
  }
})

// Mock FileManager
vi.mock('../../../src/storage/FileManager.js', () => {
  class MockFileManager {
    constructor(..._args: any[]) {
      // Accept any constructor args for testing
    }
    writeDocument = vi.fn()
    readDocument = vi.fn()
  }
  return {
    FileManager: MockFileManager,
  }
})

// Mock Logger
vi.mock('../../../src/utils/logger.js', () => {
  class MockLogger {
    info = vi.fn()
    success = vi.fn()
    error = vi.fn()
    warning = vi.fn()
  }
  return {
    Logger: MockLogger,
  }
})

describe('DocumentPipeline', () => {
  let pipeline: DocumentPipeline
  let mockStateManager: StateManager
  let mockGenerator: DocumentGenerator
  let mockQualityGate: QualityGate
  let mockFileManager: FileManager
  let mockLogger: Logger

  const mockState: ProjectState = {
    project: {
      name: 'Test Project',
      slug: 'test-project',
      language: 'en',
      qualityMode: 'balanced',
      inputMethod: 'text',
      interactiveModeSkipped: false,
      createdAt: '2024-01-01T00:00:00.000Z',
    },
    pipeline: {
      stage1Approved: false,
      stage1ApprovedAt: null,
      stage1SummaryGenerated: false,
    },
    documents: {
      'discovery-notes': {
        status: 'pending',
        version: 0,
        confidence: null,
        generatedAt: null,
        providerUsed: null,
        modelUsed: null,
        tokensUsed: null,
      },
      brd: {
        status: 'pending',
        version: 0,
        confidence: null,
        generatedAt: null,
        providerUsed: null,
        modelUsed: null,
        tokensUsed: null,
      },
      sow: {
        status: 'pending',
        version: 0,
        confidence: null,
        generatedAt: null,
        providerUsed: null,
        modelUsed: null,
        tokensUsed: null,
      },
      prd: {
        status: 'pending',
        version: 0,
        confidence: null,
        generatedAt: null,
        providerUsed: null,
        modelUsed: null,
        tokensUsed: null,
      },
      'uiux-flow': {
        status: 'pending',
        version: 0,
        confidence: null,
        generatedAt: null,
        providerUsed: null,
        modelUsed: null,
        tokensUsed: null,
      },
      srs: {
        status: 'pending',
        version: 0,
        confidence: null,
        generatedAt: null,
        providerUsed: null,
        modelUsed: null,
        tokensUsed: null,
      },
      trd: {
        status: 'pending',
        version: 0,
        confidence: null,
        generatedAt: null,
        providerUsed: null,
        modelUsed: null,
        tokensUsed: null,
      },
      sdd: {
        status: 'pending',
        version: 0,
        confidence: null,
        generatedAt: null,
        providerUsed: null,
        modelUsed: null,
        tokensUsed: null,
      },
      'task-breakdown': {
        status: 'pending',
        version: 0,
        confidence: null,
        generatedAt: null,
        providerUsed: null,
        modelUsed: null,
        tokensUsed: null,
      },
    },
  }

  beforeEach(() => {
    mockStateManager = new StateManager(undefined as any) as any
    mockGenerator = new DocumentGenerator(undefined as any, undefined as any, undefined as any) as any
    mockQualityGate = new QualityGate(undefined as any, undefined as any, undefined as any) as any
    mockFileManager = new FileManager('/test') as any
    mockLogger = new Logger() as any

    pipeline = new DocumentPipeline(
      mockStateManager,
      mockGenerator,
      mockQualityGate,
      mockFileManager,
      mockLogger,
    )
  })

  describe('generateNext', () => {
    it('should generate next pending document', async () => {
      const stateWithDiscoveryPending = { ...mockState }
      stateWithDiscoveryPending.documents['discovery-notes'].status = 'pending'

      vi.spyOn(mockStateManager, 'getState').mockResolvedValue(stateWithDiscoveryPending)
      vi.spyOn(mockStateManager, 'updateDocumentStatus').mockResolvedValue()
      vi.spyOn(mockGenerator, 'generate').mockResolvedValue('# Document content')
      vi.spyOn(mockFileManager, 'readDocument').mockResolvedValue('# Previous doc')
      vi.spyOn(mockQualityGate, 'run').mockResolvedValue({
        completeness: 8,
        consistency: 7,
        risks: [],
        requiredDecisions: [],
        reviewerNotes: '',
        confidence: 8,
      })

      await pipeline.generateNext({})

      expect(mockStateManager.updateDocumentStatus).toHaveBeenCalledWith('discovery-notes', { status: 'generating' })
      expect(mockGenerator.generate).toHaveBeenCalled()
      expect(mockFileManager.writeDocument).toHaveBeenCalledWith('discovery-notes', '# Document content')
      expect(mockQualityGate.run).toHaveBeenCalled()
    })

    it('should return early if no pending documents', async () => {
      const completedState = { ...mockState }
      Object.keys(completedState.documents).forEach((key) => {
        completedState.documents[key as keyof ProjectState['documents']] = {
          ...completedState.documents[key as keyof ProjectState['documents']],
          status: 'generated',
        }
      })

      vi.spyOn(mockStateManager, 'getState').mockResolvedValue(completedState)

      await pipeline.generateNext({})

      expect(mockLogger.info).toHaveBeenCalledWith('No pending documents to generate.')
      expect(mockGenerator.generate).not.toHaveBeenCalled()
    })

    it('should validate Stage 1 approval for Stage 2 documents', async () => {
      const stage2State = { ...mockState }
      stage2State.documents['discovery-notes'].status = 'generated'
      stage2State.documents['brd'].status = 'generated'
      stage2State.documents['sow'].status = 'generated'
      stage2State.documents['prd'].status = 'generated'
      stage2State.documents['uiux-flow'].status = 'pending'

      vi.spyOn(mockStateManager, 'getState').mockResolvedValue(stage2State)

      await expect(pipeline.generateNext({})).rejects.toThrow('Stage 1 not approved')
      expect(mockLogger.error).toHaveBeenCalledWith('Stage 1 must be approved before generating Stage 2 documents.')
    })

    it('should handle dry run mode', async () => {
      const stateWithDiscoveryPending = { ...mockState }
      stateWithDiscoveryPending.documents['discovery-notes'].status = 'pending'

      vi.spyOn(mockStateManager, 'getState').mockResolvedValue(stateWithDiscoveryPending)
      vi.spyOn(mockStateManager, 'updateDocumentStatus').mockResolvedValue()
      vi.spyOn(mockGenerator, 'generate').mockResolvedValue('# Document content')
      vi.spyOn(mockFileManager, 'readDocument').mockResolvedValue('# Previous doc')

      await pipeline.generateNext({ dryRun: true })

      expect(mockFileManager.writeDocument).not.toHaveBeenCalled()
      expect(mockQualityGate.run).not.toHaveBeenCalled()
      expect(mockLogger.info).toHaveBeenCalledWith('Dry run: Discovery Notes would be generated.')
    })

    it('should rollback to pending on error', async () => {
      const stateWithDiscoveryPending = { ...mockState }
      stateWithDiscoveryPending.documents['discovery-notes'].status = 'pending'

      vi.spyOn(mockStateManager, 'getState').mockResolvedValue(stateWithDiscoveryPending)
      vi.spyOn(mockStateManager, 'updateDocumentStatus').mockResolvedValue()
      vi.spyOn(mockGenerator, 'generate').mockRejectedValue(new Error('Generation failed'))

      await expect(pipeline.generateNext({})).rejects.toThrow('Generation failed')

      expect(mockStateManager.updateDocumentStatus).toHaveBeenCalledWith('discovery-notes', { status: 'pending' })
      expect(mockLogger.error).toHaveBeenCalledWith(expect.stringContaining('Failed to generate'))
    })

    it('should warn on low confidence', async () => {
      const stateWithDiscoveryPending = { ...mockState }
      stateWithDiscoveryPending.documents['discovery-notes'].status = 'pending'

      vi.spyOn(mockStateManager, 'getState').mockResolvedValue(stateWithDiscoveryPending)
      vi.spyOn(mockStateManager, 'updateDocumentStatus').mockResolvedValue()
      vi.spyOn(mockGenerator, 'generate').mockResolvedValue('# Document content')
      vi.spyOn(mockFileManager, 'readDocument').mockResolvedValue('# Previous doc')
      vi.spyOn(mockQualityGate, 'run').mockResolvedValue({
        completeness: 3,
        consistency: 4,
        risks: [],
        requiredDecisions: [],
        reviewerNotes: '',
        confidence: 4,
      })

      await pipeline.generateNext({})

      expect(mockLogger.warning).toHaveBeenCalledWith('Low confidence (4/10). Use --force to proceed.')
    })
  })

  describe('checkStage1Complete', () => {
    it('should detect Stage 1 completion', async () => {
      const stage1CompleteState = { ...mockState }
      stage1CompleteState.documents['discovery-notes'].status = 'generated'
      stage1CompleteState.documents['brd'].status = 'generated'
      stage1CompleteState.documents['sow'].status = 'generated'
      stage1CompleteState.documents['prd'].status = 'generated'

      await pipeline.checkStage1Complete(stage1CompleteState)

      expect(mockLogger.info).toHaveBeenCalledWith('Stage 1 documents complete.')
      expect(mockLogger.info).toHaveBeenCalledWith('Run "docbuilder approve stage-1" to approve Stage 1 and generate summary.')
    })

    it('should not show completion message if Stage 1 not complete', async () => {
      const incompleteState = { ...mockState }
      incompleteState.documents['discovery-notes'].status = 'generated'
      incompleteState.documents['brd'].status = 'generated'
      incompleteState.documents['sow'].status = 'pending' // Not complete

      await pipeline.checkStage1Complete(incompleteState)

      expect(mockLogger.info).not.toHaveBeenCalledWith('Stage 1 documents complete.')
      expect(mockLogger.info).not.toHaveBeenCalledWith('Run "docbuilder approve stage-1" to approve Stage 1 and generate summary.')
    })

    it('should not show completion message if Stage 1 already approved', async () => {
      const approvedState = { ...mockState }
      approvedState.pipeline.stage1Approved = true
      approvedState.documents['discovery-notes'].status = 'generated'
      approvedState.documents['brd'].status = 'generated'
      approvedState.documents['sow'].status = 'generated'
      approvedState.documents['prd'].status = 'generated'

      await pipeline.checkStage1Complete(approvedState)

      expect(mockLogger.info).not.toHaveBeenCalledWith('Stage 1 documents complete.')
    })
  })
})
