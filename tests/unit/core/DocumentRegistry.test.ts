import { describe, expect, it } from 'vitest'
import { DocumentRegistry } from '../../../src/core/DocumentRegistry'
import { makeProjectState } from '../../helpers/fixtures'

describe('DocumentRegistry', () => {
  const registry = new DocumentRegistry()

  it('getAll returns 9 documents ordered by `order`', () => {
    const all = registry.getAll()
    expect(all).toHaveLength(9)
    expect(all.map((d) => d.order)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9])
  })

  it('getById returns the definition and throws for unknown ids', () => {
    expect(registry.getById('brd').filename).toBe('02-brd.md')
    expect(() => registry.getById('nope')).toThrow()
  })

  it('getStage splits 4 Stage 1 + 5 Stage 2', () => {
    expect(registry.getStage(1)).toHaveLength(4)
    expect(registry.getStage(2)).toHaveLength(5)
  })

  it('getDependencies resolves dependsOn into definitions', () => {
    expect(registry.getDependencies('discovery-notes')).toEqual([])
    expect(registry.getDependencies('brd').map((d) => d.id)).toEqual(['discovery-notes'])
  })

  it('getNextPending returns the first pending doc, null when none', () => {
    const state = makeProjectState()
    expect(registry.getNextPending(state)?.id).toBe('discovery-notes')

    state.documents['discovery-notes'].status = 'generated'
    expect(registry.getNextPending(state)?.id).toBe('brd')

    for (const id of Object.keys(state.documents) as Array<keyof typeof state.documents>) {
      state.documents[id].status = 'generated'
    }
    expect(registry.getNextPending(state)).toBeNull()
  })
})
