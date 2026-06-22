import { existsSync } from 'node:fs'
import { chmod, mkdir, readFile } from 'node:fs/promises'
import { dirname } from 'node:path'
import writeFileAtomic from 'write-file-atomic'
import { getProviderFilePath } from '../config/paths.js'
import { ProviderConfigSchema, type ProviderConfig } from './schemas.js'

/**
 * Atomic read/write of the global `~/.docbuilder/provider.json` (SDD §6.4, §6.6).
 *
 * - File is created with permission `600` (owner read/write only) on POSIX.
 * - `encrypt`/`decrypt` are passthrough for the MVP (`encryption: "none"`);
 *   AES-256-GCM is a Phase 2 concern (SDD §6.6).
 *
 * The target path is injectable (defaults to `~/.docbuilder/provider.json`) so
 * tests never touch the real global config — honoring the "no global state /
 * DI everywhere" constraint (SDD §9 #1).
 */
export class ProviderStore {
  constructor(private readonly filePath: string = getProviderFilePath()) {}

  private getPath(): string {
    return this.filePath
  }

  async read(): Promise<ProviderConfig> {
    const raw = this.decrypt(await readFile(this.getPath(), 'utf8'))
    return ProviderConfigSchema.parse(JSON.parse(raw))
  }

  async write(config: ProviderConfig): Promise<void> {
    const validated = ProviderConfigSchema.parse(config)
    await mkdir(dirname(this.getPath()), { recursive: true })
    const data = this.encrypt(`${JSON.stringify(validated, null, 2)}\n`)
    await writeFileAtomic(this.getPath(), data, { mode: 0o600 })
    // Ensure 600 even if the file pre-existed with looser permissions.
    await chmod(this.getPath(), 0o600)
  }

  async exists(): Promise<boolean> {
    return existsSync(this.getPath())
  }

  // Phase 2 placeholders — passthrough while encryption === 'none' (SDD §6.6).
  private encrypt(data: string): string {
    return data
  }

  private decrypt(data: string): string {
    return data
  }
}
