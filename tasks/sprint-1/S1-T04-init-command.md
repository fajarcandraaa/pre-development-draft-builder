# S1-T04 — Command `docbuilder init`

- **Sprint:** 1 | **Owner:** Agent 1 | **Status:** Approved (QA-S1-T04 PASS after D-1 fix · Agent 0 approved)
- **Depends on:** S1-T03 (Approved)
- **Source of truth:** SDD §6.5 (init flow), Task Breakdown §3, SRS

## Goal
Implement `docbuilder init` scaffold: gather brief, create project structure, initialize `state.json`. AI calls (brief evaluation, interactive mode, context/planning) are STUBBED in Sprint 1.

## Scope
- `src/commands/init.ts` (oclif command, orchestration only — no business logic in command).
- Interactive prompts for project name/language/quality mode/input method (text or file).
- `slugify(projectName)` → project dir; confirm overwrite if exists.
- `FileManager.createProjectStructure()`.
- Save brief to `input/raw-brief.md` (InputParser save behavior; full InputParser AI evaluation is Sprint 2 — here just capture + save).
- Initialize and write `state.json` with all 9 docs `pending`.
- Steps 7–11 of SDD §6.5 (AI evaluate/interactive/context/planning) are scaffolded/stubbed with clear TODO markers for Sprint 2; init must complete without AI.

## Out of Scope
- Real AI brief evaluation, interactive mode, context.md, initiate-planning.md (Sprint 2).

## Acceptance Criteria (from Task Breakdown §3 DoD)
- [ ] `docbuilder init` creates folder structure, initializes `state.json`, saves brief to `input/raw-brief.md`.
- [ ] All 9 documents initialized as `pending`.
- [ ] Overwrite confirmation when target dir exists.
- [ ] All output via `Logger`.
- [ ] `pnpm lint`/`pnpm test`/`pnpm build` pass.

## Definition of Done
Criteria met + QA-S1-T04 PASS/PASS WITH RISK + Agent 0 approval.

## Submission Report (Agent 1)

**Created files**
- `src/core/InputParser.ts` — `parseFromText`, `parseFromFile` (throws `BriefFileNotFoundError`), `saveBrief` → `input/raw-brief.md`, `getWordCount`/`getCharCount` (SDD §6.3).
- `src/commands/init.ts` — oclif command (orchestration only): metadata prompts/flags, slug + overwrite confirmation, `createProjectStructure`, brief capture/save, `state.json` init with 9 pending docs. AI steps 7–11 stubbed with TODO (Sprint 2).
- Tests: `tests/unit/core/InputParser.test.ts`, `tests/integration/init.test.ts`.

**Dependencies**
- `@inquirer/prompts@7.2.1` (exact pin) for interactive prompts. Justified: SDD §6.5 init flow is interactive; no prompt lib existed. Flags allow full non-interactive use.

**Design notes**
- Every value is overridable by a flag (`--name/--language/--mode/--input/--file/--brief`), so init runs fully non-interactively for CI/tests; prompts only fire for missing values.
- Hidden `--dir` flag sets the parent directory (defaults to `process.cwd()`) — keeps integration tests isolated; matches SDD "create `<slug>/` under working dir".
- `--force`/`--yes` skip the overwrite confirmation; otherwise `confirm` guards destructive overwrite.

**Commands run**
- `pnpm add -E @inquirer/prompts@7.2.1`; `pnpm build`; `pnpm lint`; `pnpm test`; global install + real `docbuilder init` smoke in `/tmp`.

**Results**
- `pnpm build` ✓ · `pnpm lint` ✓ · `pnpm test` ✓ — **56/56 tests** across 12 files.
- Real run (`npm install -g .` then `docbuilder init ... --dir /tmp/dbtest`): created `.docbuilder/state.json` + `input/raw-brief.md`; state has 9 pending docs; slug `demo-project`.

**Risks / blockers**
- oclif prints a benign `@oclif/plugin-plugins` "could not find package.json" debug warning when `Init.run()` is invoked inside Vitest (no packaged plugin tree). Non-fatal; does not affect the real CLI. Will disappear under normal `bin/run.js` execution.
- Brief via interactive text uses single-line `input`; multi-line paste UX can be revisited in Sprint 3 (file input already supported).

**Status:** Ready for QA (`QA-S1-T04`).
