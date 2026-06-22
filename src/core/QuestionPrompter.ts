/**
 * QuestionPrompter (SDD §6.4).
 * Interactively prompts users for answers to extracted questions.
 */

import { input } from '@inquirer/prompts'
import type { StateManager } from './StateManager.js'
import type { Logger } from '../utils/logger.js'

/** Safety cap: never present more than this many questions in a single session, regardless of upstream limits. */
const MAX_QUESTIONS_PER_SESSION = 10

/**
 * QuestionPrompter service for interactive answer collection.
 */
export class QuestionPrompter {
  constructor(
    private stateManager: StateManager,
    private logger: Logger,
  ) {}

  /**
   * Prompt user for answers to extracted questions.
   * @param questions - Array of questions to answer
   * @returns Number of answers collected
   */
  async promptForAnswers(questions: string[]): Promise<number> {
    if (questions.length === 0) {
      return 0
    }

    const newQuestions = await this.filterNewQuestions(questions)

    if (newQuestions.length === 0) {
      this.logger.info('All questions have already been asked.')
      return 0
    }

    this.logger.info(`Found ${newQuestions.length} new question(s) in the document:`)

    let answeredCount = 0

    for (const question of newQuestions) {
      try {
        const answer = await this.promptUser(question)
        if (answer && answer.trim().length > 0) {
          await this.stateManager.setAnswer(question, answer.trim())
          this.logger.success(`Answer saved for: ${question}`)
          answeredCount++
        } else {
          this.logger.info(`Skipped: ${question}`)
        }
      } catch (error) {
        this.logger.warning(`Failed to get answer for "${question}": ${error instanceof Error ? error.message : String(error)}`)
      }
    }

    // Record all presented questions (answered or skipped) so they are not re-asked.
    await this.stateManager.addAskedQuestions(newQuestions)

    if (answeredCount > 0) {
      this.logger.success(`Collected ${answeredCount} answer(s)`)
    }

    return answeredCount
  }

  /**
   * Prompt user for a single question.
   * @param question - Question to ask
   * @returns User's answer
   */
  private async promptUser(question: string): Promise<string> {
    return await input({
      message: question,
      validate: (value) => {
        if (value.trim().length === 0) {
          return 'Please enter an answer or press Ctrl+C to skip'
        }
        return true
      },
    })
  }

  /**
   * Prompt user for answers with option to skip.
   * @param questions - Array of questions to answer
   * @returns Number of answers collected
   */
  async promptForAnswersWithSkip(questions: string[]): Promise<number> {
    if (questions.length === 0) {
      return 0
    }

    const newQuestions = await this.filterNewQuestions(questions)

    if (newQuestions.length === 0) {
      this.logger.info('All questions have already been asked.')
      return 0
    }

    const capped = newQuestions.slice(0, MAX_QUESTIONS_PER_SESSION)
    this.logger.info(`Found ${capped.length} new question(s) in the document:`)
    this.logger.info('Press Enter to skip a question, or provide an answer.')

    let answeredCount = 0

    for (const question of capped) {
      try {
        const answer = await this.promptUserWithSkip(question)
        if (answer && answer.trim().length > 0) {
          await this.stateManager.setAnswer(question, answer.trim())
          this.logger.success(`Answer saved for: ${question}`)
          answeredCount++
        } else {
          this.logger.info(`Skipped: ${question}`)
        }
      } catch (error) {
        this.logger.warning(`Failed to get answer for "${question}": ${error instanceof Error ? error.message : String(error)}`)
      }
    }

    // Record only the questions that were actually presented (answered or skipped).
    await this.stateManager.addAskedQuestions(capped)

    if (answeredCount > 0) {
      this.logger.success(`Collected ${answeredCount} answer(s)`)
    }

    return answeredCount
  }

  /**
   * Filter out questions that were already answered or already asked
   * (skipped). Normalizes wording so trivial rewordings are also removed.
   * @param questions - Candidate questions
   * @returns Questions that have not been asked before
   */
  private async filterNewQuestions(questions: string[]): Promise<string[]> {
    const existingAnswers = await this.stateManager.getAnswers()
    const askedQuestions = await this.stateManager.getAskedQuestions()
    const normalize = (s: string): string => s.toLowerCase().replace(/[^a-z0-9]/g, '')
    const askedSet = new Set([
      ...Object.keys(existingAnswers).map(normalize),
      ...askedQuestions.map(normalize),
    ])
    const seen = new Set<string>()
    const result: string[] = []
    for (const q of questions) {
      const key = normalize(q)
      if (askedSet.has(key) || seen.has(key)) {
        continue
      }
      seen.add(key)
      result.push(q)
    }
    return result
  }

  /**
   * Prompt user for a single question with skip option.
   * @param question - Question to ask
   * @returns User's answer or empty string if skipped
   */
  private async promptUserWithSkip(question: string): Promise<string> {
    return await input({
      message: question,
      default: '',
    })
  }
}
