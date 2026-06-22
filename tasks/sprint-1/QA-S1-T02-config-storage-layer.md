# QA-S1-T02 — QA for Config + Storage Layer

- **Sprint:** 1 | **Owner:** Agent 2 (QA) | **Tests:** S1-T02
- **Precondition:** Agent 1 submitted S1-T02 and Agent 0 routed it to QA.

## Scope
Validate persistence + config modules: Zod validation, atomic writes, `provider.json` perm `600`, project structure, document/version handling. Unit-test driven (no AI, no commands yet).

## Scenarios

### QA-1: Gates
- `pnpm build`, `pnpm lint`, `pnpm test` → all pass.

### QA-2: StateStore round-trip
- Write a valid `ProjectState`, read it back → deep-equal; file at `<projectDir>/.docbuilder/state.json`; `.docbuilder/` auto-created.

### QA-3: StateStore validation
- Reading a malformed `state.json` throws; writing an invalid object throws (Zod).

### QA-4: ProviderStore round-trip + 600
- Write a valid `ProviderConfig` (parent dirs auto-created), read back equal; `stat` shows mode `0o600` (POSIX).

### QA-5: ProviderStore validation
- Writing an invalid config throws (Zod).

### QA-6: FileManager structure
- `createProjectStructure()` creates `input/ planning/ documents/ reviews/ versions/ .docbuilder/`.

### QA-7: FileManager documents/reviews/planning/input
- Write+read document (path uses registry filename, e.g. `documents/02-brd.md`), review (`reviews/brd-quality-gate.md`), planning, input.

### QA-8: FileManager archiveVersion
- After writing a doc, `archiveVersion(docId, n)` moves it to `versions/<docId>-v<n>-<timestamp>.md`; original removed; content preserved.

### QA-9: Registry integrity
- 9 docs; order 1..9; 4 Stage 1 + 5 Stage 2; each `dependsOn` references an earlier doc; unknown id throws.

### QA-10: R-02 confirmation
- Confirm `write-file-atomic` imports/builds cleanly under ESM (covered by QA-1 + QA-2/QA-4 atomic writes).

## Regression
- Re-run S1-T01 checks: `docbuilder --version` / `--help` still work after rebuild (no command regressions).

## Report (Agent 2)

**Verdict: PASS**

**Per-scenario expected vs actual**

| # | Scenario | Expected | Actual | Result |
|---|----------|----------|--------|--------|
| QA-1 | Gates | build+lint+test pass | `pnpm build`/`lint`/`test` clean; 25/25 tests | PASS |
| QA-2 | StateStore round-trip | deep-equal, file under `.docbuilder/`, dir auto-created | covered by `StateStore.test.ts` (write→read equal; path asserted) | PASS |
| QA-3 | StateStore validation | malformed read throws; invalid write throws | both assertions pass (Zod) | PASS |
| QA-4 | ProviderStore round-trip + 600 | equal round-trip; mode `0o600` | `ProviderStore.test.ts` asserts equality + `stat` mode `0o600` | PASS |
| QA-5 | ProviderStore validation | invalid config throws | passes (Zod) | PASS |
| QA-6 | FileManager structure | 6 dirs created | `createProjectStructure` test passes | PASS |
| QA-7 | docs/reviews/planning/input | write+read w/ registry filename | `documents/02-brd.md`, `reviews/brd-quality-gate.md` asserted | PASS |
| QA-8 | archiveVersion | move to `versions/<id>-v<n>-<ts>.md`, original gone, content kept | passes | PASS |
| QA-9 | Registry integrity | 9 docs, order 1..9, 4+5 split, deps earlier, unknown throws | `registry.test.ts` passes | PASS |
| QA-10 | R-02 confirmation | atomic ESM import builds + runs | confirmed via QA-1 build + QA-2/QA-4 atomic writes | PASS |

**Regression:** `docbuilder --version` and `--help` still work after rebuild — no command regressions.

**Defects:** none.

**Observations (non-blocking):**
- `getReviewPath` naming (`<docId>-quality-gate.md`) to be reconciled with `QualityGate.saveReport` in Sprint 2.
- Storage layer is unit-test-only at this stage; end-to-end exercise arrives with the `init`/`provider` commands (S1-T04/T05).

**Release recommendation: PASS** — S1-T02 meets all acceptance criteria; R-02 resolved. Cleared to close and proceed to S1-T03.
