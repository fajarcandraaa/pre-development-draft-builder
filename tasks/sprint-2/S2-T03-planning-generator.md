# S2-T03 — PlanningGenerator Implementation

**Sprint:** Sprint 2 — Stage 1 Generator
**Task:** S2-T03
**Owner:** Agent 1 (Senior Software Engineer)
**Depends on:** S2-T01 (AI Gateway), S2-T02 (ContextBuilder), S1-T02 (DocumentRegistry)
**Status:** Complete - APPROVED

---

## Objective

Implement PlanningGenerator that generates `initiate-planning.md` with document sequence and duration estimates. Also implement templateRenderer and tokenCounter utilities.

---

## Scope

### Components to Create

1. **`src/core/PlanningGenerator.ts`** — PlanningGenerator service
   - `generate(state: ProjectState)` — generate initiate-planning.md
   - `estimateDuration(mode: QualityMode)` — estimate time per document

2. **`src/utils/templateRenderer.ts`** — Template rendering utility
   - `render(template: string, variables: Record<string, string>)` — replace placeholders

3. **`src/utils/tokenCounter.ts`** — Token estimation utility
   - `estimateTokens(text: string)` — estimate token count
   - `estimateTotalTokens(documents: string[])` — estimate total for multiple documents

### PlanningGenerator Logic

From SDD §6.4:
- Generate `planning/initiate-planning.md` with document sequence
- Include duration estimates per quality mode
- Use DocumentRegistry to get document sequence
- Use AIGateway for AI generation

### Duration Estimation

From TRD §5.5.3:
- fast-draft: ~2-3 minutes per document
- balanced: ~5-7 minutes per document
- deep-analysis: ~10-15 minutes per document

### initiate-planning.md Structure

```markdown
# Initiate Planning

## Document Sequence
1. Discovery Notes
2. BRD
3. SOW
4. PRD
5. UI/UX Flow
6. SRS
7. TRD
8. SDD
9. Task Breakdown

## Duration Estimates
### Fast-Draft Mode
- Discovery Notes: ~2 min
- BRD: ~3 min
- ... (total: ~X min)

### Balanced Mode
- Discovery Notes: ~5 min
- BRD: ~7 min
- ... (total: ~Y min)

### Deep-Analysis Mode
- Discovery Notes: ~10 min
- BRD: ~15 min
- ... (total: ~Z min)

## Next Steps
Run `docbuilder generate` to begin document generation.
```

---

## Acceptance Criteria

1. **PlanningGenerator.generate**
   - Generates initiate-planning.md with document sequence
   - Includes duration estimates for all quality modes
   - Uses DocumentRegistry to get document list
   - Uses AIGateway for AI generation
   - Writes to planning/ directory

2. **PlanningGenerator.estimateDuration**
   - Returns duration per document for given quality mode
   - Returns total duration estimate
   - Supports all three quality modes

3. **templateRenderer**
   - Replaces {{placeholder}} with values
   - Handles missing placeholders gracefully
   - Supports nested placeholders

4. **tokenCounter**
   - Estimates token count for text
   - Uses ~4 chars per token heuristic
   - Handles markdown formatting

5. **Unit Tests**
   - Test PlanningGenerator.generate with mock AI
   - Test PlanningGenerator.estimateDuration
   - Test templateRenderer with various templates
   - Test tokenCounter with various inputs

---

## Dependencies

- S2-T01 (AIGateway) — for AI calls
- S2-T02 (ContextBuilder) — for context.md
- S1-T02 (DocumentRegistry) — for document sequence
- S1-T02 (FileManager) — for file operations

---

## Source of Truth

- **SDD §6.4** — PlanningGenerator design
- **TRD §5.5.3** — Token budget and duration estimates
- **SRS FR-08** — Planning Generation

---

## Implementation Notes

1. **Duration Estimates**: Use TRD values as baseline:
   - fast-draft: 2-3 min/doc
   - balanced: 5-7 min/doc
   - deep-analysis: 10-15 min/doc

2. **Token Counter**: Use simple heuristic (~4 chars per token) for MVP. Can be refined later with actual tokenizer.

3. **Template Renderer**: Support {{variable}} syntax. Replace all occurrences with provided values.

4. **AI Generation**: Use brief + context.md to generate planning document with realistic estimates.

---

## Submission Checklist

- [x] PlanningGenerator.ts created with all methods
- [x] templateRenderer.ts created
- [x] tokenCounter.ts created
- [x] Unit tests for all components
- [x] `pnpm lint` passes
- [x] `pnpm test` passes
- [x] `pnpm build` passes
- [x] No `any` types
- [x] No `console.log` outside logger.ts
- [x] All acceptance criteria verified

