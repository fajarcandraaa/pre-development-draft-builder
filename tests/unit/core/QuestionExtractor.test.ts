/**
 * Unit tests for QuestionExtractor — question prompt improvement.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { QuestionExtractor } from '../../../src/core/QuestionExtractor.js'

describe('QuestionExtractor', () => {
  let extractor: QuestionExtractor
  let mockGenerate: ReturnType<typeof vi.fn>
  let mockLogger: { info: ReturnType<typeof vi.fn>; success: ReturnType<typeof vi.fn>; error: ReturnType<typeof vi.fn>; warning: ReturnType<typeof vi.fn> }

  beforeEach(() => {
    mockGenerate = vi.fn()
    mockLogger = { info: vi.fn(), success: vi.fn(), error: vi.fn(), warning: vi.fn() }
    const mockAI = { generate: mockGenerate }
    extractor = new QuestionExtractor(mockAI as any, mockLogger as any)
  })

  describe('extractQuestions — maxQuestions cap', () => {
    it('should return at most maxQuestions questions even when AI returns more', async () => {
      mockGenerate.mockResolvedValue({
        content: JSON.stringify([
          'Q1?', 'Q2?', 'Q3?', 'Q4?', 'Q5?', 'Q6?', 'Q7?',
        ]),
      })

      const result = await extractor.extractQuestions('some doc content', 'balanced', [], 3)

      expect(result.questions).toHaveLength(3)
      expect(result.hasQuestions).toBe(true)
    })

    it('should respect default maxQuestions of 5', async () => {
      mockGenerate.mockResolvedValue({
        content: JSON.stringify(['Q1?', 'Q2?', 'Q3?', 'Q4?', 'Q5?', 'Q6?', 'Q7?']),
      })

      const result = await extractor.extractQuestions('some doc content')

      expect(result.questions.length).toBeLessThanOrEqual(5)
    })

    it('should return empty result for empty document content', async () => {
      const result = await extractor.extractQuestions('')

      expect(result.questions).toHaveLength(0)
      expect(result.hasQuestions).toBe(false)
      expect(mockGenerate).not.toHaveBeenCalled()
    })

    it('should return empty result for whitespace-only content', async () => {
      const result = await extractor.extractQuestions('   \n  ')

      expect(result.questions).toHaveLength(0)
      expect(result.hasQuestions).toBe(false)
    })
  })

  describe('extractQuestions — deduplication before cap', () => {
    it('should exclude previously asked questions before applying cap', async () => {
      mockGenerate.mockResolvedValue({
        content: JSON.stringify(['Q1?', 'Q2?', 'Q3?', 'Q4?', 'Q5?']),
      })

      const result = await extractor.extractQuestions(
        'some doc content',
        'balanced',
        ['Q1?', 'Q2?'],
        5,
      )

      expect(result.questions).not.toContain('Q1?')
      expect(result.questions).not.toContain('Q2?')
      expect(result.questions.length).toBeLessThanOrEqual(5)
    })

    it('should return empty when all extracted questions were previously asked', async () => {
      mockGenerate.mockResolvedValue({
        content: JSON.stringify(['Q1?', 'Q2?']),
      })

      const result = await extractor.extractQuestions(
        'some doc content',
        'balanced',
        ['Q1?', 'Q2?'],
        5,
      )

      expect(result.questions).toHaveLength(0)
      expect(result.hasQuestions).toBe(false)
    })
  })

  describe('extractQuestions — AI failure handling', () => {
    it('should return empty result and log warning when AI throws', async () => {
      mockGenerate.mockRejectedValue(new Error('API timeout'))

      const result = await extractor.extractQuestions('some content', 'balanced', [], 5)

      expect(result.questions).toHaveLength(0)
      expect(result.hasQuestions).toBe(false)
      expect(mockLogger.warning).toHaveBeenCalledWith(expect.stringContaining('Failed to extract questions'))
    })

    it('should parse questions from markdown code block fallback', async () => {
      mockGenerate.mockResolvedValue({
        content: '```json\n["What is the budget?", "Who is the main user?"]\n```',
      })

      const result = await extractor.extractQuestions('some content', 'balanced', [], 5)

      expect(result.questions).toContain('What is the budget?')
      expect(result.questions).toContain('Who is the main user?')
    })
  })

  describe('extractQuestions — maxQuestions=1 edge case', () => {
    it('should return exactly 1 question when maxQuestions is 1', async () => {
      mockGenerate.mockResolvedValue({
        content: JSON.stringify(['Q1?', 'Q2?', 'Q3?']),
      })

      const result = await extractor.extractQuestions('some doc', 'balanced', [], 1)

      expect(result.questions).toHaveLength(1)
    })
  })
})
