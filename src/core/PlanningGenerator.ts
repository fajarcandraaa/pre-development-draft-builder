/**
 * PlanningGenerator (SDD §6.4).
 * Generates initiate-planning.md with document sequence and duration estimates.
 */

import type { GenerateRequest, QualityMode } from '../ai/types.js'
import { AIGateway } from '../ai/AIGateway.js'
import type { DocumentDefinition, DocumentId } from '../config/registry.js'
import { DOCUMENT_REGISTRY } from '../config/registry.js'
import type { FileManager } from '../storage/FileManager.js'
import type { Logger } from '../utils/logger.js'

/**
 * Duration estimation result.
 */
export interface EstimationResult {
  perDocument: Record<DocumentId, number>
  total: number
}

/**
 * Planning generation result.
 */
export interface PlanningResult {
  content: string
  estimates: EstimationResult
}

/**
 * Duration estimates per quality mode (minutes per document).
 * Based on TRD §5.5.3.
 */
const DURATION_ESTIMATES: Record<QualityMode, Record<DocumentId, number>> = {
  'fast-draft': {
    'discovery-notes': 2,
    brd: 3,
    sow: 3,
    prd: 3,
    'uiux-flow': 2,
    srs: 4,
    trd: 4,
    sdd: 4,
    'task-breakdown': 3,
  },
  balanced: {
    'discovery-notes': 5,
    brd: 7,
    sow: 7,
    prd: 7,
    'uiux-flow': 5,
    srs: 10,
    trd: 10,
    sdd: 10,
    'task-breakdown': 7,
  },
  'deep-analysis': {
    'discovery-notes': 10,
    brd: 15,
    sow: 15,
    prd: 15,
    'uiux-flow': 10,
    srs: 20,
    trd: 20,
    sdd: 20,
    'task-breakdown': 15,
  },
} as const

/**
 * PlanningGenerator service for planning document generation.
 */
export class PlanningGenerator {
  constructor(
    private ai: AIGateway,
    private fileManager: FileManager,
    private logger: Logger,
  ) {}

  /**
   * Generate initiate-planning.md with document sequence and duration estimates.
   * @param contextContent - Context.md content from ContextBuilder
   * @param mode - Quality mode for duration estimates
   * @returns Planning result with content and estimates
   */
  async generate(contextContent: string, mode: QualityMode = 'balanced'): Promise<PlanningResult> {
    const estimates = this.estimateDuration(mode)
    const content = await this.buildPlanningContent(contextContent, estimates, mode)

    return {
      content,
      estimates,
    }
  }

  /**
   * Save initiate-planning.md to project directory.
   * @param projectPath - Project directory path
   * @param content - Planning document content
   */
  async savePlanning(projectPath: string, content: string): Promise<void> {
    await this.fileManager.writePlanning('initiate-planning.md', content)
  }

  /**
   * Estimate duration per document for given quality mode.
   * @param mode - Quality mode
   * @returns Duration estimation result
   */
  estimateDuration(mode: QualityMode): EstimationResult {
    const estimates = DURATION_ESTIMATES[mode]
    const total = Object.values(estimates).reduce((sum, duration) => sum + duration, 0)

    return {
      perDocument: estimates,
      total,
    }
  }

  /**
   * Build planning document content using AI.
   * @param contextContent - Context.md content
   * @param estimates - Duration estimates
   * @param mode - Quality mode
   * @returns Planning document content
   */
  private async buildPlanningContent(
    contextContent: string,
    estimates: EstimationResult,
    mode: QualityMode,
  ): Promise<string> {
    const documentSequence = this.getDocumentSequence()
    const estimatesText = this.formatEstimates(estimates, mode)

    const prompt = this.buildPlanningPrompt(contextContent, documentSequence, estimatesText)

    const request: GenerateRequest = {
      systemPrompt: 'You are a senior project manager creating a planning document for pre-development documentation.',
      userPrompt: prompt,
      model: 'gpt-4o',
      maxTokens: 1500,
      temperature: 0.5,
    }

    const response = await this.ai.generate(request, mode)
    return response.content
  }

  /**
   * Get document sequence from registry.
   * @returns Ordered list of documents
   */
  private getDocumentSequence(): DocumentDefinition[] {
    return [...DOCUMENT_REGISTRY].sort((a, b) => a.order - b.order)
  }

  /**
   * Format duration estimates as markdown.
   * @param estimates - Duration estimates
   * @param mode - Quality mode
   * @returns Formatted estimates string
   */
  private formatEstimates(estimates: EstimationResult, mode: QualityMode): string {
    let text = `### ${mode.charAt(0).toUpperCase() + mode.slice(1)} Mode\n\n`

    for (const [docId, duration] of Object.entries(estimates.perDocument)) {
      const doc = DOCUMENT_REGISTRY.find((d) => d.id === docId)
      const displayName = doc?.displayName || docId
      text += `- ${displayName}: ~${duration} min\n`
    }

    text += `\n**Total Estimated Time:** ~${estimates.total} minutes\n`
    return text
  }

  /**
   * Build prompt for planning document generation.
   * @param contextContent - Context.md content
   * @param documentSequence - Document sequence
   * @param estimatesText - Formatted estimates
   * @returns Prompt string
   */
  private buildPlanningPrompt(
    contextContent: string,
    documentSequence: DocumentDefinition[],
    estimatesText: string,
  ): string {
    const prompt = `Generate a planning document based on the following project context and document sequence.

# Project Context
${contextContent}

# Document Sequence
${documentSequence.map((doc, index) => `${index + 1}. ${doc.displayName}`).join('\n')}

# Duration Estimates
${estimatesText}

Generate a markdown document with the following structure:
# Initiate Planning

## Document Sequence
[list the documents in order]

## Duration Estimates
[include the estimates provided above]

## Project Overview
[brief summary based on context]

## Next Steps
[instructions to run docbuilder generate]

Return only the markdown content, no JSON or explanations.`

    return prompt
  }
}
