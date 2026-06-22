import { Args, Command, Flags } from '@oclif/core'
import {
  PROVIDER_CATALOG,
  buildDefaultEntry,
  isKnownProvider,
  listProviderNames,
  maskKey,
} from '../../ai/providerCatalog.js'
import { ProviderStore } from '../../storage/ProviderStore.js'
import type { ProviderConfig } from '../../storage/schemas.js'
import { Logger } from '../../utils/logger.js'

/**
 * `docbuilder provider add <name> --key <key>` — stores an API key in the global
 * `provider.json` (perm 600). Warns if the matching env var is set, since the
 * env var takes precedence at resolve time (SDD §6.5/§6.6).
 */
export default class ProviderAdd extends Command {
  static description = 'Add or update an AI provider API key'

  static args = {
    name: Args.string({ required: true, description: 'Provider name (openai | anthropic)' }),
  }

  static flags = {
    key: Flags.string({ required: true, description: 'API key to store' }),
  }

  async run(): Promise<void> {
    const { args, flags } = await this.parse(ProviderAdd)
    const logger = new Logger()

    if (!isKnownProvider(args.name)) {
      logger.error(`Unknown provider "${args.name}". Known: ${listProviderNames().join(', ')}.`)
      this.exit(1)
      return
    }

    const store = new ProviderStore()
    const config: ProviderConfig = (await store.exists())
      ? await store.read()
      : { default: args.name, encryption: 'none', providers: {}, updatedAt: new Date().toISOString() }

    const envVar = PROVIDER_CATALOG[args.name].envVar
    if (process.env[envVar]) {
      logger.warning(
        `${envVar} is set in the environment — it takes precedence over the stored key.`,
      )
    }

    config.providers[args.name] = buildDefaultEntry(args.name, flags.key)
    config.default ||= args.name
    config.updatedAt = new Date().toISOString()
    await store.write(config)

    logger.success(`Saved API key for ${args.name} (${maskKey(flags.key)}).`)
    if (config.default === args.name) {
      logger.info(`${args.name} is the active default provider.`)
    }
  }
}
