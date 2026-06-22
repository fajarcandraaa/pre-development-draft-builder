/**
 * Unit tests for QuestionPrompter — safety cap and skip behaviour.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { QuestionPrompter } from '../../../src/core/QuestionPrompter.js'

vi.mock('@inquirer/prompts', () => ({
  input: vi.fn(),
}))

vi.mock('../../../src/utils/logger.js', () => {
  class MockLogger {
    info = vi.fn()
    success = vi.fn()
    error = vi.fn()
    warning = vi.fn()
  }
  return { Logger: MockLogger }
})

const makeStateManager = (answers: Record<string, string> = {}, asked: string[] = []) => ({
  getAnswers: vi.fn().mockResolvedValue(answers),
  getAskedQuestions: vi.fn().mockResolvedValue(asked),
  setAnswer: vi.fn().mockResolvedValue(undefined),
  addAskedQuestions: vi.fn().mockResolvedValue(undefined),
})

const makeLogger = () => ({
  info: vi.fn(),
  success: vi.fn(),
  error: vi.fn(),
  warning: vi.fn(),
})

describe('QuestionPrompter.promptForAnswersWithSkip', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return 0 immediately when given an empty questions array', async () => {
    const stateManager = makeStateManager()
    const logger = makeLogger()
    const prompter = new QuestionPrompter(stateManager as any, logger as any)

    const count = await prompter.promptForAnswersWithSkip([])

    expect(count).toBe(0)
    expect(stateManager.addAskedQuestions).not.toHaveBeenCalled()
  })

  it('should return 0 when all questions were previously asked', async () => {
    const stateManager = makeStateManager({}, ['Q1?', 'Q2?'])
    const logger = makeLogger()
    const prompter = new QuestionPrompter(stateManager as any, logger as any)

    const count = await prompter.promptForAnswersWithSkip(['Q1?', 'Q2?'])

    expect(count).toBe(0)
    expect(logger.info).toHaveBeenCalledWith('All questions have already been asked.')
  })

  it('should cap presented questions at MAX_QUESTIONS_PER_SESSION (10)', async () => {
    const { input } = await import('@inquirer/prompts')
    vi.mocked(input).mockResolvedValue('answer')

    const stateManager = makeStateManager()
    const logger = makeLogger()
    const prompter = new QuestionPrompter(stateManager as any, logger as any)

    const manyQuestions = Array.from({ length: 15 }, (_, i) => `Question ${i + 1}?`)
    await prompter.promptForAnswersWithSkip(manyQuestions)

    expect(stateManager.addAskedQuestions).toHaveBeenCalledWith(
      expect.arrayContaining([expect.any(String)]),
    )
    const recorded: string[] = vi.mocked(stateManager.addAskedQuestions).mock.calls[0][0]
    expect(recorded.length).toBeLessThanOrEqual(10)
  })

  it('should record only presented (capped) questions as asked', async () => {
    const { input } = await import('@inquirer/prompts')
    vi.mocked(input).mockResolvedValue('')

    const stateManager = makeStateManager()
    const logger = makeLogger()
    const prompter = new QuestionPrompter(stateManager as any, logger as any)

    const questions = Array.from({ length: 12 }, (_, i) => `Q${i + 1}?`)
    await prompter.promptForAnswersWithSkip(questions)

    const recorded: string[] = vi.mocked(stateManager.addAskedQuestions).mock.calls[0][0]
    expect(recorded).toHaveLength(10)
    expect(recorded[0]).toBe('Q1?')
    expect(recorded[9]).toBe('Q10?')
  })

  it('should count only non-empty answers', async () => {
    const { input } = await import('@inquirer/prompts')
    vi.mocked(input)
      .mockResolvedValueOnce('my answer')
      .mockResolvedValueOnce('')
      .mockResolvedValueOnce('another answer')

    const stateManager = makeStateManager()
    const logger = makeLogger()
    const prompter = new QuestionPrompter(stateManager as any, logger as any)

    const count = await prompter.promptForAnswersWithSkip(['Q1?', 'Q2?', 'Q3?'])

    expect(count).toBe(2)
    expect(stateManager.setAnswer).toHaveBeenCalledTimes(2)
  })
})
