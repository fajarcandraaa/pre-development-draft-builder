/**
 * Unit tests for tokenCounter.
 */

import { describe, it, expect } from 'vitest'
import { estimateTokens, estimateTotalTokens, estimateMarkdownTokens } from '../../../src/utils/tokenCounter.js'

describe('tokenCounter', () => {
  describe('estimateTokens', () => {
    it('should estimate tokens for empty string', () => {
      const result = estimateTokens('')
      expect(result).toBe(0)
    })

    it('should estimate tokens for short text', () => {
      const result = estimateTokens('Hello world')
      expect(result).toBe(3) // 11 chars / 4 = 2.75 -> ceil = 3
    })

    it('should estimate tokens for longer text', () => {
      const text = 'This is a longer text that should have more tokens estimated'
      const result = estimateTokens(text)
      expect(result).toBeGreaterThan(10)
    })

    it('should use ~4 chars per token heuristic', () => {
      const text = 'a'.repeat(8) // 8 characters
      const result = estimateTokens(text)
      expect(result).toBe(2) // 8 / 4 = 2
    })

    it('should handle whitespace', () => {
      const result = estimateTokens('   ')
      expect(result).toBe(1) // 3 chars / 4 = 0.75 -> ceil = 1
    })
  })

  describe('estimateTotalTokens', () => {
    it('should estimate total for multiple documents', () => {
      const docs = ['Hello world', 'This is a test']
      const result = estimateTotalTokens(docs)
      expect(result).toBe(estimateTokens('Hello world') + estimateTokens('This is a test'))
    })

    it('should handle empty array', () => {
      const result = estimateTotalTokens([])
      expect(result).toBe(0)
    })

    it('should handle single document', () => {
      const docs = ['Hello world']
      const result = estimateTotalTokens(docs)
      expect(result).toBe(estimateTokens('Hello world'))
    })
  })

  describe('estimateMarkdownTokens', () => {
    it('should apply markdown overhead multiplier', () => {
      const text = 'Hello world'
      const baseTokens = estimateTokens(text)
      const markdownTokens = estimateMarkdownTokens(text)
      expect(markdownTokens).toBe(Math.ceil(baseTokens * 1.1))
    })

    it('should handle markdown syntax', () => {
      const text = '# Header\n\n**Bold** text'
      const result = estimateMarkdownTokens(text)
      expect(result).toBeGreaterThan(0)
    })

    it('should handle empty string', () => {
      const result = estimateMarkdownTokens('')
      expect(result).toBe(0)
    })
  })
})
