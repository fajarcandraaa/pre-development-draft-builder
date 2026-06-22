import { rm } from 'node:fs/promises'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { StateManager } from '../../../src/core/StateManager'
import { StateTransitionError } from '../../../src/core/errors'
import { StateStore } from '../../../src/storage/StateStore'
import { makeTempDir } from '../../helpers/fixtures'

const projectInit = {
  name: 'Test Project',
  slug: 'test-project',
  language: 'id' as const,
  qualityMode: 'balanced' as const,
  inputMethod: 'text' as const,
}

describe('StateManager', () => {
  let projectDir: string
  let store: StateStore
  let manager: StateManager

  beforeEach(async () => {
    projectDir = await makeTempDir()
    store = new StateStore(projectDir)
    manager = new StateManager(store)
    await store.write(StateManager.createInitialState(projectInit))
  })

  afterEach(async () => {
    await rm(projectDir, { recursive: true, force: true })
  })

  it('createInitialState builds 9 pending docs and unapproved pipeline', () => {
    const state = StateManager.createInitialState(projectInit)
    expect(Object.keys(state.documents)).toHaveLength(9)
    expect(Object.values(state.documents).every((d) => d.status === 'pending')).toBe(true)
    expect(state.pipeline.stage1Approved).toBe(false)
  })

  describe('validateTransition', () => {
    it('allows valid transitions', () => {
      expect(() => manager.validateTransition('pending', 'generating')).not.toThrow()
      expect(() => manager.validateTransition('generating', 'generated')).not.toThrow()
      expect(() => manager.validateTransition('generated', 'stale')).not.toThrow()
      expect(() => manager.validateTransition('generated', 'generating')).not.toThrow()
    })

    it('is a no-op for unchanged status', () => {
      expect(() => manager.validateTransition('generated', 'generated')).not.toThrow()
    })

    it('throws StateTransitionError for invalid transitions', () => {
      expect(() => manager.validateTransition('pending', 'generated')).toThrow(StateTransitionError)
      expect(() => manager.validateTransition('pending', 'stale')).toThrow(StateTransitionError)
    })
  })

  it('updateDocumentStatus applies valid transition + merges fields', async () => {
    await manager.updateDocumentStatus('discovery-notes', { status: 'generating' })
    await manager.updateDocumentStatus('discovery-notes', {
      status: 'generated',
      confidence: 8,
      version: 1,
    })
    const state = await manager.getState()
    expect(state.documents['discovery-notes'].status).toBe('generated')
    expect(state.documents['discovery-notes'].confidence).toBe(8)
    expect(state.documents['discovery-notes'].version).toBe(1)
  })

  it('updateDocumentStatus rejects an invalid transition', async () => {
    await expect(
      manager.updateDocumentStatus('discovery-notes', { status: 'generated' }),
    ).rejects.toThrow(StateTransitionError)
  })

  it('setStage1Approved sets approval flags + timestamp', async () => {
    await manager.setStage1Approved()
    const state = await manager.getState()
    expect(state.pipeline.stage1Approved).toBe(true)
    expect(state.pipeline.stage1SummaryGenerated).toBe(true)
    expect(state.pipeline.stage1ApprovedAt).not.toBeNull()
  })

  it('revokeStage1Approval clears approval + marks given docs stale', async () => {
    // bring uiux-flow to 'generated' first
    await manager.updateDocumentStatus('uiux-flow', { status: 'generating' })
    await manager.updateDocumentStatus('uiux-flow', { status: 'generated' })
    await manager.setStage1Approved()

    await manager.revokeStage1Approval(['uiux-flow'])

    const state = await manager.getState()
    expect(state.pipeline.stage1Approved).toBe(false)
    expect(state.pipeline.stage1ApprovedAt).toBeNull()
    expect(state.documents['uiux-flow'].status).toBe('stale')
  })

  describe('asked questions tracking', () => {
    it('createInitialState starts with an empty askedQuestions list', () => {
      const state = StateManager.createInitialState(projectInit)
      expect(state.askedQuestions).toEqual([])
    })

    it('setAnswer records the question as asked', async () => {
      await manager.setAnswer('What is the timeline?', '3 months')
      const asked = await manager.getAskedQuestions()
      expect(asked).toContain('What is the timeline?')
    })

    it('addAskedQuestions stores questions without duplicates', async () => {
      await manager.addAskedQuestions(['Q1', 'Q2'])
      await manager.addAskedQuestions(['Q2', 'Q3'])
      const asked = await manager.getAskedQuestions()
      expect(asked).toEqual(['Q1', 'Q2', 'Q3'])
    })

    it('addAskedQuestions is a no-op for an empty list', async () => {
      await manager.addAskedQuestions([])
      const asked = await manager.getAskedQuestions()
      expect(asked).toEqual([])
    })
  })
})
