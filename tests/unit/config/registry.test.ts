import { describe, expect, it } from 'vitest'
import {
  DOCUMENT_REGISTRY,
  getDocumentDefinition,
  getDocumentFilename,
} from '../../../src/config/registry'

describe('DocumentRegistry data', () => {
  it('defines exactly 9 documents', () => {
    expect(DOCUMENT_REGISTRY).toHaveLength(9)
  })

  it('has sequential order 1..9', () => {
    expect(DOCUMENT_REGISTRY.map((d) => d.order)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9])
  })

  it('splits 4 Stage 1 + 5 Stage 2 documents', () => {
    expect(DOCUMENT_REGISTRY.filter((d) => d.stage === 1)).toHaveLength(4)
    expect(DOCUMENT_REGISTRY.filter((d) => d.stage === 2)).toHaveLength(5)
  })

  it('every dependency references a known earlier document', () => {
    const seen = new Set<string>()
    for (const doc of DOCUMENT_REGISTRY) {
      for (const dep of doc.dependsOn) {
        expect(seen.has(dep)).toBe(true)
      }
      seen.add(doc.id)
    }
  })

  it('getDocumentFilename returns the on-disk filename', () => {
    expect(getDocumentFilename('brd')).toBe('02-brd.md')
    expect(getDocumentFilename('task-breakdown')).toBe('09-task-breakdown.md')
  })

  it('getDocumentDefinition throws for an unknown id', () => {
    expect(() => getDocumentDefinition('nope')).toThrow(/Unknown document id/)
  })
})
