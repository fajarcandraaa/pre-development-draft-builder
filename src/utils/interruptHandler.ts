/**
 * Graceful SIGINT (Ctrl+C) handling — scaffold for S1-T03.
 *
 * The full recovery behavior (reset a `generating` document back to `pending`
 * and delete any `.partial` artifacts) is implemented in Sprint 2, when the
 * generate pipeline exists. This scaffold provides the register/unregister
 * lifecycle and a cleanup hook so the pipeline can plug its logic in later.
 */
export type InterruptCleanup = () => void | Promise<void>

export class InterruptHandler {
  private cleanup: InterruptCleanup | null = null
  private registered = false
  private readonly handler = (): void => {
    void this.run()
  }

  /** Registers a SIGINT listener that runs `cleanup` before exiting. */
  register(cleanup: InterruptCleanup): void {
    this.cleanup = cleanup
    if (!this.registered) {
      process.on('SIGINT', this.handler)
      this.registered = true
    }
  }

  /** Removes the SIGINT listener and clears the cleanup hook. */
  unregister(): void {
    if (this.registered) {
      process.off('SIGINT', this.handler)
      this.registered = false
    }
    this.cleanup = null
  }

  isRegistered(): boolean {
    return this.registered
  }

  private async run(): Promise<void> {
    if (this.cleanup) {
      await this.cleanup()
    }
    // 130 = process terminated by Ctrl+C (128 + SIGINT).
    process.exit(130)
  }
}
