/**
 * Token counter utility (SDD §6.4).
 * Estimates token count using ~4 chars per token heuristic.
 */

/**
 * Estimate token count for text.
 * Uses ~4 characters per token heuristic (OpenAI approximation).
 * @param text - Text to estimate
 * @returns Estimated token count
 */
export function estimateTokens(text: string): number {
  if (!text) {
    return 0
  }

  // Simple heuristic: ~4 characters per token
  // This is a rough approximation; actual tokenization depends on the model
  return Math.ceil(text.length / 4)
}

/**
 * Estimate total tokens for multiple documents.
 * @param documents - Array of document texts
 * @returns Total estimated token count
 */
export function estimateTotalTokens(documents: string[]): number {
  return documents.reduce((total, doc) => total + estimateTokens(doc), 0)
}

/**
 * Estimate tokens with markdown formatting consideration.
 * Markdown syntax adds some overhead; apply a small multiplier.
 * @param text - Markdown text
 * @returns Estimated token count with markdown overhead
 */
export function estimateMarkdownTokens(text: string): number {
  const baseTokens = estimateTokens(text)
  // Apply 1.1x multiplier for markdown formatting overhead
  return Math.ceil(baseTokens * 1.1)
}
