import { describe, expect, it, vi } from 'vitest'
import { Logger } from '../../../src/utils/logger'
import { InterruptHandler } from '../../../src/utils/interruptHandler'

describe('Logger', () => {
  const logger = new Logger()

  it('confidenceBar renders 10 cells with the score', () => {
    expect(logger.confidenceBar(8)).toBe('████████░░ 8/10')
    expect(logger.confidenceBar(0)).toBe('░░░░░░░░░░ 0/10')
    expect(logger.confidenceBar(10)).toBe('██████████ 10/10')
  })

  it('confidenceBar clamps out-of-range scores', () => {
    expect(logger.confidenceBar(12)).toBe('██████████ 12/10')
    expect(logger.confidenceBar(-3)).toBe('░░░░░░░░░░ -3/10')
  })

  it('formatDivider caps at 100 chars and includes the label', () => {
    expect(logger.formatDivider()).toHaveLength(100)
    expect(logger.formatDivider('Pipeline')).toContain('─── Pipeline ')
    expect(logger.formatDivider('Pipeline').length).toBe(100)
  })

  it('formatTable aligns columns with a header divider', () => {
    const out = logger.formatTable({
      head: ['Doc', 'Status'],
      rows: [
        ['brd', 'pending'],
        ['discovery-notes', 'generated'],
      ],
    })
    const lines = out.split('\n')
    expect(lines).toHaveLength(4) // head + divider + 2 rows
    expect(lines[0]).toContain('Doc')
    expect(lines[2]).toContain('brd')
  })

  it('emits through console without throwing', () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => undefined)
    const err = vi.spyOn(console, 'error').mockImplementation(() => undefined)
    logger.success('ok')
    logger.warning('warn')
    logger.info('info')
    logger.progress('working')
    logger.error('bad')
    expect(log).toHaveBeenCalledWith('✓ ok')
    expect(err).toHaveBeenCalledWith('✗ bad')
    log.mockRestore()
    err.mockRestore()
  })
})

describe('InterruptHandler', () => {
  it('registers and unregisters a SIGINT listener', () => {
    const before = process.listenerCount('SIGINT')
    const handler = new InterruptHandler()
    handler.register(() => undefined)
    expect(handler.isRegistered()).toBe(true)
    expect(process.listenerCount('SIGINT')).toBe(before + 1)
    handler.unregister()
    expect(handler.isRegistered()).toBe(false)
    expect(process.listenerCount('SIGINT')).toBe(before)
  })
})
