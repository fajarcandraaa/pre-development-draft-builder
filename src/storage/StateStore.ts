import { existsSync } from 'node:fs'
import { mkdir, readFile } from 'node:fs/promises'
import { dirname } from 'node:path'
import writeFileAtomic from 'write-file-atomic'
import { getProjectPaths } from '../config/paths.js'
import { ProjectStateSchema, type ProjectState } from './schemas.js'

/**
 * Atomic read/write of `<projectDir>/.docbuilder/state.json` (SDD §6.4).
 * All reads are Zod-validated; all writes go through `write-file-atomic`
 * (tmp + rename) so a crash never leaves a partial state file (TRD §5.9).
 */
export class StateStore {
  constructor(private readonly projectDir: string) {}

  private getPath(): string {
    return getProjectPaths(this.projectDir).stateFile
  }

  async read(): Promise<ProjectState> {
    const raw = await readFile(this.getPath(), 'utf8')
    return ProjectStateSchema.parse(JSON.parse(raw))
  }

  async write(state: ProjectState): Promise<void> {
    const validated = ProjectStateSchema.parse(state)
    await mkdir(dirname(this.getPath()), { recursive: true })
    await writeFileAtomic(this.getPath(), `${JSON.stringify(validated, null, 2)}\n`)
  }

  async exists(): Promise<boolean> {
    return existsSync(this.getPath())
  }
}
