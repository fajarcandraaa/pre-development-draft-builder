# QA-S1-T04 — QA for `docbuilder init`

- **Sprint:** 1 | **Owner:** Agent 2 (QA) | **Tests:** S1-T04
- **Precondition:** Agent 1 submitted S1-T04 and Agent 0 routed it to QA.

## Scope
Validate the `init` command end-to-end (non-interactive via flags) + `InputParser`. No AI in Sprint 1.

## Scenarios

### QA-1: Gates
- `pnpm build`, `pnpm lint`, `pnpm test` → all pass.

### QA-2: Happy path (non-interactive)
- Run `docbuilder init --name "Demo Project" --language id --mode balanced --input text --brief "..." --dir <tmp>`.
- Expect: `<tmp>/demo-project/` with `.docbuilder/ input/ planning/ documents/ reviews/ versions/`; `input/raw-brief.md` saved; `state.json` with 9 `pending` docs; slug/language/mode persisted; `stage1Approved=false`.

### QA-3: Overwrite guard
- Re-run on an existing dir without `--force/--yes` and decline → aborts, existing project unchanged.
- Re-run with `--force` → overwrites (new metadata persisted).

### QA-4: File input
- `--input file --file <path>` reads brief from file; missing file → `BriefFileNotFoundError` (no partial project left in a broken state).

### QA-5: InputParser unit
- `parseFromText` trims; `parseFromFile` reads/throws; `saveBrief` writes `input/raw-brief.md`; word/char counts correct.

### QA-6: Output channel
- All command output via `Logger` (no stray `console.*` in `src/commands/init.ts`).

## Regression
- `docbuilder --version` / `--help` still work; `hello` smoke still present; all prior tests green.

## Report (Agent 2)

**Verdict: PASS (after fix)**

**Per-scenario expected vs actual**

| # | Scenario | Expected | Actual | Result |
|---|----------|----------|--------|--------|
| QA-1 | Gates | build+lint+test pass | clean; 57/57 tests across 12 files | PASS |
| QA-2 | Happy path | structure + brief + 9-pending state | verified via integration test + real `/tmp` run | PASS |
| QA-3 | Overwrite guard | decline aborts; `--force` overwrites | both covered by integration tests | PASS |
| QA-4 | File input + missing file | reads file; missing → clean error, no partial project | **initially FAILED**, fixed → exits 1, no partial dir | PASS |
| QA-5 | InputParser unit | trim/read/throw/save/counts | `InputParser.test.ts` (5) pass | PASS |
| QA-6 | Output channel | no stray `console.*` in command | grep confirms none | PASS |

**Defect found & fixed during QA (D-1, medium):**
- *Symptom:* `init --input file` with a missing file created the project directory tree, then threw `BriefFileNotFoundError`, leaving a partial/broken project.
- *Root cause:* filesystem mutation (`createProjectStructure`) ran before brief resolution.
- *Fix (Agent 1):* resolve the brief (file read / prompt) **before** any overwrite/`rm` or structure creation — fail-fast. Added regression test `fails fast on a missing brief file without creating a partial project`.
- *Re-verified:* missing file → exit 1, no directory created; happy path unaffected.

**Regression:** `docbuilder --version`/`--help`/`hello` still work; all prior tests green.

**Release recommendation: PASS** — all acceptance criteria met after D-1 fix. Cleared to close and proceed to S1-T05.
