import { homedir } from 'node:os'
import { join } from 'node:path'

/** Global config directory (shared across all projects). */
export const GLOBAL_DIR = join(homedir(), '.docbuilder')

/** Global provider config file: ~/.docbuilder/provider.json */
export const PROVIDER_FILE = join(GLOBAL_DIR, 'provider.json')

/**
 * Resolves the provider config path. Honors `DOCBUILDER_PROVIDER_FILE` (used by
 * tests to avoid touching the real `~/.docbuilder/provider.json`), otherwise
 * defaults to the global location.
 */
export function getProviderFilePath(): string {
  return process.env.DOCBUILDER_PROVIDER_FILE ?? PROVIDER_FILE
}

/** Per-project state directory name. */
export const PROJECT_STATE_DIR = '.docbuilder'

/** Per-project state filename. */
export const STATE_FILENAME = 'state.json'

export interface ProjectPaths {
  root: string
  stateDir: string
  stateFile: string
  input: string
  planning: string
  documents: string
  reviews: string
  versions: string
}

/**
 * Resolves the canonical per-project directory layout (TRD §5.10).
 * Pure function — no I/O.
 */
export function getProjectPaths(projectDir: string): ProjectPaths {
  const stateDir = join(projectDir, PROJECT_STATE_DIR)
  return {
    root: projectDir,
    stateDir,
    stateFile: join(stateDir, STATE_FILENAME),
    input: join(projectDir, 'input'),
    planning: join(projectDir, 'planning'),
    documents: join(projectDir, 'documents'),
    reviews: join(projectDir, 'reviews'),
    versions: join(projectDir, 'versions'),
  }
}
