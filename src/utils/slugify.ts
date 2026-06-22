/**
 * Converts arbitrary text into a filesystem-safe slug:
 * lowercased, accent-stripped, non-alphanumerics collapsed to single dashes,
 * with leading/trailing dashes removed.
 */
export function slugify(input: string): string {
  return input
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}
