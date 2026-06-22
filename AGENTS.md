# AGENTS.md

## Project

Pre-Development Document Builder is an internal Mindtoscreen CLI tool for generating pre-development documents using AI.

This is not a web application. Do not split the project into Backend and Frontend workstreams.

## Agent Roles

### Agent 0 — Team Lead / Senior System Analyst
Responsible for planning, requirement consistency, task breakdown, review, and approval.

### Agent 1 — Senior Software Engineer
Responsible for TypeScript CLI implementation, core engine, AI Gateway, storage, and tests.

### Agent 2 — Senior QA Engineer
Responsible for test scenarios, CLI validation, regression testing, bug reports, and release recommendation.

## Source of Truth

Read documents in this order:
1. docs/01-discovery-notes.md
2. docs/02-brd.md
3. docs/03-sow.md
4. docs/04-prd.md
5. docs/05-uiux-flow.md
6. docs/06-srs.md
7. docs/07-trd.md
8. docs/08-sdd.md
9. docs/09-task-breakdown.md

Implementation source of truth:
- SRS for behavior.
- TRD for technical decision.
- SDD for module/interface design.
- Task Breakdown for sprint sequencing.

## Hard Rules

- Do not implement undocumented features.
- Do not change scope without Agent 0 approval.
- Do not skip tests.
- Do not commit secrets.
- Do not store API keys in repo.
- Do not implement Stage 2 before Stage 1 is stable.
- Do not change command behavior if it conflicts with SRS.

## Important Clarification

UI/UX Flow still mentions `docbuilder continue`, but SRS overrides it:
- `continue` is removed as a separate command.
- `docbuilder generate` is used to continue from current pipeline state.

## Definition of Done

A task is done only when:
- implementation matches acceptance criteria,
- lint passes,
- tests pass,
- build passes,
- QA result is PASS or PASS WITH RISK,
- Agent 0 approves the result.