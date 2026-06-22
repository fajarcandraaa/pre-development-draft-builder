/**
 * ContextBuilder (SDD §6.4).
 * Evaluates brief, runs Interactive Mode, and builds context.md for AI consumption.
 */

import type { GenerateRequest } from '../ai/types.js'
import { AIGateway } from '../ai/AIGateway.js'
import type { FileManager } from '../storage/FileManager.js'
import type { Logger } from '../utils/logger.js'
import type {
  BriefEvaluationResult,
  ClarificationSession,
  ContextBuilderOptions,
} from './types.js'

/**
 * ContextBuilder service for brief evaluation and context generation.
 */
export class ContextBuilder {
  constructor(
    private ai: AIGateway,
    private fileManager: FileManager,
    private logger: Logger,
  ) {}

  /**
   * Evaluate brief completeness using AI.
   * @param briefContent - Raw brief content
   * @returns Evaluation result with score, missing fields, and questions
   */
  async evaluateBrief(briefContent: string): Promise<BriefEvaluationResult> {
    if (!briefContent || briefContent.trim().length === 0) {
      return this.getFallbackEvaluation()
    }

    try {
      const prompt = this.buildBriefEvaluationPrompt(briefContent)
      const request: GenerateRequest = {
        systemPrompt: 'You are a senior business analyst evaluating project briefs.',
        userPrompt: prompt,
        model: 'gpt-4o',
        maxTokens: 1000,
        temperature: 0.3,
      }

      const response = await this.ai.generate(request, 'balanced')

      // Parse JSON response from AI
      const evaluation = this.parseEvaluationResponse(response.content)
      return evaluation
    } catch (error) {
      this.logger.warning(`Brief evaluation failed, using fallback: ${error}`)
      return this.getFallbackEvaluation()
    }
  }

  /**
   * Run interactive mode to collect missing information.
   * @param briefContent - Raw brief content
   * @param options - ContextBuilder options
   * @returns Clarification session with questions and answers
   */
  async runInteractiveMode(
    briefContent: string,
    options: ContextBuilderOptions = {},
  ): Promise<ClarificationSession> {
    if (options.skipInteractive) {
      return {
        questions: [],
        answers: {},
        skipped: true,
      }
    }

    // If pre-answers provided, use them directly
    if (options.preAnswers) {
      const evaluation = await this.evaluateBrief(briefContent)
      return {
        questions: evaluation.questions,
        answers: options.preAnswers,
        skipped: false,
      }
    }

    // Evaluate brief to get questions
    const evaluation = await this.evaluateBrief(briefContent)

    // If brief is complete, no questions needed
    if (evaluation.questions.length === 0) {
      return {
        questions: [],
        answers: {},
        skipped: false,
      }
    }

    // Limit to max 5 questions
    const questions = evaluation.questions.slice(0, 5)
    const answers: Record<string, string> = {}

    // In real implementation, this would use CLI prompts
    // For now, we'll use a placeholder that can be mocked in tests
    for (const question of questions) {
      // Placeholder: in real CLI, use oclif's ux.prompt
      answers[question.field] = await this.promptUser(question.question)
    }

    return {
      questions,
      answers,
      skipped: false,
    }
  }

  /**
   * Build enriched brief combining original brief and interactive answers.
   * @param briefContent - Original brief content
   * @param session - Clarification session with answers
   * @returns Enriched brief content
   */
  async buildEnrichedBrief(
    briefContent: string,
    session: ClarificationSession,
  ): Promise<string> {
    if (session.skipped || Object.keys(session.answers).length === 0) {
      return briefContent
    }

    let enriched = briefContent

    // Append answers to brief
    if (Object.keys(session.answers).length > 0) {
      enriched += '\n\n## Additional Clarifications\n\n'
      for (const [field, answer] of Object.entries(session.answers)) {
        enriched += `**${field}:** ${answer}\n\n`
      }
    }

    return enriched
  }

