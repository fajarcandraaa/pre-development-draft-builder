/**
 * QuestionExtractor (SDD §6.4).
 * Extracts questions from generated documents using AI analysis.
 */

import type { GenerateRequest, QualityMode } from '../ai/types.js'
import { AIGateway } from '../ai/AIGateway.js'
import type { Logger } from '../utils/logger.js'

/**
 * Question extraction result.
 */
export interface QuestionExtractionResult {
  questions: string[]
  hasQuestions: boolean
}

/**
 * QuestionExtractor service for extracting questions from documents.
 */
export class QuestionExtractor {
  constructor(
    private ai: AIGateway,
    private logger: Logger,
  ) {}

  /**
   * Extract questions from document content.
   * @param documentContent - The document content to analyze
   * @param mode - Quality mode for AI generation
   * @returns Extracted questions
   */
  async extractQuestions(
    documentContent: string,
    mode: QualityMode = 'balanced',
    previouslyAsked: string[] = [],
    maxQuestions: number = 5,
  ): Promise<QuestionExtractionResult> {
    if (!documentContent || documentContent.trim().length === 0) {
      return { questions: [], hasQuestions: false }
    }

    const prompt = this.buildExtractionPrompt(documentContent, previouslyAsked, maxQuestions)
    const request: GenerateRequest = {
      systemPrompt:
        'You are a document analyst. Your task is to identify only the most critical questions that a project owner MUST answer before the next document can be written accurately. ' +
        'Be highly selective: only extract questions that (1) are explicitly unclear or missing from the document, (2) cannot be reasonably inferred from the existing context, and (3) would meaningfully change the output of the next document if answered. ' +
        'Do NOT extract generic questions, obvious clarifications, or questions that are already implied by the project description. ' +
        'Do NOT repeat questions that have already been asked, even if worded differently. ' +
        'Return ONLY a valid JSON array of question strings with at most ' + maxQuestions + ' items. No other text.',
      userPrompt: prompt,
      model: 'gpt-4o',
      maxTokens: 1000,
      temperature: 0.3,
    }

    try {
      const response = await this.ai.generate(request, mode)
      const questions = this.parseQuestions(response.content)
      const deduped = this.filterAlreadyAsked(questions, previouslyAsked)
      const capped = deduped.slice(0, maxQuestions)

      return {
        questions: capped,
        hasQuestions: capped.length > 0,
      }
    } catch (error) {
      this.logger.warning(
        `Failed to extract questions: ${error instanceof Error ? error.message : String(error)}`,
      )
      return { questions: [], hasQuestions: false }
    }
  }

  /**
   * Build the extraction prompt.
   * @param documentContent - Document content
   * @returns Prompt string
   */
  private buildExtractionPrompt(documentContent: string, previouslyAsked: string[] = [], maxQuestions: number = 5): string {
    const alreadyAskedSection =
      previouslyAsked.length > 0
        ? `\nThe following questions have ALREADY been asked. Do NOT include these or any semantically equivalent rewordings:\n${previouslyAsked.map((q) => `- ${q}`).join('\n')}\n`
        : ''

    return `Analyze the following document and extract at most ${maxQuestions} NEW critical questions that the project owner must answer.

Only extract questions that meet ALL of these criteria:
- The information is explicitly missing or unclear in the document
- The information cannot be reasonably inferred from the existing context
- Knowing the answer would meaningfully improve the accuracy of the next document

Do NOT extract:
- Generic or obvious questions
- Questions about things already described in the document
- Questions that are nice-to-know but not essential
${alreadyAskedSection}
Return ONLY a valid JSON array of at most ${maxQuestions} question strings, ordered by priority (most critical first). Example format:
["What is the target launch date?", "Who is the primary end user?"]

Document content:
${documentContent}`
  }

  /**
   * Filter out questions that exactly or near-exactly match previously asked
   * questions. Normalizes by lowercasing and stripping non-alphanumerics so
   * trivial rewordings (punctuation/casing/whitespace) are caught locally.
   * @param questions - Newly extracted questions
   * @param previouslyAsked - Questions already asked in earlier documents
   * @returns Filtered list of genuinely new questions
   */
  private filterAlreadyAsked(questions: string[], previouslyAsked: string[]): string[] {
    if (previouslyAsked.length === 0) {
      return questions
    }
    const normalize = (s: string): string => s.toLowerCase().replace(/[^a-z0-9]/g, '')
    const askedSet = new Set(previouslyAsked.map(normalize))
    const seen = new Set<string>()
    const result: string[] = []
    for (const q of questions) {
      const key = normalize(q)
      if (askedSet.has(key) || seen.has(key)) {
        continue
      }
      seen.add(key)
      result.push(q)
    }
    return result
  }

  /**
   * Parse questions from AI response.
   * @param response - AI response content
   * @returns Array of questions
   */
  private parseQuestions(response: string): string[] {
    try {
      // Try to parse as JSON directly
      const parsed = JSON.parse(response)
      if (Array.isArray(parsed)) {
        return parsed.filter((item) => typeof item === 'string' && item.trim().length > 0)
      }
      return []
    } catch (error) {
      // Try to extract JSON from markdown code blocks
      const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/)
      if (jsonMatch) {
        try {
          const parsed = JSON.parse(jsonMatch[1])
          if (Array.isArray(parsed)) {
            return parsed.filter((item) => typeof item === 'string' && item.trim().length > 0)
          }
        } catch {
          // Fall through to regex extraction
        }
      }

      // Fallback: extract lines that look like questions
      return this.extractQuestionsByRegex(response)
    }
  }

  /**
   * Extract questions using regex as fallback.
   * @param text - Text to search
   * @returns Array of questions
   */
  private extractQuestionsByRegex(text: string): string[] {
    const questionPattern = /[?？]|(?:what|how|why|when|where|who|which|whose|is|are|do|does|did|can|could|should|would|will|might)\s+\w+/gi
    const lines = text.split('\n')
    const questions: string[] = []

    for (const line of lines) {
      const trimmed = line.trim()
      if (trimmed.length > 10 && trimmed.length < 200 && questionPattern.test(trimmed)) {
        // Remove list markers and special characters
        const cleaned = trimmed.replace(/^[-*•]\s*/, '').replace(/^\d+[.)]\s*/, '').trim()
        if (cleaned.length > 10) {
          questions.push(cleaned)
        }
      }
    }

    return questions.slice(0, 10) // Limit to 10 questions
  }
}
