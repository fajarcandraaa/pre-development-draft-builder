import { existsSync } from 'node:fs'
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { getProjectPaths, type ProjectPaths } from '../config/paths.js'
import { getDocumentFilename } from '../config/registry.js'

/**
 * Filesystem operations for a single project (SDD §6.4).
 *
 * Document/review/planning/input files are plain `.md` written with a normal
 * (non-atomic) write — they are written once when generation completes, so
 * there is no dangerous partial-write window (TRD §5.9). Atomicity for
 * `state.json` / `provider.json` lives in StateStore / ProviderStore.
 */
export class FileManager {
  private readonly paths: ProjectPaths

  constructor(private readonly projectDir: string) {
    this.paths = getProjectPaths(projectDir)
  }

  /** Creates the full per-project directory layout (TRD §5.10). Idempotent. */
  async createProjectStructure(): Promise<void> {
    const dirs = [
      this.paths.stateDir,
      this.paths.input,
      this.paths.planning,
      this.paths.documents,
      this.paths.reviews,
      this.paths.versions,
    ]
    for (const dir of dirs) {
      await mkdir(dir, { recursive: true })
    }
  }

  // ── Path resolution ───────────────────────────────────────────────────────

  getDocumentPath(docId: string): string {
    return join(this.paths.documents, getDocumentFilename(docId))
  }

  getReviewPath(docId: string): string {
    return join(this.paths.reviews, `${docId}-quality-gate.md`)
  }

  getVersionPath(docId: string, version: number, timestamp: string): string {
    return join(this.paths.versions, `${docId}-v${version}-${timestamp}.md`)
  }

  // ── Documents ───────────────────────────────────────────────────────────--

  async writeDocument(docId: string, content: string): Promise<void> {
    await mkdir(this.paths.documents, { recursive: true })
    await writeFile(this.getDocumentPath(docId), content, 'utf8')
  }

  async readDocument(docId: string): Promise<string> {
    return readFile(this.getDocumentPath(docId), 'utf8')
  }

  async documentExists(docId: string): Promise<boolean> {
    return existsSync(this.getDocumentPath(docId))
  }

  // ── Reviews / Quality Gate ──────────────────────────────────────────────--

  async writeReview(docId: string, content: string): Promise<void> {
    await mkdir(this.paths.reviews, { recursive: true })
    await writeFile(this.getReviewPath(docId), content, 'utf8')
  }

  async readReview(docId: string): Promise<string> {
    return readFile(this.getReviewPath(docId), 'utf8')
  }

  // ── Versions ──────────────────────────────────────────────────────────────

  /**
   * Archives the current document file to
   * `versions/<docId>-v<version>-<timestamp>.md` by renaming it (SDD §6.4).
   */
  async archiveVersion(docId: string, version: number): Promise<void> {
    await mkdir(this.paths.versions, { recursive: true })
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    await rename(this.getDocumentPath(docId), this.getVersionPath(docId, version, timestamp))
  }

  // ── Planning ──────────────────────────────────────────────────────────────

  async writePlanning(filename: string, content: string): Promise<void> {
    await mkdir(this.paths.planning, { recursive: true })
    await writeFile(join(this.paths.planning, filename), content, 'utf8')
  }

  async readPlanning(filename: string): Promise<string> {
    return readFile(join(this.paths.planning, filename), 'utf8')
  }

  // ── Input ─────────────────────────────────────────────────────────────────

  async writeInput(filename: string, content: string): Promise<void> {
    await mkdir(this.paths.input, { recursive: true })
    await writeFile(join(this.paths.input, filename), content, 'utf8')
  }

  async readInput(filename: string): Promise<string> {
    return readFile(join(this.paths.input, filename), 'utf8')
  }
}
