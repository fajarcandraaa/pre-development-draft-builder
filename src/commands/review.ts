import { Args, Command, Flags } from '@oclif/core'
import { FileManager } from '../storage/FileManager.js'
import { Logger } from '../utils/logger.js'
import { existsSync } from 'node:fs'

export default class Review extends Command {
  static description = 'Review a document or quality gate report'

  static examples = [
    '<%= config.bin %> <%= command.id %> discovery-notes',
    '<%= config.bin %> <%= command.id %> discovery-notes --gate',
  ]

  static args = {
    document: Args.string({
      description: 'Document to review (e.g., discovery-notes, brd, sow, prd)',
      required: true,
    }),
  }

  static flags = {
    gate: Flags.boolean({
      description: 'Show quality gate report',
      default: false,
    }),
  }

  async run(): Promise<void> {
    const { args, flags } = await this.parse(Review)

    const projectRoot = process.cwd()
    const statePath = `${projectRoot}/.docbuilder/state.json`

    if (!existsSync(statePath)) {
      console.error('Error: Not a docbuilder project. Run this command from a project directory.')
      this.exit(1)
    }

    const logger = new Logger()
    const fileManager = new FileManager(projectRoot)

    try {
      if (flags.gate) {
        const report = await fileManager.readReview(args.document)
        console.log(report)
      } else {
        const content = await fileManager.readDocument(args.document)
        console.log(content)
      }
    } catch (error) {
      logger.error(`Failed to review ${args.document}: ${error instanceof Error ? error.message : String(error)}`)
      this.exit(1)
    }
  }
}
