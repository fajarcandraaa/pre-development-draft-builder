import { existsSync } from 'node:fs'
import { basename } from 'node:path'
import { describe, expect, it } from 'vitest'
import { getTemplatesDir } from '../../src/utils/templatePath'

describe('template path resolution (SDD R-03)', () => {
  it('resolves the bundled templates directory', () => {
    const dir = getTemplatesDir()
    expect(basename(dir)).toBe('templates')
    expect(existsSync(dir)).toBe(true)
  })
})