  /**
   * Build context.md from brief and optional answers.
   * @param briefContent - Brief content (can be enriched)
   * @param answers - Optional answers from interactive mode
   * @returns Structured context.md content
   */
  async buildContext(
    briefContent: string,
    answers: Record<string, string> = {},
  ): Promise<string> {
    const prompt = this.buildContextPrompt(briefContent, answers)
    const request: GenerateRequest = {
      systemPrompt:
        'You are a senior technical writer specializing in project documentation.',
      userPrompt: prompt,
      model: 'gpt-4o',
      maxTokens: 2000,
      temperature: 0.5,
    }

    const response = await this.ai.generate(request, 'balanced')
    return response.content
  }

  /**
   * Build context.md from brief and answers stored in state.
   * @param briefContent - Brief content (can be enriched)
   * @param storedAnswers - Answers stored in state.json
   * @returns Structured context.md content
   */
  async buildContextFromState(
    briefContent: string,
    storedAnswers: Record<string, string>,
  ): Promise<string> {
    return this.buildContext(briefContent, storedAnswers)
  }

  /**
   * Save context.md to project directory.
   * @param projectPath - Project directory path
   * @param contextContent - Context.md content
   */
  async saveContext(projectPath: string, contextContent: string): Promise<void> {
    // Use FileManager's writeInput method which handles directory creation
    await this.fileManager.writeInput('context.md', contextContent)
  }

  /**
   * Build prompt for brief evaluation.
   */
  private buildBriefEvaluationPrompt(briefContent: string): string {
    return `Evaluate the following project brief for completeness. Return a JSON object with:
- completenessScore: number from 0-10
- missingFields: array of missing key field names
- questions: array of objects with field, question, required (boolean)

Key fields to check: project name, client, timeline, budget, stakeholders, goals, constraints, success criteria.

Brief:
${briefContent}

Return only valid JSON, no markdown.`
  }

  /**
   * Build prompt for context generation.
   */
  private buildContextPrompt(
    briefContent: string,
    answers: Record<string, string>,
  ): string {
    let prompt = `Generate a structured context.md file from the following project brief.

Include these sections:
# Project Context
## Brief Summary
## Project Information
## Stakeholders
## Goals & Objectives
## Constraints & Requirements
## Success Criteria
## Additional Context

Brief:
${briefContent}`

    if (Object.keys(answers).length > 0) {
      prompt += `\n\nAdditional clarifications:\n`
      for (const [field, answer] of Object.entries(answers)) {
        prompt += `${field}: ${answer}\n`
      }
    }

    prompt += `\n\nReturn only the markdown content, no JSON or explanations.`

    return prompt
  }

  /**
   * Parse AI response into BriefEvaluationResult.
   */
  private parseEvaluationResponse(content: string): BriefEvaluationResult {
    try {
      // Extract JSON from content (in case AI wraps in markdown)
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        throw new Error('No JSON found in response')
      }

      const parsed = JSON.parse(jsonMatch[0])

      return {
        completenessScore: parsed.completenessScore || 5,
        missingFields: parsed.missingFields || [],
        questions: (parsed.questions || []).map((q: { field?: string; question?: string; required?: boolean }) => ({
          field: q.field || 'unknown',
          question: q.question || '',
          required: q.required !== false,
        })),
      }
    } catch (error) {
      this.logger.warning(`Failed to parse evaluation response: ${error}`)
      return this.getFallbackEvaluation()
    }
  }

  /**
   * Get fallback evaluation when AI fails.
   */
  private getFallbackEvaluation(): BriefEvaluationResult {
    return {
      completenessScore: 3,
      missingFields: ['stakeholders', 'timeline', 'constraints'],
      questions: [
        {
          field: 'project_name',
          question: 'What is the project name?',
          required: true,
        },
        {
          field: 'stakeholders',
          question: 'Who are the key stakeholders?',
          required: true,
        },
        {
          field: 'timeline',
          question: 'What is the project timeline?',
          required: true,
        },
        {
          field: 'goals',
          question: 'What are the main goals?',
          required: true,
        },
        {
          field: 'constraints',
          question: 'Are there any constraints or requirements?',
          required: false,
        },
      ],
    }
  }

  /**
   * Prompt user for input (placeholder for CLI integration).
   * In real implementation, this would use oclif's ux.prompt.
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private async promptUser(_question: string): Promise<string> {
    // Placeholder: in tests, this can be mocked
    // In real CLI, use: const answer = await ux.prompt(question)
    throw new Error(
      'CLI prompt not implemented - use preAnswers option for testing',
    )
  }
}
