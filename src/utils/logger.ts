/* eslint-disable no-console */

/**
 * The ONLY place terminal output is allowed (SDD §6.8, §9 #2). All commands and
 * core modules must route output through a Logger instance — no direct
 * `console.log` elsewhere in the codebase.
 *
 * Document-specific summary renderers (`displayQGSummary`, `displayStage1Summary`,
 * `displayFinalReviewSummary`) depend on Quality Gate types and land in Sprint 2.
 */
export interface TableData {
  head: string[]
  rows: string[][]
}

const MAX_TABLE_WIDTH = 100

export class Logger {
  success(message: string): void {
    console.log(`✓ ${message}`)
  }

  warning(message: string): void {
    console.log(`⚠ ${message}`)
  }

  error(message: string): void {
    console.error(`✗ ${message}`)
  }

  info(message: string): void {
    console.log(`ℹ ${message}`)
  }

  progress(message: string): void {
    console.log(`⏳ ${message}`)
  }

  /** Prints a horizontal divider, optionally labelled. Capped at 100 chars. */
  divider(label?: string): void {
    console.log(this.formatDivider(label))
  }

  formatDivider(label?: string): string {
    if (!label) {
      return '─'.repeat(MAX_TABLE_WIDTH)
    }
    const prefix = `─── ${label} `
    const remaining = Math.max(0, MAX_TABLE_WIDTH - prefix.length)
    return prefix + '─'.repeat(remaining)
  }

  /** Returns a 10-cell confidence bar, e.g. '████████░░ 8/10'. */
  confidenceBar(score: number): string {
    const clamped = Math.max(0, Math.min(10, Math.round(score)))
    return `${'█'.repeat(clamped)}${'░'.repeat(10 - clamped)} ${score}/10`
  }

  table(data: TableData): void {
    console.log(this.formatTable(data))
  }

  formatTable(data: TableData): string {
    const columns = data.head.length
    const widths = new Array<number>(columns).fill(0)
    for (let c = 0; c < columns; c += 1) {
      widths[c] = data.head[c].length
      for (const row of data.rows) {
        widths[c] = Math.max(widths[c], (row[c] ?? '').length)
      }
    }
    const renderRow = (cells: string[]): string =>
      cells.map((cell, c) => (cell ?? '').padEnd(widths[c])).join('  ')

    const lines = [renderRow(data.head), widths.map((w) => '─'.repeat(w)).join('  ')]
    for (const row of data.rows) {
      lines.push(renderRow(row))
    }
    return lines.join('\n')
  }
}
