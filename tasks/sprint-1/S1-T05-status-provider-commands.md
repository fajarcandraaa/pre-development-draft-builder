# S1-T05 — Commands `docbuilder status` + `docbuilder provider`

- **Sprint:** 1 | **Owner:** Agent 1 | **Status:** Approved (QA-S1-T05 PASS · Agent 0 approved · closes M1)
- **Depends on:** S1-T03 (Approved)
- **Source of truth:** SDD §6.5 (status/provider flows), §6.8 (Logger.table), Task Breakdown §3

## Goal
Implement read-only `status` and the full `provider` sub-command tree. `provider test` performs a real API ping.

## Scope
- `src/commands/status.ts` — read state, render pipeline table (all `pending` after init) via `Logger`. Replaces the S1-T01 smoke command.
- `src/commands/provider/` tree: `index.ts` (root), `list.ts`, `set.ts`, `add.ts`, `test.ts`, `status.ts` per SDD §6.5.
  - `add <name> --key <key>` → write to `~/.docbuilder/provider.json` (perm 600); env-var precedence warning.
  - `set <name>` → switch `default` with confirmation.
  - `test [name]` → resolve key (env || file), ping provider, show model + response time or actionable error.
  - `status` → per provider: configured/not configured + first 4 chars of key + source (env/file); show active provider.
  - `list` → registered providers.

## Out of Scope
- `generate`/`approve`/`review`/`regenerate` (Sprint 2). Full AIGateway (Sprint 2) — `provider test` may use a minimal direct SDK ping.

## Acceptance Criteria (from Task Breakdown §3 DoD)
- [ ] `docbuilder status` shows pipeline table with all docs `pending`.
- [ ] `provider add openai --key sk-xxx` saves to `~/.docbuilder/provider.json` with perm `600`.
- [ ] `provider test` pings OpenAI successfully (with a valid key).
- [ ] `provider status` shows `configured` + first 4 chars of key.
- [ ] `provider set anthropic` switches active provider.
- [ ] `provider list` lists registered providers.
- [ ] All output via `Logger`; `pnpm lint`/`pnpm test`/`pnpm build` pass.

## Definition of Done
Criteria met + QA-S1-T05 PASS/PASS WITH RISK + Agent 0 approval. After this, verify the full Sprint 1 "Definisi Done" checklist (Task Breakdown §3) before closing M1.

## Submission Report (Agent 1)

**Created files**
- `src/commands/status.ts` — reads `state.json`, renders the 9-document pipeline table (`#`, Document, Stage, Status, Confidence) + quality mode / Stage 1 approval via `Logger`. Errors cleanly if no project found.
- `src/ai/providerCatalog.ts` — Sprint-1 provider catalog (openai, anthropic): default models/maxTokens/temperature, env-var names, `isKnownProvider`, `maskKey`, `resolveApiKey` (env precedence), `buildDefaultEntry`, `pingProvider` (no-cost `GET /v1/models`).
- `src/commands/provider/{index,list,add,set,test,status}.ts` — full sub-command tree (orchestration only).
- Tests: `tests/unit/ai/providerCatalog.test.ts`, `tests/integration/{status,provider}.test.ts`.

**Changed/removed**
- Removed `src/commands/hello.ts` (S1-T01 smoke) — replaced by `status`.
- `paths.ts`: added `getProviderFilePath()` honoring `DOCBUILDER_PROVIDER_FILE` (test isolation); `ProviderStore` default path now uses it.
- `package.json`: added `clean`/`prebuild` so `tsc` builds never leave stale `dist/` command files (root cause of `hello` lingering in `--help`).

**Design / scope notes**
- `provider test` uses a minimal direct HTTPS ping (no SDK) per task's allowance — satisfies "ping OpenAI" without pulling Sprint-2 AI deps. To be swapped for `AIProvider.isAvailable()` when AIGateway lands.
- Env var (`OPENAI_API_KEY`/`ANTHROPIC_API_KEY`) takes precedence over the stored key; `add` warns when the env var is set.
- `status` accepts a hidden `--dir` (project dir) for test isolation.

**Commands run**
- `pnpm build` (clean) · `pnpm lint` · `pnpm test`; global install + real init→status→provider add/list/status smoke with `DOCBUILDER_PROVIDER_FILE` pointed at `/tmp`.

**Results**
- All gates ✓ — **73/73 tests** across 15 files.
- Real smoke: pipeline table renders 9 pending docs; `provider add openai` wrote `provider.json` with perm `-rw-------` (600); `list`/`status` show `configured`, source `file`, masked key `sk-T**`, active `openai`. `--help` now lists exactly `init`, `provider`, `status`.

**Risks / blockers**
- `provider test` against the live OpenAI API requires a real key — covered by unit tests with mocked `fetch`; QA can run the live ping manually with a valid key (Sprint 1 DoD item).
- Benign oclif `plugin-plugins`/`plugin-help` debug warning under Vitest only (no packaged plugin tree); absent in the real CLI.

**Status:** Ready for QA (`QA-S1-T05`). This is the final Sprint 1 implementation task — Sprint 1 DoD review follows.
