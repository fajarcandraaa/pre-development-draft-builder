import { existsSync } from 'node:fs'
import { rm } from 'node:fs/promises'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import Init from '../../src/commands/init'
import { getProjectPaths } from '../../src/config/paths'
import { StateStore } from '../../src/storage/StateStore'
import { makeTempDir } from '../helpers/fixtures'

// No TTY in tests: stub interactive prompts. `confirm` declines by default so
// the "directory exists" path aborts deterministically instead of hanging.
vi.mock('@inquirer/prompts', () => ({
  confirm: vi.fn(async () => false),
  input: vi.fn(async () => ''),
  select: vi.fn(async () => 'id'),
}))

/**
 * Runs `docbuilder init` non-interactively (all values via flags) so no TTY
 * prompt is triggered. Verifies S1-T04 acceptance criteria end-to-end.
 */
describe('docbuilder init (non-interactive)', () => {
  let parentDir: string

  beforeEach(async () => {
    parentDir = await makeTempDir('docbuilder-init-')
    vi.spyOn(console, 'log').mockImplementation(() => undefined)
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
  })

  afterEach(async () => {
    vi.restoreAllMocks()
    await rm(parentDir, { recursive: true, force: true })
  })

  const runInit = (extra: string[] = []): Promise<unknown> =>
    Init.run([
      '--name',
      'EOffice 2.0',
      '--language',
      'id',
      '--mode',
      'balanced',
      '--input',
      'text',
      '--brief',
      'Build an internal e-office system.',
      '--dir',
      parentDir,
      ...extra,
    ])

  it('creates structure, brief, and an all-pending state.json', async () => {
    await runInit()

    const projectDir = join(parentDir, 'eoffice-2-0')
    const p = getProjectPaths(projectDir)
    for (const dir of [p.stateDir, p.input, p.planning, p.documents, p.reviews, p.versions]) {
      expect(existsSync(dir)).toBe(true)
    }
    expect(existsSync(join(p.input, 'raw-brief.md'))).toBe(true)

    const state = await new StateStore(projectDir).read()
    expect(Object.keys(state.documents)).toHaveLength(9)
    expect(Object.values(state.documents).every((d) => d.status === 'pending')).toBe(true)
    expect(state.project.slug).toBe('eoffice-2-0')
    expect(state.project.language).toBe('id')
    expect(state.pipeline.stage1Approved).toBe(false)
  })

  it('aborts on an existing directory without --force/--yes', async () => {
    await runInit()
    const before = await new StateStore(join(parentDir, 'eoffice-2-0')).read()

    // Second run with a different brief but no overwrite consent → must abort.
    await Init.run([
      '--name',
      'EOffice 2.0',
      '--language',
      'en',
      '--mode',
      'fast-draft',
      '--input',
      'text',
      '--brief',
      'changed',
      '--dir',
      parentDir,
    ])

    const after = await new StateStore(join(parentDir, 'eoffice-2-0')).read()
    expect(after.project.language).toBe(before.project.language) // unchanged ('id')
  })

  it('fails fast on a missing brief file without creating a partial project', async () => {
    await expect(
      Init.run([
        '--name',
        'EOffice 2.0',
        '--language',
        'id',
        '--mode',
        'balanced',
        '--input',
        'file',
        '--file',
        join(parentDir, 'missing-brief.md'),
        '--dir',
        parentDir,
      ]),
    ).rejects.toThrow()
    // No project directory should have been created.
    expect(existsSync(join(parentDir, 'eoffice-2-0'))).toBe(false)
  })

  it('overwrites an existing directory with --force', async () => {
    await runInit()
    // Re-run with --force and English to confirm overwrite.
    await Init.run([
      '--name',
      'EOffice 2.0',
      '--language',
      'en',
      '--mode',
      'balanced',
      '--input',
      'text',
      '--brief',
      'reinit',
      '--dir',
      parentDir,
      '--force',
    ])
    const state = await new StateStore(join(parentDir, 'eoffice-2-0')).read()
    expect(state.project.language).toBe('en')
  })
})
