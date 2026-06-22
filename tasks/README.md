# Tasks

Task tracking for the Pre-Development Document Builder, managed by Agent 0.

## Conventions
- `S<n>-T<nn>` = Sprint n, implementation task nn (owner: Agent 1).
- `QA-S<n>-T<nn>` = QA scenario for the matching implementation task (owner: Agent 2).
- Only ONE implementation task is `In Progress` at a time.
- A task is Done only when: acceptance criteria met, `pnpm lint`/`pnpm test`/`pnpm build` pass, QA = PASS or PASS WITH RISK, Agent 0 approves.

## Status Legend
`Todo` → `In Progress` → `In Review` (Agent 0) → `In QA` (Agent 2) → `Approved` / `Needs Revision` / `Blocked`.

## Sprint 1 — Fondasi & Setup (Milestone M1) — COMPLETE

| Task | Title | Owner | Depends on | Status |
|------|-------|-------|------------|--------|
| S1-T01 | Project setup (TS + oclif + pnpm + tooling) | Agent 1 | — | Approved (QA PASS) |
| S1-T02 | Config + Storage layer (registry, paths, StateStore, ProviderStore, FileManager) | Agent 1 | S1-T01 | Approved (QA PASS) |
| S1-T03 | Core: DocumentRegistry, StateManager + utils (slugify, logger, interruptHandler scaffold) | Agent 1 | S1-T02 | Approved (QA PASS) |
| S1-T04 | Command `docbuilder init` (folder scaffold, state init, brief save; AI calls stubbed) | Agent 1 | S1-T03 | Approved (QA PASS) |
| S1-T05 | Command `docbuilder status` + `docbuilder provider` (list/set/add/test/status) | Agent 1 | S1-T03 | Approved (QA PASS) |

QA tasks are prepared per implementation task: `QA-S1-T01` … `QA-S1-T05`.

---

## Sprint 2 — Stage 1 Generator (Milestone M2) — COMPLETE

| Task | Title | Owner | Depends on | Status |
|------|-------|-------|------------|--------|
| S2-T01 | AI Gateway: AIGateway, OpenAIProvider, AnthropicProvider, MockProvider, ProviderRegistryService, retry strategy | Agent 1 | S1-T02 | Approved (QA PASS) |
| S2-T02 | ContextBuilder: brief evaluation, Interactive Mode (max 5 questions), enriched brief, context.md generation | Agent 1 | S2-T01 | Approved (QA PASS) |
| S2-T03 | PlanningGenerator: initiate-planning.md, founder confirmation, templateRenderer, tokenCounter utilities | Agent 1 | S2-T02 | Approved (QA PASS) |
| S2-T04 | DocumentGenerator: template loading, placeholder rendering, carry-forward Stage 1, AI integration | Agent 1 | S2-T03 | Approved (QA PASS) |
| S2-T05 | QualityGate: quality check execution, report generation, confidence scoring, required decisions | Agent 1 | S2-T04 | Approved (QA PASS) |
| S2-T06 | DocumentPipeline + commands: generateNext flow, `docbuilder generate`, `docbuilder approve stage-1`, `docbuilder review`, `docbuilder regenerate`, interruptHandler full implementation, VersionManager | Agent 1 | S2-T05 | Complete |

QA tasks are prepared per implementation task: `QA-S2-T01` … `QA-S2-T06`.

---

## Sprint 3 — Stage 1 Validation & Refinement (Milestone M3) — COMPLETE

| Task | Title | Owner | Depends on | Status |
|------|-------|-------|------------|--------|
| S3-T01 | Stage 1 Validation & Refinement: realistic briefs, quality metrics, prompt template refinement, edge cases, bug fixes | Agent 1 | Sprint 2 | Approved (QA PASS WITH RISK) |

QA tasks are prepared per implementation task: `QA-S3-T01`.
