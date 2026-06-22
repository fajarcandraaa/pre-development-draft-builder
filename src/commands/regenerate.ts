import { Args, Command, Flags } from '@oclif/core'
import { DocumentPipeline } from '../core/DocumentPipeline.js'
import { StateManager } from '../core/StateManager.js'
import { DocumentGenerator } from '../core/DocumentGenerator.js'
import { QualityGate } from '../core/QualityGate.js'
import { FinalReview } from '../core/FinalReview.js'
import { FileManager } from '../storage/FileManager.js'
import { Logger } from '../utils/logger.js'
import { AIGateway } from '../ai/AIGateway.js'
import { ProviderRegistryService } from '../ai/ProviderRegistryService.js'
import { ProviderStore } from '../storage/ProviderStore.js'
import { ContextBuilder } from '../core/ContextBuilder.js'
import { StateStore } from '../storage/StateStore.js'
import { existsSync } from 'node:fs'

export default class Regenerate extends Command {
  static description = 'Regenerate a specific document with optional revision note'

  static examples = [
    '<%= config.bin %> <%= command.id %> brd',
    '<%= config.bin %> <%= command.id %> brd --note "expand stakeholder section"',
  ]

  static args = {
    document: Args.string({
      description: 'Document to regenerate (e.g., discovery-notes, brd, sow, prd)',
      required: true,
    }),
  }

  static flags = {
    note: Flags.string({
      description: 'Revision note to include in the generation context',
    }),
  }

  async run(): Promise<void> {
    const { args, flags } = await this.parse(Regenerate)

    const projectRoot = process.cwd()
    const statePath = `${projectRoot}/.docbuilder/state.json`

    if (!existsSync(statePath)) {
      console.error('Error: Not a docbuilder project. Run this command from a project directory.')
      this.exit(1)
    }

    const logger = new Logger()

    // Initialize dependencies
    const providerRegistry = new ProviderRegistryService()
    const providerStore = new ProviderStore()
    const aiGateway = new AIGateway(providerRegistry, providerStore)
    const stateStore = new StateStore(projectRoot)
    const stateManager = new StateManager(stateStore)
    const fileManager = new FileManager(projectRoot)
    const contextBuilder = new ContextBuilder(aiGateway, fileManager, logger)
    const documentGenerator = new DocumentGenerator(aiGateway, fileManager, logger)
    const qualityGate = new QualityGate(aiGateway, fileManager, logger)
    const finalReview = new FinalReview(aiGateway, fileManager, logger)
    const pipeline = new DocumentPipeline(
      stateManager,
      documentGenerator,
      qualityGate,
      fileManager,
      logger,
      finalReview,
    )

    try {
      await pipeline.regenerate(args.document, { revisionNote: flags.note })
    } catch (error) {
      logger.error(`Failed to regenerate ${args.document}: ${error instanceof Error ? error.message : String(error)}`)
      this.exit(1)
    }
  }
}
