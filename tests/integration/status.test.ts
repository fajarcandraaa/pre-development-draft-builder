import { rm } from 'node:fs/promises'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import Init from '../../src/commands/init'
import Status from '../../src/commands/status'
import { makeTempDir } from '../helpers/fixtures'

vi.mock('@inquirer/prompts', () => ({
  confirm: vi.fn(async () => false),
  input: vi.fn(async () => ''),
  select: vi.fn(async () => 'id'),
}))

describe('docbuilder status', () => {
  let parentDir: string
  let logSpy: ReturnType<typeof vi.spyOn>

  beforeEach(async () => {
    parentDir = await makeTempDir('docbuilder-status-')
    logSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined)
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
  })

  afterEach(async () => {
    vi.restoreAllMocks()
    await rm(parentDir, { recursive: true, force: true })
  })

  const output = (): string =>
    logSpy.mock.calls.map((c: unknown[]) => String(c[0])).join('\n')

  it('renders the 9-document pipeline for an initialized project', async () => {
    await Init.run([
      '--name',
      'Demo',
      '--language',
      'id',
      '--mode',
      'balanced',
      '--input',
      'text',
      '--brief',
      'brief',
      '--dir',
      parentDir,
    ])

    await Status.run(['--dir', join(parentDir, 'demo')])

    const out = output()
    expect(out).toContain('Discovery Notes')
    expect(out).toContain('Task Breakdown')
    expect(out).toContain('pending')
    expect(out).toContain('Stage 1 approved: no')
  })

  it('errors when there is no project in the directory', async () => {
    await expect(Status.run(['--dir', parentDir])).rejects.toThrow()
  })
})
