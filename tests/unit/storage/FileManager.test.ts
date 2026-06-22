import { existsSync } from 'node:fs'
import { readFile, readdir, rm } from 'node:fs/promises'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { getProjectPaths } from '../../../src/config/paths'
import { FileManager } from '../../../src/storage/FileManager'
import { makeTempDir } from '../../helpers/fixtures'

describe('FileManager', () => {
  let projectDir: string
  let fm: FileManager

  beforeEach(async () => {
    projectDir = await makeTempDir()
    fm = new FileManager(projectDir)
  })

  afterEach(async () => {
    await rm(projectDir, { recursive: true, force: true })
  })

  it('createProjectStructure creates the full layout', async () => {
    await fm.createProjectStructure()
    const p = getProjectPaths(projectDir)
    for (const dir of [p.stateDir, p.input, p.planning, p.documents, p.reviews, p.versions]) {
      expect(existsSync(dir)).toBe(true)
    }
  })

  it('resolves document path using the registry filename', () => {
    expect(fm.getDocumentPath('brd')).toMatch(/documents\/02-brd\.md$/)
  })

  it('writes and reads a document', async () => {
    await fm.writeDocument('brd', '# BRD')
    expect(await fm.documentExists('brd')).toBe(true)
    expect(await fm.readDocument('brd')).toBe('# BRD')
  })

  it('writes and reads a review', async () => {
    await fm.writeReview('brd', 'QG report')
    expect(fm.getReviewPath('brd')).toMatch(/reviews\/brd-quality-gate\.md$/)
    expect(await fm.readReview('brd')).toBe('QG report')
  })

  it('writes/reads planning and input files', async () => {
    await fm.writePlanning('context.md', 'ctx')
    await fm.writeInput('raw-brief.md', 'brief')
    expect(await fm.readPlanning('context.md')).toBe('ctx')
    expect(await fm.readInput('raw-brief.md')).toBe('brief')
  })

  it('archiveVersion moves the current document into versions/', async () => {
    await fm.writeDocument('brd', 'v1 content')
    await fm.archiveVersion('brd', 1)

    expect(await fm.documentExists('brd')).toBe(false)
    const versionFiles = await readdir(getProjectPaths(projectDir).versions)
    expect(versionFiles).toHaveLength(1)
    expect(versionFiles[0]).toMatch(/^brd-v1-.*\.md$/)
    const archived = await readFile(
      `${getProjectPaths(projectDir).versions}/${versionFiles[0]}`,
      'utf8',
    )
    expect(archived).toBe('v1 content')
  })

  it('getVersionPath formats <docId>-v<N>-<timestamp>.md', () => {
    const p = fm.getVersionPath('brd', 2, '2026-06-18T00-00-00-000Z')
    expect(p).toMatch(/versions\/brd-v2-2026-06-18T00-00-00-000Z\.md$/)
  })
})
