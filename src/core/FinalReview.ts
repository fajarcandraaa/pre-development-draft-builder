/**
 * FinalReview (SDD §6.2).
 * Orchestrates final review after all 9 documents are complete.
 */

import type { GenerateRequest, QualityMode } from '../ai/types.js'
import { AIGateway } from '../ai/AIGateway.js'
import type { FileManager } from '../storage/FileManager.js'
import type { Logger } from '../utils/logger.js'
import type { ProjectState } from '../storage/schemas.js'

/**
 * Result of final review.
 */
export interface FinalReviewResult {
  avgConfidence: number
  criticalAssumptions: string[]
  topRisks: string[]
  recommendation: 'READY_FOR_DEVELOPMENT' | 'NEEDS_REVIEW' | 'NEEDS_REVISION'
  summary: string
}

/**
 * FinalReview service for orchestrating final quality review.
 */
export class FinalReview {
  constructor(
    private ai: AIGateway,
    private fileManager: FileManager,
    private logger: Logger,
  ) {}

  /**
   * Run final review after all documents are complete.
   * @param state - Project state
   * @param mode - Quality mode
   * @returns Final review result
   */
  async run(state: ProjectState, mode: QualityMode = 'balanced'): Promise<FinalReviewResult> {
    this.logger.info('Running Final Review...')

    // Collect all document contents and quality gate results
    const documentSummaries = await this.collectDocumentSummaries(state)
    const qualityGateResults = await this.collectQualityGateResults(state)

    // Build prompt for final review
    const prompt = this.buildFinalReviewPrompt(documentSummaries, qualityGateResults)

    const request: GenerateRequest = {
      systemPrompt:
        'You are a senior technical lead conducting a final quality review of a pre-development document set. ' +
        'Evaluate the completeness, consistency, and quality of all documents. ' +
        'Identify critical assumptions that need verification and top risks that must be addressed before development. ' +
        'Provide a clear recommendation: READY_FOR_DEVELOPMENT, NEEDS_REVIEW, or NEEDS_REVISION.',
      userPrompt: prompt,
      model: 'gpt-4o',
      maxTokens: 4000,
      temperature: 0.3,
    }

    const response = await this.ai.generate(request, mode)
    return this.parseFinalReviewResult(response.content)
  }

  /**
   * Save final review report to file.
   * @param result - Final review result
   */
  async saveReport(result: FinalReviewResult): Promise<void> {
    const report = this.formatReport(result)
    await this.fileManager.writeReview('final-quality-review', report)
    this.logger.success('Final Review report saved to reviews/final-quality-review-quality-gate.md')
  }

  /**
   * Collect summaries of all documents.
   * @param state - Project state
   * @returns Document summaries
   */
  private async collectDocumentSummaries(state: ProjectState): Promise<string> {
    let summaries = ''

    for (const [docId, docStatus] of Object.entries(state.documents)) {
      const status = docStatus as { status: string; confidence: number | null }
      if (status.status !== 'generated') continue

      try {
        const content = await this.fileManager.readDocument(docId as any)
        const confidence = status.confidence || 0
        summaries += `\n\n### ${docId.toUpperCase()}\nConfidence: ${confidence}/10\n\n${content.substring(0, 500)}...`
      } catch (error) {
        // Skip if document not found
        continue
      }
    }

    return summaries
  }

  /**
   * Collect quality gate results from all documents.
   * @param state - Project state
   * @returns Quality gate results
   */
  private async collectQualityGateResults(state: ProjectState): Promise<string> {
    let results = ''

    for (const [docId, docStatus] of Object.entries(state.documents)) {
      const status = docStatus as { status: string }
      if (status.status !== 'generated') continue

      try {
        const qgContent = await this.fileManager.readReview(docId as any)
        results += `\n\n### ${docId.toUpperCase()} Quality Gate\n\n${qgContent}`
      } catch (error) {
        // Skip if quality gate not found
        continue
      }
    }

    return results
  }

  /**
   * Build prompt for final review.
   * @param documentSummaries - Document summaries
   * @param qualityGateResults - Quality gate results
   * @returns Final review prompt
   */
  private buildFinalReviewPrompt(documentSummaries: string, qualityGateResults: string): string {
    return `Review the following pre-development document set and provide a final quality assessment.

## Document Summaries
${documentSummaries}

## Quality Gate Results
${qualityGateResults}

## Required Output

Provide your assessment in the following JSON format:
{
  "avgConfidence": number (average confidence score 1-10),
  "criticalAssumptions": string[] (assumptions that need verification before development),
  "topRisks": string[] (highest priority risks to address),
  "recommendation": "READY_FOR_DEVELOPMENT" | "NEEDS_REVIEW" | "NEEDS_REVISION",
  "summary": string (brief explanation of your recommendation)
}

## Evaluation Criteria

- READY_FOR_DEVELOPMENT: All documents are complete, consistent, and high quality. No critical gaps or assumptions.
- NEEDS_REVIEW: Documents are mostly complete but have some gaps or inconsistencies that require founder review.
- NEEDS_REVISION: Significant gaps, inconsistencies, or quality issues that require document regeneration.

## Disclaimer

Final Review this is a system-based assessment, not a full business validation. The founder remains responsible for content accuracy before use with clients.`
  }

  /**
   * Parse final review result from AI response.
   * @param content - AI response content
   * @returns Parsed final review result
   */
  private parseFinalReviewResult(content: string): FinalReviewResult {
    try {
      // Try to parse JSON from response
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0])
        return {
          avgConfidence: parsed.avgConfidence || 5,
          criticalAssumptions: parsed.criticalAssumptions || [],
          topRisks: parsed.topRisks || [],
          recommendation: parsed.recommendation || 'NEEDS_REVIEW',
          summary: parsed.summary || '',
        }
      }
    } catch (error) {
      this.logger.error('Failed to parse Final Review result, using fallback')
    }

    // Fallback result
    return {
      avgConfidence: 5,
      criticalAssumptions: ['Unable to parse AI response'],
      topRisks: ['Manual review required'],
      recommendation: 'NEEDS_REVIEW',
      summary: 'Final Review failed to parse AI response. Manual review required.',
    }
  }

  /**
   * Format final review report as markdown.
   * @param result - Final review result
   * @returns Formatted markdown report
   */
  private formatReport(result: FinalReviewResult): string {
    return `# Final Quality Review

## Summary

Average Confidence: ${result.avgConfidence}/10
Recommendation: **${result.recommendation}**

${result.summary}

## Critical Assumptions

${result.criticalAssumptions.length > 0
      ? result.criticalAssumptions.map((a) => `- ${a}`).join('\n')
      : 'No critical assumptions identified.'}

## Top Risks

${result.topRisks.length > 0 ? result.topRisks.map((r) => `- ${r}`).join('\n') : 'No significant risks identified.'}

## Recommendation

${result.recommendation === 'READY_FOR_DEVELOPMENT'
      ? '✅ The document set is ready for development. Proceed with implementation.'
    : result.recommendation === 'NEEDS_REVIEW'
      ? '⚠️ The document set requires founder review before development. Address the critical assumptions and risks above.'
      : '❌ The document set requires revision. Regenerate affected documents to address the issues identified.'}

---

**Disclaimer:** This Final Review is a system-based assessment, not a full business validation. The founder remains responsible for content accuracy before use with clients.`
  }
}
