import { existsSync } from 'node:fs'
import { rm } from 'node:fs/promises'
import { join } from 'node:path'
import { Command, Flags } from '@oclif/core'
import { confirm, input, select } from '@inquirer/prompts'
import { InputParser } from '../core/InputParser.js'
import { StateManager } from '../core/StateManager.js'
import { FileManager } from '../storage/FileManager.js'
import { StateStore } from '../storage/StateStore.js'
import type { ProjectState } from '../storage/schemas.js'
import { Logger } from '../utils/logger.js'
import { slugify } from '../utils/slugify.js'

type Language = ProjectState['project']['language']
type QualityMode = ProjectState['project']['qualityMode']
type InputMethod = ProjectState['project']['inputMethod']
type Platform = ProjectState['project']['platform']

/**
 * `docbuilder init` — scaffolds a new project (SDD §6.5).
 *
 * Sprint 1 scope: gather project metadata + brief, create the directory layout,
 * and initialize `state.json` with all 9 documents `pending`. AI-driven steps
 * (brief evaluation, Interactive Mode, context.md, initiate-planning.md) are
 * scaffolded here and implemented in Sprint 2.
 *
 * Commands hold no business logic (SDD §6.1) — orchestration only.
 */
export default class Init extends Command {
  static description = 'Initialize a new pre-development document project'

  static flags = {
    name: Flags.string({ description: 'Project name' }),
    language: Flags.string({ description: 'Document language', options: ['id', 'en'] }),
    mode: Flags.string({
      description: 'Quality mode',
      options: ['fast-draft', 'balanced', 'deep-analysis'],
    }),
    input: Flags.string({ description: 'Brief input method', options: ['text', 'file'] }),
    file: Flags.string({ description: 'Path to brief file (when --input=file)' }),
    brief: Flags.string({ description: 'Brief text (when --input=text, non-interactive)' }),
    platform: Flags.string({
      description: 'Platform type',
      options: ['web', 'mobile', 'desktop', 'cli', 'api'],
    }),
    dir: Flags.string({
      description: 'Parent directory for the project (defaults to current directory)',
      hidden: true,
    }),
    force: Flags.boolean({ default: false, description: 'Overwrite an existing project directory' }),
    yes: Flags.boolean({ default: false, description: 'Skip confirmation prompts' }),
  }

  async run(): Promise<void> {
    const { flags } = await this.parse(Init)
    const logger = new Logger()

    const name = flags.name ?? (flags.yes ? 'My Project' : await input({ message: 'Project name:' }))
    const language =
      (flags.language as Language | undefined) ??
      (flags.yes ? 'en' : await select<Language>({
        message: 'Document language:',
        choices: [
          { name: 'Bahasa Indonesia', value: 'id' },
          { name: 'English', value: 'en' },
        ],
      }))
    const qualityMode =
      (flags.mode as QualityMode | undefined) ??
      (flags.yes ? 'balanced' : await select<QualityMode>({
        message: 'Quality mode:',
        choices: [
          { name: 'fast-draft', value: 'fast-draft' },
          { name: 'balanced', value: 'balanced' },
          { name: 'deep-analysis', value: 'deep-analysis' },
        ],
      }))
    const inputMethod =
      (flags.input as InputMethod | undefined) ??
      (flags.yes ? 'text' : await select<InputMethod>({
        message: 'How will you provide the brief?',
        choices: [
          { name: 'Type / paste text', value: 'text' },
          { name: 'Read from a file', value: 'file' },
        ],
      }))
    const platform =
      (flags.platform as Platform | undefined) ??
      (flags.yes ? 'web' : await select<Platform>({
        message: 'What platform type?',
        choices: [
          { name: 'Web application', value: 'web' },
          { name: 'Mobile app', value: 'mobile' },
          { name: 'Desktop application', value: 'desktop' },
          { name: 'Command line interface (CLI)', value: 'cli' },
          { name: 'API-only', value: 'api' },
        ],
      }))

    const slug = slugify(name)
    if (!slug) {
      logger.error('Project name produced an empty slug. Please use a name with letters or digits.')
      this.exit(1)
      return
    }

    const parentDir = flags.dir ?? process.cwd()
    const projectDir = join(parentDir, slug)

    const fileManager = new FileManager(projectDir)
    const parser = new InputParser(fileManager)

    // Resolve the brief BEFORE any filesystem mutation so an unreadable file
    // (or declined overwrite) never leaves a partial/destroyed project.
    let brief: string
    if (inputMethod === 'file') {
      const filePath = flags.file ?? (flags.yes ? undefined : await input({ message: 'Path to brief file:' }))
      if (!filePath) {
        logger.error('Brief file path is required when using --yes with --input=file. Use --file <path>.')
        this.exit(1)
        return
      }
      brief = await parser.parseFromFile(filePath)
    } else {
      if (!flags.brief && flags.yes) {
        logger.error('Brief text is required when using --yes with --input=text. Use --brief "your brief".')
        this.exit(1)
        return
      }
      brief =
        flags.brief ?? (await parser.parseFromText(() => input({ message: 'Paste your brief:' })))
    }

    if (existsSync(projectDir)) {
      const overwrite =
        flags.force ||
        flags.yes ||
        (await confirm({
          message: `Directory "${slug}" already exists. Overwrite it?`,
          default: false,
        }))
      if (!overwrite) {
        logger.warning('Aborted — existing project left untouched.')
        return
      }
      await rm(projectDir, { recursive: true, force: true })
    }

    await fileManager.createProjectStructure()
    logger.success(`Created project structure: ${slug}/`)

    await parser.saveBrief(brief)
    logger.success(`Brief saved to input/raw-brief.md (${parser.getWordCount(brief)} words).`)

    const stateStore = new StateStore(projectDir)
    const state = StateManager.createInitialState({ name, slug, language, qualityMode, inputMethod, platform })
    await stateStore.write(state)
    logger.success('Initialized state.json — 9 documents marked pending.')

    logger.divider('Project Ready')
    logger.info(`Location: ${projectDir}`)
    logger.info('Next: run "docbuilder status" to view the pipeline, then "docbuilder generate".')
  }
}
