import { Command, Flags } from '@oclif/core'
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
import { QuestionExtractor } from '../core/QuestionExtractor.js'
import { QuestionPrompter } from '../core/QuestionPrompter.js'
import { existsSync } from 'node:fs'

export default class Generate extends Command {
  static description = 'Generate the next pending document in the pipeline'

  static examples = [
    '<%= config.bin %> <%= command.id %>',
    '<%= config.bin %> <%= command.id %> --mode fast-draft',
    '<%= config.bin %> <%= command.id %> --dry-run',
    '<%= config.bin %> <%= command.id %> --force',
  ]

  static flags = {
    mode: Flags.string({
      description: 'Quality mode override',
      options: ['fast-draft', 'balanced', 'deep-analysis'],
    }),
    dryRun: Flags.boolean({
      description: 'Dry run: show what would be generated without actually generating',
      default: false,
    }),
    force: Flags.boolean({
      description: 'Force generation even if confidence is low',
      default: false,
    }),
    noPrompt: Flags.boolean({
      description: 'Disable automatic question prompting after document generation',
      default: false,
    }),
  }

  async run(): Promise<void> {
    const { flags } = await this.parse(Generate)

    // Determine project root (current directory must be a docbuilder project)
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
    const questionExtractor = new QuestionExtractor(aiGateway, logger)
    const questionPrompter = new QuestionPrompter(stateManager, logger)
    const pipeline = new DocumentPipeline(
      stateManager,
      documentGenerator,
      qualityGate,
      fileManager,
      logger,
      finalReview,
      questionExtractor,
      questionPrompter,
    )

    try {
      await pipeline.generateNext({
        modeOverride: flags.mode as 'fast-draft' | 'balanced' | 'deep-analysis' | undefined,
        dryRun: flags.dryRun,
        force: flags.force,
        promptForAnswers: !flags.noPrompt,
      })
    } catch (error) {
      logger.error(`Generation failed: ${error instanceof Error ? error.message : String(error)}`)
      this.exit(1)
    }
  }
}
