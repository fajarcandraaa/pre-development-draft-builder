/**
 * DocumentGenerator (SDD §6.4).
 * Loads prompt templates, assembles carry-forward content, and generates documents via AI.
 */

import { readFile } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import type { GenerateRequest, QualityMode } from '../ai/types.js'
import { AIGateway } from '../ai/AIGateway.js'
import type { DocumentDefinition, DocumentId } from '../config/registry.js'
import { DOCUMENT_REGISTRY } from '../config/registry.js'
import type { FileManager } from '../storage/FileManager.js'
import type { Logger } from '../utils/logger.js'
import { render } from '../utils/templateRenderer.js'
import { estimateTokens } from '../utils/tokenCounter.js'

/** Package root resolved from this module's location (dist/core or src/core). */
const MODULE_DIR = dirname(fileURLToPath(import.meta.url))
const PACKAGE_ROOT = resolve(MODULE_DIR, '..', '..')

/**
 * Generation context for document generation.
 */
export interface GenerationContext {
  state: Record<string, unknown>
  previousDocs: Record<DocumentId, string>
  revisionNote?: string
  dryRun?: boolean
  answers?: Record<string, string>
}

/**
 * DocumentGenerator service for generating documents with carry-forward content.
 */
export class DocumentGenerator {
  constructor(
    private ai: AIGateway,
    private fileManager: FileManager,
    private logger: Logger,
  ) {}

  /**
   * Generate a document using AI with carry-forward content.
   * @param doc - Document definition
   * @param context - Generation context
   * @param mode - Quality mode
   * @returns Generated document content
   */
  async generate(
    doc: DocumentDefinition,
    context: GenerationContext,
    mode: QualityMode = 'balanced',
  ): Promise<string> {
    const template = await this.loadTemplate(doc.promptTemplateFile)
    const carryForward = await this.assembleCarryForward(doc.dependsOn, doc.stage, mode)

    const project = (context.state.project ?? {}) as {
      name?: string
      language?: string
      qualityMode?: string
      platform?: string
    }
    const language = project.language === 'en' ? 'English' : 'Bahasa Indonesia'

    const renderedTemplate = this.renderTemplate(template, {
      project_name: project.name || 'this project',
      language,
      quality_mode: mode,
      platform: project.platform || 'web',
      context: (context.state.context as string) || '',
      previous_documents: carryForward || '(No previous documents — this is the first document.)',
      revision_note: context.revisionNote || '',
      answers: context.answers ? JSON.stringify(context.answers, null, 2) : '',
    })

    const request: GenerateRequest = {
      systemPrompt:
        `You are an experienced ${doc.rolePersona}. Produce a ${doc.displayName} in ${language} ` +
        `that is specific to the project described in the context. ` +
        `Base every section on the provided project context and previous documents — ` +
        `do NOT use generic boilerplate or invent unrelated requirements. ` +
        `Follow the section structure and instructions in the user prompt exactly, ` +
        `and write detailed, project-specific content for each section.`,
      userPrompt: renderedTemplate,
      model: 'gpt-4o',
      maxTokens: 4000,
      temperature: 0.7,
    }

    const response = await this.ai.generate(request, mode)
    return response.content
  }

  /**
   * Load prompt template from templates/ directory.
   * @param templatePath - Path to template file
   * @returns Template content
   */
  async loadTemplate(templatePath: string): Promise<string> {
    try {
      const absolutePath = resolve(PACKAGE_ROOT, templatePath)
      return await readFile(absolutePath, 'utf8')
    } catch (error) {
      this.logger.warning(`Template not found (${templatePath}), using fallback template.`)
      return this.getFallbackTemplate()
    }
  }

  /**
   * Assemble carry-forward content from previous documents.
   * @param previousDocIds - Array of previous document IDs
   * @param stage - Current stage (1 or 2)
   * @param mode - Quality mode for token budget
   * @returns Assembled carry-forward content
   */
  async assembleCarryForward(
    previousDocIds: DocumentId[],
    stage: 1 | 2,
    mode: QualityMode,
  ): Promise<string> {
    if (previousDocIds.length === 0) {
      return ''
    }

    if (stage === 1) {
      return this.assembleStage1CarryForward(previousDocIds, mode)
    } else {
      return this.assembleStage2CarryForward(previousDocIds)
    }
  }

  /**
   * Assemble carry-forward for Stage 1 (full text with 50% token limit).
   * @param previousDocIds - Previous document IDs
   * @param mode - Quality mode
   * @returns Carry-forward content
   */
  private async assembleStage1CarryForward(
    previousDocIds: DocumentId[],
    mode: QualityMode,
  ): Promise<string> {
    const maxTokens = this.getMaxTokens(mode) * 0.5
    let content = ''
    let usedTokens = 0

    for (const docId of previousDocIds) {
      const doc = DOCUMENT_REGISTRY.find((d) => d.id === docId)
      if (!doc) continue

      try {
        const docContent = await this.fileManager.readDocument(doc.id)
        const docTokens = estimateTokens(docContent)

        if (usedTokens + docTokens > maxTokens) {
          content += `\n\n[Content from ${doc.displayName} truncated due to token limit]`
          break
        }

        content += `\n\n## ${doc.displayName}\n\n${docContent}`
        usedTokens += docTokens
      } catch (error) {
        // Skip if document not found
        continue
      }
    }

    return content
  }

  /**
   * Assemble carry-forward for Stage 2 (summary + Stage 2 docs).
   * @param previousDocIds - Previous document IDs
   * @returns Carry-forward content
   */
  private async assembleStage2CarryForward(previousDocIds: DocumentId[]): Promise<string> {
    let content = ''

    // Add stage-1-summary.md if available
    try {
      const summary = await this.fileManager.readPlanning('stage-1-summary.md')
      content += `\n\n## Stage 1 Summary\n\n${summary}`
    } catch (error) {
      // Skip if summary not found
    }

    // Add previous Stage 2 documents
    for (const docId of previousDocIds) {
      const doc = DOCUMENT_REGISTRY.find((d) => d.id === docId)
      if (!doc || doc.stage !== 2) continue

      try {
        const docContent = await this.fileManager.readDocument(doc.id)
        content += `\n\n## ${doc.displayName}\n\n${docContent}`
      } catch (error) {
        // Skip if document not found
        continue
      }
    }

    return content
  }

  /**
   * Render template with placeholder values.
   * @param template - Template string
   * @param variables - Placeholder values
   * @returns Rendered template
   */
  private renderTemplate(template: string, variables: Record<string, string>): string {
    return render(template, variables)
  }

  /**
   * Get max tokens for quality mode.
   * @param mode - Quality mode
   * @returns Max token count
   */
  private getMaxTokens(mode: QualityMode): number {
    const tokenBudgets: Record<QualityMode, number> = {
      'fast-draft': 6000,
      balanced: 12000,
      'deep-analysis': 24000,
    }
    return tokenBudgets[mode]
  }

  /**
   * Get fallback template when template file not found.
   * @returns Fallback template string
   */
  private getFallbackTemplate(): string {
    return `Generate a document based on the following context:

## Context
{{context}}

## Previous Documents
{{carryForward}}

{{revisionNote}}

Generate the document content in markdown format.`
  }
}
