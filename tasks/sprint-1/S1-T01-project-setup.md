# S1-T01 — Project Setup (TypeScript + oclif + pnpm + tooling)

- **Sprint:** 1 — Fondasi & Setup
- **Owner:** Agent 1 (Senior Software Engineer)
- **Status:** Approved (QA-S1-T01 PASS · Agent 0 approved)
- **Depends on:** none (first task)
- **Source of truth:** SDD §4 (dir structure), SDD §6.9 (`package.json`), TRD §5.2 (stack), Task Breakdown §3

## Goal
Stand up the project skeleton so `docbuilder` is installable and runs, and verify the two highest-risk technical assumptions (oclif+ESM, template path resolution) BEFORE any business logic is written.

## Scope (do only this)
1. Initialize repo as a TypeScript + oclif v4 + pnpm package.
2. Create `package.json` per SDD §6.9:
   - `"type": "module"`, `engines.node >= 22`.
   - package name `mindtoscreen-docbuilder`, `bin: { "docbuilder": "./bin/run.js" }` (see Open Question in report — confirm name before publish).
   - `oclif` config block (`commands: ./dist/commands`, `topicSeparator: " "`).
   - scripts: `build` (tsc), `dev` (tsx), `test` (vitest), `lint` (eslint).
3. Pin `@oclif/core` to `4.x.x` (no `^`/`~`) per TRD R-03.
4. Add `tsconfig.json` (strict), `.eslintrc.json`, `.prettierrc`, `vitest.config.ts`, `.gitignore` (incl. `dist/`, `node_modules/`, `*.env`).
5. Create `src/index.ts` entry point and `bin/run.js`.
6. Create the directory skeleton from SDD §4 (`src/commands`, `src/core`, `src/ai`, `src/storage`, `src/config`, `src/utils`, `templates/`, `tests/unit`, `tests/integration`). Empty placeholder dirs are fine — no business logic.
7. Add ONE trivial smoke command (`docbuilder hello` or a minimal `status` stub printing a placeholder) ONLY to validate oclif command discovery under ESM. (The real `status` is built in S1-T05.)
8. Add a template-path resolver utility stub that resolves `templates/` via `import.meta.url` + `fileURLToPath` (per SDD R-03), and a temporary check that it locates a sample `templates/.gitkeep` after `npm install -g .`.

## Out of Scope
- No StateStore/ProviderStore/FileManager/DocumentRegistry (those are S1-T02/T03).
- No real `init`/`status`/`provider` business logic.
- No AI calls.

## Acceptance Criteria
- [ ] `pnpm install` completes; `pnpm build` produces `dist/`.
- [ ] `npm install -g .` from the source dir succeeds.
- [ ] `docbuilder --version` prints version from `package.json` (oclif auto).
- [ ] `docbuilder --help` lists available command(s).
- [ ] The smoke command runs end-to-end after global install (proves oclif+ESM discovery — TRD R-01).
- [ ] Template path resolver locates the bundled `templates/` dir after global install (proves TRD R-03).
- [ ] `@oclif/core` pinned to exact `4.x.x`.
- [ ] `pnpm lint` passes; `pnpm test` passes (even if only a trivial test exists).
- [ ] No `console.log` outside the (future) logger — smoke command output may use oclif's `this.log` temporarily but note it for removal.

## Risk Notes (verify Day 1)
- **TRD R-01 / SDD R-01** — oclif v4 command discovery under ESM. If broken, spend max 1 day on workaround before escalating to Agent 0 (Commander.js fallback is documented as a last resort).
- **TRD R-02** — `write-file-atomic` ESM compat: confirm it imports cleanly now (used in S1-T02). If not, plan manual tmp+rename.
- **SDD R-03** — template path must use `import.meta.url`, never `process.cwd()`.

## Definition of Done
Acceptance criteria met, `pnpm lint`/`pnpm test`/`pnpm build` pass, QA (`QA-S1-T01`) = PASS or PASS WITH RISK, Agent 0 approves.

## Submission Report (Agent 1)

**Changed / created files**
- `package.json` (name `mindtoscreen-docbuilder`, bin `docbuilder`, ESM, oclif config, scripts).
- `tsconfig.json` (strict, NodeNext, `types: ["node"]`), `.eslintrc.json`, `.prettierrc`, `vitest.config.ts`, `.gitignore` (added `node_modules/`, `dist/`, env).
- `bin/run.js` (oclif ESM entry), `src/index.ts`.
- `src/utils/templatePath.ts` (resolves `templates/` via `import.meta.url`).
- `src/commands/hello.ts` (temporary smoke command — to be removed in S1-T05).
- `templates/.gitkeep`, `tests/unit/smoke.test.ts`.

**Dependencies**
- `@oclif/core` pinned exact `4.11.7` (`pnpm add -E`, no `^`/`~`) — TRD R-03.
- devDeps: `typescript@~5.5.4` (TRD §5.2 = 5.x), `tsx`, `vitest`, `eslint@^8.57`, `@typescript-eslint/*@^7`, `prettier`, `@types/node`.

**Commands run**
- `pnpm add -E @oclif/core`; `pnpm add -D ...`; `pnpm build`; `pnpm lint`; `pnpm test`; `npm install -g .`; `docbuilder --version`; `docbuilder --help`; `docbuilder hello` (from `/tmp`).

**Results**
- `pnpm build` ✓ (no TS errors). `pnpm lint` ✓ (clean). `pnpm test` ✓ (1/1).
- `npm install -g .` ✓ → `docbuilder --version` prints `mindtoscreen-docbuilder/0.1.0`.
- `docbuilder --help` lists `hello` → oclif+ESM discovery verified (TRD R-01 / SDD R-01).
- `docbuilder hello` run from `/tmp` resolves bundled `templates/` correctly → template path resolution verified (SDD R-03), not `cwd`-dependent.

**Risks / blockers**
- Registry default TypeScript was `6.0.3`; pinned to `5.5.4` to honor TRD §5.2 and `@typescript-eslint` v7 support window.
- **R-02 (`write-file-atomic` ESM compat) NOT yet verified** — not a S1-T01 dependency; carry into S1-T02 where it is first used.
- `esbuild` postinstall build script was auto-ignored by pnpm; `tsx`/`vitest` still function. Revisit only if a native-binary issue appears.
- ESLint uses legacy `.eslintrc.json` (per SDD §4) with ESLint 8.x; ESLint 9 flat-config migration deferred.

**Status:** Ready for QA (`QA-S1-T01`).