---

## Submission Report Template

When submitting, include:

### Created Files
- List of all files created with line counts

### Dependencies Added
- None (uses existing dependencies)

### Commands Run
- `pnpm lint`
- `pnpm test`
- `pnpm build`

### Results
- Lint output (summary)
- Test output (summary)
- Build output (summary)

### Design Notes
- Any deviations from SDD (with justification)
- Edge cases handled

### Risks / Blockers
- Any issues encountered
- Any decisions requiring Agent 0 approval

### Status
- **In Review → QA** (ready for Agent 2)

---

## Submission Report

### Created Files
- `src/utils/templateRenderer.ts` - 40 lines - Template rendering utility with {{placeholder}} support
- `src/utils/tokenCounter.ts` - 45 lines - Token estimation using ~4 chars per token heuristic
- `src/core/PlanningGenerator.ts` - 205 lines - PlanningGenerator service with duration estimates
- `tests/unit/utils/templateRenderer.test.ts` - 70 lines - 11 tests for templateRenderer
- `tests/unit/utils/tokenCounter.test.ts` - 65 lines - 11 tests for tokenCounter
- `tests/unit/core/PlanningGenerator.test.ts` - 115 lines - 6 tests for PlanningGenerator

### Dependencies Added
- None (uses existing dependencies)

### Commands Run
- `pnpm lint` - Passed
- `pnpm test` - Passed (151 tests total, 28 new tests)
- `pnpm build` - Passed

### Results
- **Lint:** No errors
- **Tests:** 151/151 passed
- **Build:** Successful

### Design Notes
- Duration estimates based on TRD §5.5.3 values (fast-draft: 2-3 min, balanced: 5-7 min, deep-analysis: 10-15 min)
- Token counter uses simple ~4 chars per token heuristic - can be refined with actual tokenizer later
- Template renderer supports both simple {{placeholder}} and nested {{parent.child}} syntax
- PlanningGenerator uses AI to generate planning document with context and estimates
- Prompt templates embedded in code for now - can be extracted to templates/ directory later

### Risks / Blockers
- Token counter heuristic is approximate - may not match actual model tokenization
- Prompt templates embedded in code - should be extracted to templates/ directory for better maintainability

---

## Agent 0 Approval Summary

### Implementation Review
**Status:** APPROVED

**Components Delivered:**
- `src/utils/templateRenderer.ts` - Template rendering with {{placeholder}} and nested {{parent.child}} support
- `src/utils/tokenCounter.ts` - Token estimation using ~4 chars per token heuristic
- `src/core/PlanningGenerator.ts` - PlanningGenerator service with duration estimates
- 28 unit tests (11 templateRenderer, 11 tokenCounter, 6 PlanningGenerator)

**Acceptance Criteria Verification:**
1. ✓ PlanningGenerator.generate - Generates initiate-planning.md with document sequence, includes duration estimates, uses DocumentRegistry and AIGateway
2. ✓ PlanningGenerator.estimateDuration - Returns duration per document and total for all three quality modes
3. ✓ templateRenderer - Replaces {{placeholder}} with values, handles missing placeholders gracefully, supports nested placeholders
4. ✓ tokenCounter - Estimates token count using ~4 chars per token heuristic, handles markdown formatting
5. ✓ Unit Tests - 28 tests covering all methods with mocked AI and FileManager

### QA Review
**Status:** PASS

**QA Results:**
- 12/12 scenarios passed
- 0 defects found
- All regression checks passed (no new `any` types, no `console.log` outside logger.ts)
- 151/151 tests passing

**QA Observations:**
- Token counter uses simple heuristic (acceptable for MVP)
- Prompt templates embedded in code (should be extracted later)
- Duration estimates based on TRD values
- Template renderer supports both simple and nested placeholders

### Quality Gates
- ✓ Lint: No errors
- ✓ Tests: 151/151 passed
- ✓ Build: Successful

### Design Decisions
1. **Token Counter Heuristic:** Uses ~4 chars per token approximation. Justification: Acceptable for MVP, can be refined with actual tokenizer in Sprint 3.
2. **Prompt Templates Embedded:** Deviation from task requirement to use separate template files. Justification: Acceptable for current phase, should be extracted to `templates/prompts/` directory in Sprint 3 for better maintainability.

### Deviations from SDD
- Prompt templates embedded in code strings instead of separate files (acceptable for now)
- Token counter uses simple heuristic instead of actual tokenizer (acceptable for MVP)

### Final Decision
**APPROVED** - S2-T03 PlanningGenerator implementation meets all acceptance criteria with acceptable deviations. Quality gates passed, QA passed with no defects. Ready for next task (S2-T04).
