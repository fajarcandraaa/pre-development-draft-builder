import { Command, Flags } from '@oclif/core'
import { existsSync } from 'node:fs'
import { Logger } from '../utils/logger.js'
import { StateStore } from '../storage/StateStore.js'
import { StateManager } from '../core/StateManager.js'

export default class Answer extends Command {
  static description = 'Provide answers to open questions (stored in state.json for use in document generation)'

  static flags = {
    question: Flags.string({
      char: 'q',
      description: 'Question to answer',
    }),
    answer: Flags.string({
      char: 'a',
      description: 'Answer to the question',
    }),
    list: Flags.boolean({
      char: 'l',
      description: 'List all current answers',
    }),
    clear: Flags.boolean({
      char: 'c',
      description: 'Clear all answers',
    }),
  }

  async run(): Promise<void> {
    const { flags } = await this.parse(Answer)

    const projectRoot = process.cwd()
    const statePath = `${projectRoot}/.docbuilder/state.json`

    if (!existsSync(statePath)) {
      console.error('Error: Not a docbuilder project. Run this command from a project directory.')
      this.exit(1)
    }

    const logger = new Logger()
    const stateStore = new StateStore(projectRoot)
    const stateManager = new StateManager(stateStore)

    try {
      if (flags.list) {
        // List current answers
        const currentAnswers = await stateManager.getAnswers()
        logger.info('Current answers:')
        if (Object.keys(currentAnswers).length === 0) {
          logger.info('  No answers provided yet.')
        } else {
          for (const [question, answer] of Object.entries(currentAnswers)) {
            logger.info(`  ${question}: ${answer}`)
          }
        }
      } else if (flags.clear) {
        // Clear all answers
        const state = await stateManager.getState()
        state.answers = {}
        await stateStore.write(state)
        logger.success('All answers cleared.')
      } else if (flags.question && flags.answer) {
        // Direct answer provided via flags
        await stateManager.setAnswer(flags.question, flags.answer)
        logger.success(`Answer saved for: ${flags.question}`)
      } else if (flags.question) {
        // Prompt for specific question
        const answer = await this.promptUser(flags.question)
        await stateManager.setAnswer(flags.question, answer)
        logger.success(`Answer saved for: ${flags.question}`)
      } else {
        // Show help
        logger.info('Usage:')
        logger.info('  docbuilder answer --list                              List all answers')
        logger.info('  docbuilder answer --clear                             Clear all answers')
        logger.info('  docbuilder answer --question "Q" --answer "A"          Add answer')
        logger.info('  docbuilder answer --question "Q"                      Prompt for answer')
      }
    } catch (error) {
      logger.error(`Failed to save answer: ${error instanceof Error ? error.message : String(error)}`)
      this.exit(1)
    }
  }

  private async promptUser(question: string): Promise<string> {
    // Use Node.js readline for interactive prompting
    const readline = await import('node:readline')
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    })

    return new Promise((resolve) => {
      rl.question(`${question}: `, (answer) => {
        rl.close()
        resolve(answer)
      })
    })
  }
}
