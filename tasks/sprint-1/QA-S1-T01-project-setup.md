# QA-S1-T01 — QA for Project Setup

- **Sprint:** 1
- **Owner:** Agent 2 (Senior QA Engineer)
- **Tests:** S1-T01
- **Precondition:** Agent 1 submitted S1-T01 and Agent 0 routed it to QA. Do not start before there is something testable.

## Scope
Validate the skeleton is installable and the two high-risk assumptions hold. No feature behavior to test yet.

## Scenarios

### QA-1: Build
- Steps: `pnpm install`, `pnpm build`.
- Expected: completes without error; `dist/` exists.

### QA-2: Global install + version
- Steps: `npm install -g .` then `docbuilder --version`.
- Expected: global install succeeds; version matches `package.json`.

### QA-3: Help / command discovery (TRD R-01)
- Steps: `docbuilder --help`.
- Expected: command list renders; smoke command appears; no ESM discovery error.

### QA-4: Smoke command runs
- Steps: run the smoke command after global install.
- Expected: runs end-to-end, prints expected placeholder output, exit code 0.

### QA-5: Template path resolution (SDD R-03)
- Steps: run the resolver check after global install (from a directory OTHER than the source dir).
- Expected: resolver finds bundled `templates/` (proves it does not depend on `process.cwd()`).

### QA-6: Tooling gates
- Steps: `pnpm lint`, `pnpm test`.
- Expected: both pass.

### QA-7: Dependency pin
- Check: `@oclif/core` is pinned to exact `4.x.x` (no `^`/`~`).

## Regression
None (first task).

## Report (Agent 2)

**Verdict: PASS**

**Per-scenario expected vs actual**

| # | Scenario | Expected | Actual | Result |
|---|----------|----------|--------|--------|
| QA-1 | Build | builds, `dist/` exists | `pnpm build` clean; `dist/` present | PASS |
| QA-2 | Global install + version | install ok, version = `package.json` | `npm install -g .` ok; `--version` → `mindtoscreen-docbuilder/0.1.0` (= pkg 0.1.0) | PASS |
| QA-3 | Help / discovery (R-01) | command list renders, smoke cmd shown, no ESM error | `--help` lists `hello`; no discovery error | PASS |
| QA-4 | Smoke runs | runs end-to-end, exit 0 | `docbuilder hello` printed output, exit code 0 | PASS |
| QA-5 | Template path (R-03) | resolver finds `templates/` from non-source dir | ran from `/tmp`; resolved bundled `templates/`, `exists: true` | PASS |
| QA-6 | Tooling gates | lint + test pass | `pnpm lint` clean; `pnpm test` 1/1 | PASS |
| QA-7 | Dependency pin | `@oclif/core` exact `4.x.x` | `4.11.7` (no `^`/`~`) | PASS |

**Extra check (bundle integrity for real publish):** `npm pack --dry-run` confirms the tarball includes `bin/run.js`, `dist/**`, and `templates/.gitkeep` (14 files). Validates R-03 for a published install, not just the local linked global install.

**Defects:** none.

**Observations (non-blocking):**
- Local `npm install -g .` links back to the source repo, so QA-5's resolved path points at the source `templates/`. The `npm pack` check above covers the genuine publish path — no action needed for S1-T01.
- R-02 (`write-file-atomic` ESM compat) is out of scope here; must be verified in S1-T02 where it is first used.

**Release recommendation: PASS** — S1-T01 meets all acceptance criteria. Cleared to close and proceed to S1-T02.
