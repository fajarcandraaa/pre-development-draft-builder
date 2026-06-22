import { rm } from 'node:fs/promises'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import ProviderAdd from '../../src/commands/provider/add'
import ProviderSet from '../../src/commands/provider/set'
import ProviderStatusCmd from '../../src/commands/provider/status'
import ProviderTest from '../../src/commands/provider/test'
import { ProviderStore } from '../../src/storage/ProviderStore'
import { makeTempDir } from '../helpers/fixtures'

vi.mock('@inquirer/prompts', () => ({
  confirm: vi.fn(async () => true),
  input: vi.fn(async () => ''),
  select: vi.fn(async () => 'openai'),
}))

describe('docbuilder provider (isolated config file)', () => {
  let dir: string
  let configPath: string
  const ORIGINAL_ENV = { ...process.env }

  beforeEach(async () => {
    dir = await makeTempDir('docbuilder-provider-')
    configPath = join(dir, 'provider.json')
    process.env.DOCBUILDER_PROVIDER_FILE = configPath
    delete process.env.OPENAI_API_KEY
    delete process.env.ANTHROPIC_API_KEY
    vi.spyOn(console, 'log').mockImplementation(() => undefined)
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
  })

  afterEach(async () => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
    process.env = { ...ORIGINAL_ENV }
    await rm(dir, { recursive: true, force: true })
  })

  it('add stores a key and makes the first provider the active default', async () => {
    await ProviderAdd.run(['openai', '--key', 'sk-abcd1234'])

    const config = await new ProviderStore(configPath).read()
    expect(config.default).toBe('openai')
    expect(config.providers.openai.apiKey).toBe('sk-abcd1234')
    expect(config.providers.openai.models.balanced).toBe('gpt-4o')
  })

  it('add rejects an unknown provider', async () => {
    await expect(ProviderAdd.run(['gemini', '--key', 'x'])).rejects.toThrow()
  })

  it('set switches the active provider once configured', async () => {
    await ProviderAdd.run(['openai', '--key', 'sk-openai'])
    await ProviderAdd.run(['anthropic', '--key', 'sk-anthropic'])

    await ProviderSet.run(['anthropic', '--yes'])

    const config = await new ProviderStore(configPath).read()
    expect(config.default).toBe('anthropic')
  })

  it('set rejects an unconfigured provider', async () => {
    await ProviderAdd.run(['openai', '--key', 'sk-openai'])
    await expect(ProviderSet.run(['anthropic', '--yes'])).rejects.toThrow()
  })

  it('status runs without throwing once a provider exists', async () => {
    await ProviderAdd.run(['openai', '--key', 'sk-openai'])
    await expect(ProviderStatusCmd.run([])).resolves.toBeUndefined()
  })

  it('test pings the resolved provider (fetch mocked)', async () => {
    await ProviderAdd.run(['openai', '--key', 'sk-openai'])
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, status: 200 }) as Response))
    await expect(ProviderTest.run(['openai'])).resolves.toBeUndefined()
  })

  it('test fails when no key is resolvable', async () => {
    // provider.json has openai only; testing anthropic with no key/env → exit 1
    await ProviderAdd.run(['openai', '--key', 'sk-openai'])
    await expect(ProviderTest.run(['anthropic'])).rejects.toThrow()
  })
})
