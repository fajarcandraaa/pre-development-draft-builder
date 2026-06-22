import { Command } from '@oclif/core'
import { PROVIDER_CATALOG, listProviderNames, resolveApiKey } from '../../ai/providerCatalog.js'
import { ProviderStore } from '../../storage/ProviderStore.js'
import { Logger } from '../../utils/logger.js'

/** `docbuilder provider list` — lists known providers and configured state. */
export default class ProviderList extends Command {
  static description = 'List supported AI providers and their configuration state'

  async run(): Promise<void> {
    const logger = new Logger()
    const store = new ProviderStore()
    const config = (await store.exists()) ? await store.read() : null

    const rows = listProviderNames().map((name) => {
      const fileKey = config?.providers[name]?.apiKey ?? null
      const { source } = resolveApiKey(name, fileKey)
      return [
        PROVIDER_CATALOG[name].displayName,
        name,
        source ? `yes (${source})` : 'no',
        config?.default === name ? 'yes' : '',
      ]
    })

    logger.table({ head: ['Provider', 'Name', 'Configured', 'Active'], rows })
  }
}
