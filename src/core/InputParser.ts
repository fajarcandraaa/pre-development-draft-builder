import { readFile } from 'node:fs/promises'
import type { FileManager } from '../storage/FileManager.js'
import { BriefFileNotFoundError } from './errors.js'

/**
 * Reads a project brief from terminal text or a file and persists it to
 * `input/raw-brief.md` (SDD §6.3). No AI involvement — that lives in
 * ContextBuilder (Sprint 2).
 */
export class InputParser {
  constructor(private readonly fileManager: FileManager) {}

  /** Resolves brief text from an injected prompt function (trimmed). */
  async parseFromText(promptFn: () => Promise<string>): Promise<string> {
    return (await promptFn()).trim()
  }

  /** Reads brief text from a file, throwing BriefFileNotFoundError if missing. */
  async parseFromFile(filePath: string): Promise<string> {
    try {
      return await readFile(filePath, 'utf8')
    } catch {
      throw new BriefFileNotFoundError(`Brief file not found: ${filePath}`)
    }
  }

  /** Persists the brief to `input/raw-brief.md`. */
  async saveBrief(content: string): Promise<void> {
    await this.fileManager.writeInput('raw-brief.md', content)
  }

  getWordCount(content: string): number {
    const trimmed = content.trim()
    return trimmed ? trimmed.split(/\s+/).length : 0
  }

  getCharCount(content: string): number {
    return content.length
  }
}
