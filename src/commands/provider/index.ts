import { Command } from '@oclif/core'
import { listProviderNames, resolveApiKey, PROVIDER_CATALOG } from '../../ai/providerCatalog.js'
import { ProviderStore } from '../../storage/ProviderStore.js'
import { Logger } from '../../utils/logger.js'

/**
 * `docbuilder provider` — overview of configured providers and the active
 * default, plus a hint to the subcommands (SDD §6.5).
 */
export default class Provider extends Command {
  static description = 'Manage AI providers (list / add / set / test / status)'

  async run(): Promise<void> {
    const logger = new Logger()
    const store = new ProviderStore()
    const config = (await store.exists()) ? await store.read() : null

    logger.divider('AI Providers')
    for (const name of listProviderNames()) {
      const fileKey = config?.providers[name]?.apiKey ?? null
      const { source } = resolveApiKey(name, fileKey)
      const active = config?.default === name ? ' (active)' : ''
      const state = source ? `configured via ${source}` : 'not configured'
      logger.info(`${PROVIDER_CATALOG[name].displayName}: ${state}${active}`)
    }
    logger.divider()
    logger.info('Subcommands: provider list | add <name> --key <key> | set <name> | test [name] | status')
  }
}
