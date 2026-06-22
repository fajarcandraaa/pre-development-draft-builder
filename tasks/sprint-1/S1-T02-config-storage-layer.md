# S1-T02 — Config + Storage Layer

- **Sprint:** 1 | **Owner:** Agent 1 | **Status:** Approved (QA-S1-T02 PASS · Agent 0 approved)
- **Depends on:** S1-T01 (Approved)
- **Source of truth:** SDD §5 (Zod schemas), §6.4 (StateStore/ProviderStore/FileManager), §6.6 (perm 600), TRD §5.9–5.10

## Goal
Implement persistence: validated read/write of `state.json` and `provider.json`, plus filesystem operations.

## Scope
- `src/config/paths.ts` — global dir (`~/.docbuilder/`) + per-project path constants (SDD §4, TRD §5.10).
- `src/config/registry.ts` — `DocumentDefinition[]` data for all 9 docs (TRD §5.8). Data only, no I/O.
- Zod schemas for `ProjectState` and `ProviderConfig` (SDD §5.1–5.2).
- `StateStore` — atomic read/write/exists for `state.json` via `write-file-atomic` (SDD §6.4).
- `ProviderStore` — atomic read/write/exists for global `provider.json`; set permission `600` after write; `encrypt/decrypt` passthrough for MVP (SDD §6.4, §6.6).
- `FileManager` — document/review/version/planning/input read/write + path resolution + `createProjectStructure()` + `archiveVersion()` signature (SDD §6.4).

## Out of Scope
- StateManager/DocumentRegistry class behavior (S1-T03). No commands.

## Acceptance Criteria
- [ ] All external file reads validated with Zod; invalid files throw clear errors.
- [ ] `StateStore` write is atomic (tmp + rename); no partial files on failure.
- [ ] `ProviderStore.write()` sets `600` on Linux/macOS; default config matches SDD §5.2 example.
- [ ] `FileManager.createProjectStructure()` creates `input/ planning/ documents/ reviews/ versions/ .docbuilder/`.
- [ ] Unit tests for `StateStore`, `ProviderStore`, `FileManager` (+ registry/paths) pass.
- [ ] `pnpm lint`/`pnpm test`/`pnpm build` pass.

## Definition of Done
Criteria met + QA-S1-T02 PASS/PASS WITH RISK + Agent 0 approval.

## Submission Report (Agent 1)

**Created files**
- `src/config/paths.ts` — `GLOBAL_DIR`, `PROVIDER_FILE`, `getProjectPaths()` (TRD §5.10).
- `src/config/registry.ts` — `DocumentDefinition` type + `DOCUMENT_REGISTRY` (all 9 docs, TRD §5.8) + `getDocumentDefinition`/`getDocumentFilename` lookups (data only).
- `src/storage/schemas.ts` — Zod `ProjectStateSchema` + `ProviderConfigSchema` (+ inferred types) ported from SDD §5.1–5.2.
- `src/storage/StateStore.ts` — atomic read/write/exists, Zod-validated, creates `.docbuilder/` on write.
- `src/storage/ProviderStore.ts` — atomic write with `mode 0o600` + `chmod 600`; injectable path for testability; `encrypt/decrypt` passthrough (MVP).
- `src/storage/FileManager.ts` — `createProjectStructure`, document/review/planning/input read+write, `archiveVersion`, path resolvers.
- Tests: `tests/helpers/fixtures.ts`, `tests/unit/config/{paths,registry}.test.ts`, `tests/unit/storage/{StateStore,ProviderStore,FileManager}.test.ts`.

**Dependencies**
- `zod@3.23.8` (TRD §5.2 = Zod v3), `write-file-atomic@5.0.1` (exact pins), dev `@types/write-file-atomic@4.0.3`.

**Commands run**
- `pnpm add -E zod@3.23.8 write-file-atomic@5.0.1`; `pnpm add -D -E @types/write-file-atomic@4.0.3`; `pnpm build`; `pnpm lint`; `pnpm test`.

**Results**
- `pnpm build` ✓ · `pnpm lint` ✓ · `pnpm test` ✓ — **25/25 tests** across 6 files.
- Atomic write verified; `provider.json` written with permission `600` (asserted via `stat`, skipped only on win32).
- Zod rejects malformed `state.json` / `provider.json` on read and write.

**R-02 (carried from S1-T01) — RESOLVED**
- `write-file-atomic@5` is ESM-native; `import writeFileAtomic from 'write-file-atomic'` works under `"type": "module"` + NodeNext. Build and atomic-write tests pass — no manual tmp+rename fallback needed.

**Risks / blockers**
- `getReviewPath` uses `<docId>-quality-gate.md` (SDD §6.4 phrases it as "<nama-dokumen>-quality-gate.md"); confirm naming when QualityGate lands in Sprint 2.
- `StateManager` / `DocumentRegistry` class wrappers + `createInitialState` are S1-T03 (registry currently exposes data + helpers only).

**Status:** Ready for QA (`QA-S1-T02`).
