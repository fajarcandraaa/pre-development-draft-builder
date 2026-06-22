import { Command } from '@oclif/core'
import {
  PROVIDER_CATALOG,
  listProviderNames,
  maskKey,
  resolveApiKey,
} from '../../ai/providerCatalog.js'
import { ProviderStore } from '../../storage/ProviderStore.js'
import { Logger } from '../../utils/logger.js'

/**
 * `docbuilder provider status` — per-provider configuration detail: configured
 * state, key source (env/file), masked key, and which provider is active.
 */
export default class ProviderStatus extends Command {
  static description = 'Show configuration status for each AI provider'

  async run(): Promise<void> {
    const logger = new Logger()
    const store = new ProviderStore()
    const config = (await store.exists()) ? await store.read() : null

    const rows = listProviderNames().map((name) => {
      const fileKey = config?.providers[name]?.apiKey ?? null
      const { key, source } = resolveApiKey(name, fileKey)
      return [
        PROVIDER_CATALOG[name].displayName,
        key ? 'configured' : 'not configured',
        source ?? '—',
        key ? maskKey(key) : '—',
        config?.default === name ? 'yes' : '',
      ]
    })

    logger.divider('Provider Status')
    logger.table({ head: ['Provider', 'State', 'Source', 'Key', 'Active'], rows })
    logger.info(`Active provider: ${config?.default ?? '(none)'}`)
  }
}
