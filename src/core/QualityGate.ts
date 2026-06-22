/**
 * QualityGate (SDD §6.4).
 * Runs quality checks on generated documents, saves reports, and provides confidence scoring.
 */

import type { GenerateRequest, QualityMode } from '../ai/types.js'
import { AIGateway } from '../ai/AIGateway.js'
import type { DocumentDefinition } from '../config/registry.js'
import type { FileManager } from '../storage/FileManager.js'
import type { Logger } from '../utils/logger.js'

/**
 * Quality check context.
 */
export interface QGContext {
  previousDocs: Record<string, string>
  state: Record<string, unknown>
}

/**
 * Quality check result.
 */
export interface QGResult {
  completeness: number
  consistency: number
  risks: string[]
  confidence: number
  requiredDecisions: string[]
  reviewerNotes: string
}

/**
 * QualityGate service for running quality checks on generated documents.
 */
export class QualityGate {
  constructor(
    private ai: AIGateway,
    private fileManager: FileManager,
    private logger: Logger,
  ) {}

  /**
   * Run quality check on a document.
   * @param doc - Document definition
   * @param docContent - Generated document content
   * @param context - Quality check context
   * @param mode - Quality mode
   * @returns Quality check result
   */
  async run(
    doc: DocumentDefinition,
    docContent: string,
    context: QGContext,
    mode: QualityMode = 'balanced',
  ): Promise<QGResult> {
    const prompt = this.buildQualityCheckPrompt(doc, docContent, context)

    const request: GenerateRequest = {
      systemPrompt: `You are a quality assurance expert. Evaluate the generated document for completeness, consistency, risks, and required decisions.`,
      userPrompt: prompt,
      model: 'gpt-4o',
      maxTokens: 4000,
      temperature: 0.3,
    }

    const response = await this.ai.generate(request, mode)
    return this.parseQualityCheckResult(response.content)
  }

  /**
   * Save quality gate report to file.
   * @param doc - Document definition
   * @param result - Quality check result
   */
  async saveReport(doc: DocumentDefinition, result: QGResult): Promise<void> {
    const report = this.formatReport(doc, result)
    await this.fileManager.writeReview(doc.id, report)
  }

  /**
   * Build quality check prompt for AI.
   * @param doc - Document definition
   * @param docContent - Document content
   * @param context - Quality check context
   * @returns Quality check prompt
   */
  private buildQualityCheckPrompt(
    doc: DocumentDefinition,
    docContent: string,
    context: QGContext,
  ): string {
    let prompt = `Evaluate the following ${doc.displayName} document for quality.\n\n`
    prompt += `## Document Content\n\n${docContent}\n\n`

    if (Object.keys(context.previousDocs).length > 0) {
      prompt += `## Previous Documents Context\n\n`
      for (const [docId, content] of Object.entries(context.previousDocs)) {
        prompt += `### ${docId}\n\n${content.substring(0, 500)}...\n\n`
      }
    }

    prompt += `## Evaluation Criteria\n\n`
    prompt += `Please evaluate the document on the following criteria and respond in JSON format:\n\n`
    prompt += `{\n`
    prompt += `  "completeness": <number 1-10>,\n`
    prompt += `  "consistency": <number 1-10>,\n`
    prompt += `  "risks": ["risk1", "risk2", ...],\n`
    prompt += `  "requiredDecisions": ["decision1", "decision2", ...],\n`
    prompt += `  "reviewerNotes": "detailed notes"\n`
    prompt += `}\n\n`

    prompt += `## Scoring Guidelines\n\n`
    prompt += `- Completeness: 1-10, where 10 is fully complete with all required sections\n`
    prompt += `- Consistency: 1-10, where 10 is fully consistent with previous documents and requirements\n`
    prompt += `- Risks: List any risks, assumptions, or gaps identified\n`
    prompt += `- Required Decisions: List any decisions that require human input or approval\n`
    prompt += `- Reviewer Notes: Detailed feedback on the document quality\n\n`

    return prompt
  }

