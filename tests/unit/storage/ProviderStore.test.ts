import { stat } from 'node:fs/promises'
import { join } from 'node:path'
import { platform } from 'node:process'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { rm } from 'node:fs/promises'
import { ProviderStore } from '../../../src/storage/ProviderStore'
import { makeProviderConfig, makeTempDir } from '../../helpers/fixtures'

describe('ProviderStore', () => {
  let dir: string
  let filePath: string

  beforeEach(async () => {
    dir = await makeTempDir()
    filePath = join(dir, 'nested', 'provider.json')
  })

  afterEach(async () => {
    await rm(dir, { recursive: true, force: true })
  })

  it('reports not existing before any write', async () => {
    const store = new ProviderStore(filePath)
    expect(await store.exists()).toBe(false)
  })

  it('creates parent dirs, writes, and reads back an equal config', async () => {
    const store = new ProviderStore(filePath)
    const config = makeProviderConfig()

    await store.write(config)

    expect(await store.exists()).toBe(true)
    expect(await store.read()).toEqual(config)
  })

  it.skipIf(platform === 'win32')('writes provider.json with 600 permission', async () => {
    const store = new ProviderStore(filePath)
    await store.write(makeProviderConfig())
    const mode = (await stat(filePath)).mode & 0o777
    expect(mode).toBe(0o600)
  })

  it('rejects an invalid config', async () => {
    const store = new ProviderStore(filePath)
    // @ts-expect-error intentionally invalid
    await expect(store.write({ default: 'openai' })).rejects.toThrow()
  })
})
