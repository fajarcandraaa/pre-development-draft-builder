# QA-S1-T05 — QA for `status` + `provider` commands

- **Sprint:** 1 | **Owner:** Agent 2 (QA) | **Tests:** S1-T05
- **Precondition:** Agent 1 submitted S1-T05 and Agent 0 routed it to QA.

## Scope
Validate `docbuilder status` and the `provider` sub-command tree, plus the Sprint 1 Definition of Done (Task Breakdown §3). Provider commands tested against an isolated config (`DOCBUILDER_PROVIDER_FILE`).

## Scenarios

### QA-1: Gates
- `pnpm build` (clean), `pnpm lint`, `pnpm test` → all pass.

### QA-2: status
- After `init`, `status` renders the 9-document table (all `pending`) + quality mode/language + "Stage 1 approved: no".
- `status` in a non-project dir errors cleanly (exit 1).

### QA-3: provider add + perm 600
- `provider add openai --key sk-xxx` writes `provider.json` with perm `600`; first provider becomes active default; key masked in output.
- Unknown provider rejected.

### QA-4: provider status / list
- Show `configured`/`not configured`, source (env/file), first 4 chars of key, active provider.

### QA-5: provider set
- `set <name>` switches active provider when configured; rejects unconfigured provider; confirmation guarded (skippable with `--yes`).

### QA-6: provider test
- Resolves key (env precedence) and pings; mocked `fetch` → ok/HTTP-error/network-error paths handled; no-key path exits 1 with actionable message.
- (Manual) live OpenAI ping with a real key.

### QA-7: Output channel
- All output via `Logger`; no stray `console.*` in `src/commands/**` or `src/ai/**`.

## Sprint 1 Definition of Done (Task Breakdown §3)
- [x] `docbuilder init` end-to-end creates structure + state + brief.
- [x] `docbuilder status` shows pipeline (all pending).
- [x] `provider add` saves key (perm `-rw-------` = 600).
- [x] `provider test` reaches the OpenAI API (verified: fake key → HTTP 401; success requires a valid key).
- [x] `provider status`/`list`/`set` work (set switched default to anthropic).
- [x] Gates pass; all output via Logger (no stray `console.*`).

## Regression
- `init` flow + all prior tests still green; `--help` lists `init`, `provider`, `status` only (no `hello`).

## Report (Agent 2)

**Verdict: PASS**

**Per-scenario expected vs actual**

| # | Scenario | Expected | Actual | Result |
|---|----------|----------|--------|--------|
| QA-1 | Gates | clean build+lint+test | 73/73 tests across 15 files | PASS |
| QA-2 | status | 9-doc pending table + no-project error | rendered correctly; non-project dir exits 1 | PASS |
| QA-3 | add + perm | key saved, perm 600, masked, active | `provider.json` `-rw-------`, `sk-T**`, default set; unknown rejected | PASS |
| QA-4 | status/list | configured/source/masked/active | columns correct (file source, masked key) | PASS |
| QA-5 | set | switch when configured; reject otherwise | switched to anthropic; unconfigured rejected | PASS |
| QA-6 | test | env precedence, ping, error paths | live OpenAI ping → HTTP 401 on fake key (exit 1); mocked ok/error/network paths covered | PASS |
| QA-7 | output channel | only `logger.ts` uses console | grep confirms none elsewhere | PASS |

**Defects:** none.

**Notes:**
- A *successful* OpenAI ping needs a valid key; mechanism verified (real request hit the API and correctly reported 401). Treat as environmental, not a defect.
- `clean`/`prebuild` addition resolved stale `dist/` artifacts — `--help` now lists exactly `init`, `provider`, `status`.

**Release recommendation: PASS** — S1-T05 meets all acceptance criteria and the Sprint 1 DoD. Cleared to close S1-T05 and Milestone M1.
