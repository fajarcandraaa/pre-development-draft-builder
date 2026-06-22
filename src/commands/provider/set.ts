import { Args, Command, Flags } from '@oclif/core'
import { confirm } from '@inquirer/prompts'
import { isKnownProvider, listProviderNames, resolveApiKey } from '../../ai/providerCatalog.js'
import { ProviderStore } from '../../storage/ProviderStore.js'
import { Logger } from '../../utils/logger.js'

/**
 * `docbuilder provider set <name>` — switches the active default provider.
 * Requires the provider to be configured (env var or stored key) and confirms
 * the change unless `--yes` is given.
 */
export default class ProviderSet extends Command {
  static description = 'Set the active default AI provider'

  static args = {
    name: Args.string({ required: true, description: 'Provider name (openai | anthropic)' }),
  }

  static flags = {
    yes: Flags.boolean({ default: false, description: 'Skip the confirmation prompt' }),
  }

  async run(): Promise<void> {
    const { args, flags } = await this.parse(ProviderSet)
    const logger = new Logger()

    if (!isKnownProvider(args.name)) {
      logger.error(`Unknown provider "${args.name}". Known: ${listProviderNames().join(', ')}.`)
      this.exit(1)
      return
    }

    const store = new ProviderStore()
    if (!(await store.exists())) {
      logger.error('No providers configured yet. Run "docbuilder provider add <name> --key <key>".')
      this.exit(1)
      return
    }

    const config = await store.read()
    const { key } = resolveApiKey(args.name, config.providers[args.name]?.apiKey ?? null)
    if (!key) {
      logger.error(`Provider "${args.name}" is not configured. Add a key before setting it active.`)
      this.exit(1)
      return
    }

    if (config.default === args.name) {
      logger.info(`${args.name} is already the active provider.`)
      return
    }

    const proceed =
      flags.yes ||
      (await confirm({
        message: `Switch active provider from "${config.default}" to "${args.name}"?`,
        default: true,
      }))
    if (!proceed) {
      logger.warning('Aborted — active provider unchanged.')
      return
    }

    config.default = args.name
    config.updatedAt = new Date().toISOString()
    await store.write(config)
    logger.success(`Active provider set to ${args.name}.`)
  }
}
