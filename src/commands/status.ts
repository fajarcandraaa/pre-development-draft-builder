import { Command, Flags } from '@oclif/core'
import { DocumentRegistry } from '../core/DocumentRegistry.js'
import { StateStore } from '../storage/StateStore.js'
import { Logger } from '../utils/logger.js'

/**
 * `docbuilder status` — reads the current project's `state.json` and renders the
 * pipeline as a table (SDD §6.5). Read-only. Run from inside a project dir.
 */
export default class Status extends Command {
  static description = 'Show the document pipeline status for the current project'

  static flags = {
    dir: Flags.string({
      description: 'Project directory (defaults to current directory)',
      hidden: true,
    }),
  }

  async run(): Promise<void> {
    const { flags } = await this.parse(Status)
    const logger = new Logger()
    const projectDir = flags.dir ?? process.cwd()
    const store = new StateStore(projectDir)

    if (!(await store.exists())) {
      logger.error('No docbuilder project found here. Run "docbuilder init" first.')
      this.exit(1)
      return
    }

    const state = await store.read()
    const registry = new DocumentRegistry()
    const rows = registry.getAll().map((doc) => {
      const d = state.documents[doc.id]
      return [
        String(doc.order),
        doc.displayName,
        `Stage ${doc.stage}`,
        d.status,
        d.confidence == null ? '—' : `${d.confidence}/10`,
      ]
    })

    logger.divider(`${state.project.name} (${state.project.slug})`)
    logger.table({ head: ['#', 'Document', 'Stage', 'Status', 'Confidence'], rows })
    logger.info(`Quality mode: ${state.project.qualityMode} · Language: ${state.project.language}`)
    logger.info(`Stage 1 approved: ${state.pipeline.stage1Approved ? 'yes' : 'no'}`)
  }
}
