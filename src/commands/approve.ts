import { Args, Command } from '@oclif/core'
import { StateManager } from '../core/StateManager.js'
import { StateStore } from '../storage/StateStore.js'
import { Logger } from '../utils/logger.js'
import { existsSync } from 'node:fs'

export default class Approve extends Command {
  static description = 'Approve a stage or document to proceed to the next phase'

  static examples = [
    '<%= config.bin %> <%= command.id %> stage-1',
  ]

  static args = {
    target: Args.string({
      description: 'Target to approve (e.g., stage-1)',
      required: true,
    }),
  }

  async run(): Promise<void> {
    const { args } = await this.parse(Approve)

    const projectRoot = process.cwd()
    const statePath = `${projectRoot}/.docbuilder/state.json`

    if (!existsSync(statePath)) {
      console.error('Error: Not a docbuilder project. Run this command from a project directory.')
      this.exit(1)
    }

    const logger = new Logger()
    const stateStore = new StateStore(projectRoot)
    const stateManager = new StateManager(stateStore)

    if (args.target === 'stage-1') {
      await stateManager.setStage1Approved()
      logger.success('Stage 1 approved. You can now generate Stage 2 documents.')
    } else {
      logger.error(`Unknown target "${args.target}". Supported: stage-1`)
      this.exit(1)
    }
  }
}
