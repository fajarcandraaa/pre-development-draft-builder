/**
 * Template renderer utility (SDD §6.4).
 * Replaces {{placeholder}} with provided values.
 */

/**
 * Render a template by replacing placeholders with values.
 * @param template - Template string with {{placeholder}} syntax
 * @param variables - Object with placeholder names as keys
 * @returns Rendered string with placeholders replaced
 */
export function render(template: string, variables: Record<string, string>): string {
  let result = template

  for (const [key, value] of Object.entries(variables)) {
    const placeholder = `{{${key}}}`
    result = result.replace(new RegExp(placeholder, 'g'), value)
  }

  return result
}

/**
 * Render a template with nested variables.
 * Supports {{parent.child}} syntax.
 * @param template - Template string
 * @param variables - Object with nested values
 * @returns Rendered string
 */
export function renderNested(template: string, variables: Record<string, unknown>): string {
  let result = template

  // Replace nested placeholders like {{parent.child}}
  const nestedPattern = /\{\{([^}]+)\}\}/g
  result = result.replace(nestedPattern, (match, path) => {
    const keys = path.split('.')
    let value: unknown = variables

    for (const key of keys) {
      if (value && typeof value === 'object' && key in value) {
        value = (value as Record<string, unknown>)[key]
      } else {
        return match // Keep original if path not found
      }
    }

    return String(value ?? match)
  })

  return result
}
