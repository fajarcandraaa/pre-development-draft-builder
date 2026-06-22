# S1-T03 — Core: DocumentRegistry, StateManager + Utilities

- **Sprint:** 1 | **Owner:** Agent 1 | **Status:** Approved (QA-S1-T03 PASS · Agent 0 approved)
- **Depends on:** S1-T02 (Approved)
- **Source of truth:** SDD §6.2 (StateManager, DocumentRegistry), §6.8 (Logger), §6.1 (no console.log), utils in §4

## Goal
Implement the in-memory core that commands depend on: document ordering/lookup, state transitions, and shared utilities.

## Scope
- `DocumentRegistry` class (SDD §6.2): `getAll/getById/getNextPending/getStage/getDependencies`. No I/O.
- `StateManager` class (SDD §6.2): sole reader/writer of state via `StateStore`; `getState`, `updateDocumentStatus`, `setStage1Approved`, `revokeStage1Approval`, `validateTransition` (throws `StateTransitionError`).
- `src/utils/slugify.ts`.
- `src/utils/logger.ts` — `Logger` with `success/warning/error/info/progress/table/divider/confidenceBar` (SDD §6.8). All terminal output goes here.
- `src/utils/interruptHandler.ts` — SIGINT scaffold only (register/handler stub; full reset logic is Sprint 2).
- Error classes from SDD §7 needed now (`StateTransitionError`, etc.).

## Out of Scope
- Commands (S1-T04/T05). No AI. interruptHandler full implementation (Sprint 2).

## Acceptance Criteria
- [ ] `getNextPending` returns correct next doc respecting order + dependencies.
- [ ] `validateTransition` rejects invalid transitions (e.g., pending → generated skipping generating per state model).
- [ ] `StateManager` is the only writer of `state.json`; uses `StateStore`.
- [ ] No `console.log` outside `logger.ts`.
- [ ] Unit tests for `StateManager`, `DocumentRegistry`, `slugify` pass.
- [ ] `pnpm lint`/`pnpm test`/`pnpm build` pass.

## Definition of Done
Criteria met + QA-S1-T03 PASS/PASS WITH RISK + Agent 0 approval.

## Submission Report (Agent 1)

**Created files**
- `src/core/errors.ts` — all SDD §7 error classes (`StateTransitionError`, `DocumentNotFoundError`, `ProviderNotConfiguredError`, `Stage1NotApprovedError`, `BriefFileNotFoundError`, `APIError`).
- `src/core/DocumentRegistry.ts` — class wrapper over `DOCUMENT_REGISTRY`: `getAll/getById/getNextPending/getStage/getDependencies` (pure, no I/O).
- `src/core/StateManager.ts` — sole state reader/writer via injected `StateStore`: `getState`, `updateDocumentStatus`, `setStage1Approved`, `revokeStage1Approval`, `validateTransition` (throws `StateTransitionError`) + static `createInitialState`.
- `src/utils/slugify.ts`, `src/utils/logger.ts` (`Logger` — only place `console` is allowed), `src/utils/interruptHandler.ts` (SIGINT register/unregister scaffold).
- Tests: `tests/unit/core/{DocumentRegistry,StateManager}.test.ts`, `tests/unit/utils/{slugify,logger}.test.ts`.

**Design notes**
- Transition model: `pending→generating`, `generating→{generated,pending}`, `generated→{generating,stale}`, `stale→generating`; same-status is a no-op.
- `createInitialState` enumerates all 9 docs from the registry as `pending`.
- `interruptHandler` is a scaffold only — full reset-to-`pending` + `.partial` cleanup is Sprint 2.
- `Logger` exposes `formatDivider`/`formatTable` (pure) for testability; document-specific `display*` summaries deferred to Sprint 2 (need QG types).

**Commands run**
- `pnpm build`; `pnpm lint`; `pnpm test`.

**Results**
- `pnpm build` ✓ · `pnpm lint` ✓ · `pnpm test` ✓ — **48/48 tests** across 10 files.
- No `console.*` outside `logger.ts` (single `eslint-disable no-console` scoped to that file).

**Risks / blockers**
- None. `StateManager`/`DocumentRegistry` are ready for the `init`/`status` commands (S1-T04/T05).

**Status:** Ready for QA (`QA-S1-T03`).
