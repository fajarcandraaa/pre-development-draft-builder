import { Args, Command } from '@oclif/core'
import {
  isKnownProvider,
  listProviderNames,
  pingProvider,
  resolveApiKey,
  type ProviderName,
} from '../../ai/providerCatalog.js'
import { ProviderStore } from '../../storage/ProviderStore.js'
import { Logger } from '../../utils/logger.js'

/**
 * `docbuilder provider test [name]` — verifies connectivity/auth for a provider
 * by pinging its models endpoint. Defaults to the active provider. Resolves the
 * key with env-var precedence and prints an actionable error on failure.
 */
export default class ProviderTest extends Command {
  static description = 'Test connectivity and authentication for an AI provider'

  static args = {
    name: Args.string({ required: false, description: 'Provider to test (defaults to active)' }),
  }

  async run(): Promise<void> {
    const { args } = await this.parse(ProviderTest)
    const logger = new Logger()
    const store = new ProviderStore()
    const config = (await store.exists()) ? await store.read() : null

    const name = (args.name ?? config?.default) as ProviderName | undefined
    if (!name) {
      logger.error('No provider specified and no active default. Run "docbuilder provider add" first.')
      this.exit(1)
      return
    }
    if (!isKnownProvider(name)) {
      logger.error(`Unknown provider "${name}". Known: ${listProviderNames().join(', ')}.`)
      this.exit(1)
      return
    }

    const { key, source } = resolveApiKey(name, config?.providers[name]?.apiKey ?? null)
    if (!key) {
      logger.error(
        `No API key for "${name}". Set $${name.toUpperCase()}_API_KEY or run "docbuilder provider add ${name} --key <key>".`,
      )
      this.exit(1)
      return
    }

    logger.progress(`Testing ${name} (key source: ${source})...`)
    const result = await pingProvider(name, key)
    if (result.ok) {
      logger.success(`${name} reachable and authenticated (${result.ms} ms).`)
    } else {
      logger.error(`${name} test failed (${result.ms} ms): ${result.error}`)
      this.exit(1)
    }
  }
}
