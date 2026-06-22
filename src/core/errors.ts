/** Custom error classes for precise error handling (SDD §7). */

/** Invalid document status transition (e.g. pending → generated). */
export class StateTransitionError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'StateTransitionError'
  }
}

/** A document was requested before it was generated. */
export class DocumentNotFoundError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'DocumentNotFoundError'
  }
}

/** No API key available for the resolved provider. */
export class ProviderNotConfiguredError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ProviderNotConfiguredError'
  }
}

/** Attempted to generate a Stage 2 document before Stage 1 approval. */
export class Stage1NotApprovedError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'Stage1NotApprovedError'
  }
}

/** Brief file path could not be found. */
export class BriefFileNotFoundError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'BriefFileNotFoundError'
  }
}

/** Error returned from an AI provider. */
export class APIError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
    public readonly provider: string,
    public readonly retryable: boolean,
  ) {
    super(message)
    this.name = 'APIError'
  }
}