  /**
   * Parse AI response into quality check result.
   * @param content - AI response content
   * @returns Quality check result
   */
  private parseQualityCheckResult(content: string): QGResult {
    try {
      // Try to parse entire response as JSON first
      try {
        const parsed = JSON.parse(content.trim())
        if (parsed.completeness !== undefined && parsed.consistency !== undefined) {
          return this.buildResult(parsed)
        }
      } catch {
        // Not pure JSON, continue to extraction
      }

      // Try to extract JSON from markdown code blocks
      const codeBlockMatch = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/)
      if (codeBlockMatch) {
        const blockContent = codeBlockMatch[1].trim()
        // Try to parse the entire block content as JSON
        try {
          const parsed = JSON.parse(blockContent)
          return this.buildResult(parsed)
        } catch {
          // If block content isn't pure JSON, try to extract JSON object from it
          const jsonMatch = blockContent.match(/\{[\s\S]*\}/)
          if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0])
            return this.buildResult(parsed)
          }
        }
      }

      // Try to extract JSON using regex for JSON objects
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0])
        return this.buildResult(parsed)
      }
    } catch (error) {
      this.logger.error('Failed to parse quality check result, using fallback')
      this.logger.error(`AI response: ${content.substring(0, 500)}...`)
    }

    // Fallback if parsing fails
    return this.getFallbackResult()
  }

  /**
   * Build quality check result from parsed JSON.
   * @param parsed - Parsed JSON object
   * @returns Quality check result
   */
  private buildResult(parsed: any): QGResult {
    return {
      completeness: this.normalizeScore(parsed.completeness),
      consistency: this.normalizeScore(parsed.consistency),
      risks: Array.isArray(parsed.risks) ? parsed.risks : [],
      requiredDecisions: Array.isArray(parsed.requiredDecisions) ? parsed.requiredDecisions : [],
      reviewerNotes: parsed.reviewerNotes || '',
      confidence: this.calculateConfidence(
        this.normalizeScore(parsed.completeness),
        this.normalizeScore(parsed.consistency),
      ),
    }
  }

  /**
   * Normalize score to 1-10 range.
   * @param score - Score to normalize
   * @returns Normalized score
   */
  private normalizeScore(score: number): number {
    if (typeof score !== 'number' || isNaN(score)) {
      return 5
    }
    return Math.max(1, Math.min(10, Math.round(score)))
  }

  /**
   * Calculate confidence score from completeness and consistency.
   * @param completeness - Completeness score
   * @param consistency - Consistency score
   * @returns Confidence score
   */
  private calculateConfidence(completeness: number, consistency: number): number {
    return Math.round((completeness + consistency) / 2)
  }

  /**
   * Get fallback quality check result.
   * @returns Fallback result
   */
  private getFallbackResult(): QGResult {
    return {
      completeness: 5,
      consistency: 5,
      risks: ['Unable to parse AI response'],
      requiredDecisions: [],
      reviewerNotes: 'Quality check failed to parse AI response. Manual review required.',
      confidence: 5,
    }
  }

  /**
   * Format quality gate report as markdown.
   * @param doc - Document definition
   * @param result - Quality check result
   * @returns Formatted report
   */
  private formatReport(doc: DocumentDefinition, result: QGResult): string {
    let report = `# Quality Gate Report: ${doc.displayName}\n\n`
    report += `**Document ID:** ${doc.id}\n`
    report += `**Generated:** ${new Date().toISOString()}\n\n`

    report += `## Scores\n\n`
    report += `- **Completeness:** ${result.completeness}/10\n`
    report += `- **Consistency:** ${result.consistency}/10\n`
    report += `- **Confidence:** ${result.confidence}/10\n\n`

    report += `## Risks\n\n`
    if (result.risks.length > 0) {
      result.risks.forEach((risk) => {
        report += `- ${risk}\n`
      })
    } else {
      report += `No risks identified.\n`
    }
    report += '\n'

    report += `## Required Decisions\n\n`
    if (result.requiredDecisions.length > 0) {
      result.requiredDecisions.forEach((decision) => {
        report += `- ${decision}\n`
      })
    } else {
      report += `No required decisions.\n`
    }
    report += '\n'

    report += `## Reviewer Notes\n\n`
    report += `${result.reviewerNotes}\n`

    return report
  }
}
