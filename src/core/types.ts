/**
 * Core type definitions for ContextBuilder and related components.
 */

/**
 * Result of brief evaluation by AI.
 */
export interface BriefEvaluationResult {
  /** Completeness score from 0-10 */
  completenessScore: number
  /** Missing key fields identified in brief */
  missingFields: string[]
  /** Targeted questions to fill gaps */
  questions: InteractiveQuestion[]
}

/**
 * A single interactive question for brief clarification.
 */
export interface InteractiveQuestion {
  /** Field name this question targets */
  field: string
  /** Question text to display to user */
  question: string
  /** Whether this question is required or optional */
  required: boolean
}

/**
 * Session data from interactive mode.
 */
export interface ClarificationSession {
  /** Questions asked during session */
  questions: InteractiveQuestion[]
  /** User answers corresponding to questions */
  answers: Record<string, string>
  /** Whether session was skipped via --skip-interactive flag */
  skipped: boolean
}

/**
 * Options for ContextBuilder operations.
 */
export interface ContextBuilderOptions {
  /** Skip interactive mode and use brief as-is */
  skipInteractive?: boolean
  /** Pre-provided answers (for testing or programmatic use) */
  preAnswers?: Record<string, string>
}
