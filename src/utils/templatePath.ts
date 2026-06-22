import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

/**
 * Resolves the bundled `templates/` directory relative to the executing file,
 * NOT `process.cwd()`. Works the same from `src/utils` (dev) and `dist/utils`
 * (after global install) since both sit two levels below the package root.
 * See SDD R-03 / TRD R-03.
 */
export function getTemplatesDir(): string {
  const here = dirname(fileURLToPath(import.meta.url))
  return join(here, '..', '..', 'templates')
}
