import { rm, writeFile } from 'node:fs/promises'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { getProjectPaths } from '../../../src/config/paths'
import { StateStore } from '../../../src/storage/StateStore'
import { makeProjectState, makeTempDir } from '../../helpers/fixtures'

describe('StateStore', () => {
  let projectDir: string

  beforeEach(async () => {
    projectDir = await makeTempDir()
  })

  afterEach(async () => {
    await rm(projectDir, { recursive: true, force: true })
  })

  it('reports not existing before any write', async () => {
    const store = new StateStore(projectDir)
    expect(await store.exists()).toBe(false)
  })

  it('writes (creating .docbuilder dir) and reads back an equal state', async () => {
    const store = new StateStore(projectDir)
    const state = makeProjectState()

    await store.write(state)

    expect(await store.exists()).toBe(true)
    const read = await store.read()
    expect(read).toEqual(state)
  })

  it('writes the state file at <projectDir>/.docbuilder/state.json', async () => {
    const store = new StateStore(projectDir)
    await store.write(makeProjectState())
    expect(getProjectPaths(projectDir).stateFile).toMatch(/\.docbuilder\/state\.json$/)
    expect(await store.exists()).toBe(true)
  })

  it('throws a Zod error when the file is not valid state', async () => {
    const store = new StateStore(projectDir)
    await store.write(makeProjectState())
    await writeFile(getProjectPaths(projectDir).stateFile, '{"project":{}}', 'utf8')
    await expect(store.read()).rejects.toThrow()
  })

  it('rejects writing an invalid state object', async () => {
    const store = new StateStore(projectDir)
    // @ts-expect-error intentionally invalid
    await expect(store.write({ project: {} })).rejects.toThrow()
  })
})
