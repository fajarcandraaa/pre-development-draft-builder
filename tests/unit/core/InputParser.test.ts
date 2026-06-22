import { rm, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { InputParser } from '../../../src/core/InputParser'
import { BriefFileNotFoundError } from '../../../src/core/errors'
import { FileManager } from '../../../src/storage/FileManager'
import { makeTempDir } from '../../helpers/fixtures'

describe('InputParser', () => {
  let projectDir: string
  let parser: InputParser
  let fm: FileManager

  beforeEach(async () => {
    projectDir = await makeTempDir()
    fm = new FileManager(projectDir)
    await fm.createProjectStructure()
    parser = new InputParser(fm)
  })

  afterEach(async () => {
    await rm(projectDir, { recursive: true, force: true })
  })

  it('parseFromText trims prompt output', async () => {
    expect(await parser.parseFromText(async () => '  hello  ')).toBe('hello')
  })

  it('parseFromFile reads file content', async () => {
    const file = join(projectDir, 'brief.txt')
    await writeFile(file, 'a brief', 'utf8')
    expect(await parser.parseFromFile(file)).toBe('a brief')
  })

  it('parseFromFile throws BriefFileNotFoundError for a missing file', async () => {
    await expect(parser.parseFromFile(join(projectDir, 'nope.txt'))).rejects.toBeInstanceOf(
      BriefFileNotFoundError,
    )
  })

  it('saveBrief writes input/raw-brief.md', async () => {
    await parser.saveBrief('my brief')
    expect(await fm.readInput('raw-brief.md')).toBe('my brief')
  })

  it('counts words and characters', () => {
    expect(parser.getWordCount('one two three')).toBe(3)
    expect(parser.getWordCount('   ')).toBe(0)
    expect(parser.getCharCount('abc')).toBe(3)
  })
})
