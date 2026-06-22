import { homedir } from 'node:os'
import { describe, expect, it } from 'vitest'
import { GLOBAL_DIR, PROVIDER_FILE, getProjectPaths } from '../../../src/config/paths'

describe('paths', () => {
  it('points the global dir + provider file under the home directory', () => {
    expect(GLOBAL_DIR).toBe(`${homedir()}/.docbuilder`)
    expect(PROVIDER_FILE).toBe(`${homedir()}/.docbuilder/provider.json`)
  })

  it('builds the per-project layout relative to the project dir', () => {
    const p = getProjectPaths('/tmp/proj')
    expect(p.root).toBe('/tmp/proj')
    expect(p.stateDir).toBe('/tmp/proj/.docbuilder')
    expect(p.stateFile).toBe('/tmp/proj/.docbuilder/state.json')
    expect(p.input).toBe('/tmp/proj/input')
    expect(p.planning).toBe('/tmp/proj/planning')
    expect(p.documents).toBe('/tmp/proj/documents')
    expect(p.reviews).toBe('/tmp/proj/reviews')
    expect(p.versions).toBe('/tmp/proj/versions')
  })
})
