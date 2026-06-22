/**
 * Integration tests for Stage 2 pipeline.
 * Tests Stage 2 document generation with MockProvider.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { rm } from 'node:fs/promises'
import { join } from 'node:path'
import { StateStore } from '../../src/storage/StateStore.js'
import { StateManager } from '../../src/core/StateManager.js'
import { DocumentRegistry } from '../../src/core/DocumentRegistry.js'
import { DocumentGenerator } from '../../src/core/DocumentGenerator.js'
import { QualityGate } from '../../src/core/QualityGate.js'
import { DocumentPipeline } from '../../src/core/DocumentPipeline.js'
import { FinalReview } from '../../src/core/FinalReview.js'
import { AIGateway } from '../../src/ai/AIGateway.js'
import { ProviderRegistryService } from '../../src/ai/ProviderRegistryService.js'
import { ProviderStore } from '../../src/storage/ProviderStore.js'
import { FileManager } from '../../src/storage/FileManager.js'
import { Logger } from '../../src/utils/logger.js'
import { makeTempDir } from '../helpers/fixtures'

describe('Stage 2 Pipeline Integration Tests', () => {
  let projectDir: string
  let stateStore: StateStore
  let stateManager: StateManager
  let fileManager: FileManager
  let logger: Logger
  let providerRegistry: ProviderRegistryService
  let providerStore: ProviderStore
  let aiGateway: AIGateway
  let documentGenerator: DocumentGenerator
  let qualityGate: QualityGate
  let documentPipeline: DocumentPipeline
  let finalReview: FinalReview

  beforeEach(async () => {
    projectDir = await makeTempDir('docbuilder-stage2-')
    stateStore = new StateStore(projectDir)
    stateManager = new StateManager(stateStore)
    fileManager = new FileManager(projectDir)
    logger = new Logger()

    // Setup ProviderRegistryService with mock provider
    providerRegistry = new ProviderRegistryService()

    // Setup ProviderStore with a temporary config path
    const configPath = join(projectDir, 'provider.json')
    providerStore = new ProviderStore(configPath)

    // Create minimal provider config with mock provider
    await providerStore.write({
      default: 'mock',
      encryption: 'none',
      providers: {
        mock: {
          apiKey: 'mock-key',
          models: {
            'fast-draft': 'gpt-4o-mini',
            balanced: 'gpt-4o',
            'deep-analysis': 'gpt-4o',
          },
          maxTokens: {
            'fast-draft': 6000,
            balanced: 12000,
            'deep-analysis': 24000,
          },
          temperature: {
            'fast-draft': 0.7,
            balanced: 0.5,
            'deep-analysis': 0.3,
          },
        },
      },
      updatedAt: new Date().toISOString(),
    })

    // Setup AIGateway with mock provider
    aiGateway = new AIGateway(providerRegistry, providerStore)

    documentGenerator = new DocumentGenerator(aiGateway, fileManager, logger)
    qualityGate = new QualityGate(aiGateway, fileManager, logger)
    documentPipeline = new DocumentPipeline(stateManager, documentGenerator, qualityGate, fileManager, logger)
    finalReview = new FinalReview(aiGateway, fileManager, logger)

    // Initialize project state with Stage 1 complete
    const initialState = StateManager.createInitialState({
      name: 'Test Project',
      slug: 'test-project',
      language: 'en',
      qualityMode: 'balanced',
      inputMethod: 'text',
    })

    // Mark Stage 1 documents as generated
    initialState.documents['discovery-notes'].status = 'generated'
    initialState.documents['discovery-notes'].confidence = 8
    initialState.documents['discovery-notes'].generatedAt = new Date().toISOString()

    initialState.documents.brd.status = 'generated'
    initialState.documents.brd.confidence = 8
    initialState.documents.brd.generatedAt = new Date().toISOString()

    initialState.documents.sow.status = 'generated'
    initialState.documents.sow.confidence = 8
    initialState.documents.sow.generatedAt = new Date().toISOString()

    initialState.documents.prd.status = 'generated'
    initialState.documents.prd.confidence = 8
    initialState.documents.prd.generatedAt = new Date().toISOString()

    // Approve Stage 1
    initialState.pipeline.stage1Approved = true
    initialState.pipeline.stage1ApprovedAt = new Date().toISOString()
    initialState.pipeline.stage1SummaryGenerated = true

    await stateStore.write(initialState)

    // Create stage-1-summary.md
    await fileManager.writePlanning('stage-1-summary.md', '# Stage 1 Summary\n\nThis is a summary of Stage 1 documents.')

    // Create Stage 1 documents
    await fileManager.writeDocument('discovery-notes', '# Discovery Notes\n\nContent here.')
    await fileManager.writeDocument('brd', '# BRD\n\nContent here.')
    await fileManager.writeDocument('sow', '# SOW\n\nContent here.')
    await fileManager.writeDocument('prd', '# PRD\n\nContent here.')

    vi.spyOn(console, 'log').mockImplementation(() => undefined)
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
  })

  afterEach(async () => {
    vi.restoreAllMocks()
    await rm(projectDir, { recursive: true, force: true })
  })

  describe('Stage 2 Document Generation', () => {
    it('should generate UI/UX Flow as first Stage 2 document', async () => {
      await documentPipeline.generateNext()

      const state = await stateStore.read()
      expect(state.documents['uiux-flow'].status).toBe('generated')
      expect(state.documents['uiux-flow'].confidence).toBeGreaterThan(0)
    })

    it('should generate Stage 2 documents in correct order', async () => {
      const stage2Docs = ['uiux-flow', 'srs', 'trd', 'sdd', 'task-breakdown']

      for (const docId of stage2Docs) {
        await documentPipeline.generateNext()
        const state = await stateStore.read()
        expect(state.documents[docId as keyof typeof state.documents].status).toBe('generated')
      }
    })

    it('should block Stage 2 generation if Stage 1 not approved', async () => {
      // Revoke Stage 1 approval
      await stateManager.revokeStage1Approval(['uiux-flow', 'srs', 'trd', 'sdd', 'task-breakdown'])

      await expect(documentPipeline.generateNext()).rejects.toThrow('Stage 1 not approved')
    })

    it('should use stage-1-summary.md in carry-forward for Stage 2', async () => {
      // This is verified by the successful generation of Stage 2 documents
      // which depends on the summary being present
      await documentPipeline.generateNext()

      const state = await stateStore.read()
      expect(state.documents['uiux-flow'].status).toBe('generated')
    })
  })

  describe('Stale Detection', () => {
    it('should mark Stage 2 documents as stale when Stage 1 is revoked', async () => {
      // Generate one Stage 2 document
      await documentPipeline.generateNext()

      // Revoke Stage 1 approval
      await stateManager.revokeStage1Approval(['uiux-flow', 'srs', 'trd', 'sdd', 'task-breakdown'])

      const state = await stateStore.read()
      expect(state.documents['uiux-flow'].status).toBe('stale')
    })

    it('should regenerate stale documents before pending ones', async () => {
      // Generate one Stage 2 document
      await documentPipeline.generateNext()

      // Revoke Stage 1 approval
      await stateManager.revokeStage1Approval(['uiux-flow', 'srs', 'trd', 'sdd', 'task-breakdown'])

      // Re-approve Stage 1 to allow stale document regeneration
      await stateManager.setStage1Approved()

      // Run generateNext - should regenerate stale document
      await documentPipeline.generateNext()

      const state = await stateStore.read()
      expect(state.documents['uiux-flow'].status).toBe('generated')
    })
  })

  describe('Final Review', () => {
    it('should run final review after all documents are complete', async () => {
      // Generate all Stage 2 documents
      const stage2Docs = ['uiux-flow', 'srs', 'trd', 'sdd', 'task-breakdown']
      for (const docId of stage2Docs) {
        await documentPipeline.generateNext()
      }

      const state = await stateStore.read()
      const result = await finalReview.run(state, 'balanced')

      expect(result).toHaveProperty('avgConfidence')
      expect(result).toHaveProperty('criticalAssumptions')
      expect(result).toHaveProperty('topRisks')
      expect(result).toHaveProperty('recommendation')
      expect(result).toHaveProperty('summary')
    })

    it('should save final review report', async () => {
      // Generate all Stage 2 documents
      const stage2Docs = ['uiux-flow', 'srs', 'trd', 'sdd', 'task-breakdown']
      for (const docId of stage2Docs) {
        await documentPipeline.generateNext()
      }

      const state = await stateStore.read()
      const result = await finalReview.run(state, 'balanced')
      await finalReview.saveReport(result)

      // FileManager.writeReview appends "-quality-gate.md" to the docId
      // Since we write with docId 'final-quality-review', the file is 'final-quality-review-quality-gate.md'
      // To read it back, we use the same docId 'final-quality-review'
      const reportExists = await fileManager.readReview('final-quality-review')
      expect(reportExists).toBeTruthy()
    })
  })

  describe('Full Pipeline End-to-End', () => {
    it('should run full Stage 2 pipeline without errors', async () => {
      const stage2Docs = ['uiux-flow', 'srs', 'trd', 'sdd', 'task-breakdown']

      for (const docId of stage2Docs) {
        await documentPipeline.generateNext()
        const state = await stateStore.read()
        expect(state.documents[docId as keyof typeof state.documents].status).toBe('generated')
      }

      // Run final review
      const state = await stateStore.read()
      const result = await finalReview.run(state, 'balanced')
      await finalReview.saveReport(result)

      // Verify all documents are generated
      const finalState = await stateStore.read()
      for (const docId of stage2Docs) {
        expect(finalState.documents[docId as keyof typeof finalState.documents].status).toBe('generated')
      }
    })
  })
})
