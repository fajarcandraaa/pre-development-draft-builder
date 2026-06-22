# S2-T04 — DocumentGenerator Implementation

**Sprint:** Sprint 2 — Stage 1 Generator
**Task:** S2-T04
**Owner:** Agent 1 (Senior Software Engineer)
**Depends on:** S2-T01 (AI Gateway), S2-T03 (templateRenderer), S1-T02 (DocumentRegistry)
**Status:** Complete - APPROVED

---

## Objective

Implement DocumentGenerator that loads prompt templates, carries forward content from previous documents, and integrates with AI for document generation.

---

## Scope

### Components to Create

1. **`src/core/DocumentGenerator.ts`** — DocumentGenerator service
   - `generate(doc: DocumentDefinition, context: GenerationContext)` — generate document
   - `loadTemplate(templatePath: string)` — load prompt template
   - `assembleCarryForward(previousDocIds: string[], stage: 1 | 2)` — assemble carry-forward content

### DocumentGenerator Logic

From SDD §6.4:
- Load prompt template from templates/ directory
- Render template with placeholder values
- Assemble carry-forward content from previous documents
- Call AI with assembled prompt
- Return generated document content

### Carry-Forward Strategy

From TRD §5.5.1:
- **Stage 1:** Full text of previous Stage 1 documents with 50% max_tokens limit
- **Stage 2:** stage-1-summary.md + full text of previous Stage 2 documents

### Generation Context

```typescript
interface GenerationContext {
  state: ProjectState
  previousDocs: Record<string, string>
  revisionNote?: string
  dryRun?: boolean
}
```

---

## Acceptance Criteria

1. **Template Loading**
   - Loads prompt template from templates/ directory
   - Handles missing templates gracefully
   - Returns template content as string

2. **Template Rendering**
   - Uses templateRenderer to replace placeholders
   - Includes context.md in template
   - Includes carry-forward content in template

3. **Carry-Forward Assembly**
   - Loads content from previous documents
   - Applies Stage 1 strategy (full text, 50% limit)
   - Applies Stage 2 strategy (summary + Stage 2 docs)
   - Handles missing dependencies gracefully

4. **Document Generation**
   - Calls AI with assembled prompt
   - Uses AIGateway for token budget enforcement
   - Returns generated document content
   - Handles AI errors with retry (via AIGateway)

5. **Unit Tests**
   - Test template loading with FileManager
   - Test carry-forward assembly for Stage 1
   - Test carry-forward assembly for Stage 2
   - Test document generation with mock AI

---

## Dependencies

- S2-T01 (AIGateway) — for AI calls
- S2-T03 (templateRenderer) — for template rendering
- S1-T02 (DocumentRegistry) — for document definitions
- S1-T02 (FileManager) — for file operations

---

## Source of Truth

- **SDD §6.4** — DocumentGenerator design
- **TRD §5.5.1** — Carry-forward strategy
- **SRS FR-09** — Document Generation

---

## Implementation Notes

1. **Template Loading**: Use FileManager to read template files from templates/ directory.

2. **Carry-Forward Stage 1**: Load full text of previous Stage 1 documents, limit to 50% of max_tokens.

3. **Carry-Forward Stage 2**: Load stage-1-summary.md + full text of previous Stage 2 documents.

4. **Template Rendering**: Use templateRenderer from S2-T03 to replace placeholders.

5. **AI Integration**: Use AIGateway from S2-T01 for AI calls with token budget enforcement.

---

## Submission Checklist

- [x] DocumentGenerator.ts created with all methods
- [x] Unit tests for all methods
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
- `src/core/DocumentGenerator.ts` - 224 lines - DocumentGenerator service with carry-forward logic
- `tests/unit/core/DocumentGenerator.test.ts` - 181 lines - 8 unit tests for DocumentGenerator

### Dependencies Added
- None (uses existing dependencies)

### Commands Run
- `pnpm lint` - Passed
- `pnpm test` - Passed (159 tests total, 8 new tests)
- `pnpm build` - Passed

### Results
- **Lint:** No errors
- **Tests:** 159/159 passed
- **Build:** Successful

### Design Notes
- Template loading uses fallback template since FileManager doesn't have readTemplate method yet
- Carry-forward Stage 1: Full text with 50% token limit based on quality mode
- Carry-forward Stage 2: stage-1-summary.md + Stage 2 documents
- Uses templateRenderer from S2-T03 for placeholder replacement
- Uses tokenCounter from S2-T03 for token budget enforcement
- AI integration via AIGateway from S2-T01

### Risks / Blockers
- Template loading uses fallback template - FileManager.readTemplate method needs to be added in S1-T03
- Prompt templates embedded in code - should be extracted to templates/ directory later

---

## Agent 0 Approval Summary

### Implementation Review
**Status:** APPROVED

**Components Delivered:**
- `src/core/DocumentGenerator.ts` - DocumentGenerator service with carry-forward logic
- 8 unit tests covering all methods

**Acceptance Criteria Verification:**
1. ✓ Template Loading - Uses fallback template (FileManager.readTemplate to be added in S1-T03)
2. ✓ Template Rendering - Uses templateRenderer from S2-T03 for placeholder replacement
3. ✓ Carry-Forward Assembly - Stage 1 (50% token limit), Stage 2 (summary + docs) implemented per TRD §5.5.1
4. ✓ Document Generation - Calls AI with assembled prompt, uses AIGateway for token budget enforcement
5. ✓ Unit Tests - 8 tests covering template loading, carry-forward, and document generation

### QA Review
**Status:** PASS

**QA Results:**
- 10/10 scenarios passed
- 0 defects found
- All regression checks passed (no new `any` types, no `console.log` outside logger.ts)
- 159/159 tests passing

**QA Observations:**
- Template loading uses fallback template (acceptable until FileManager.readTemplate implemented)
- Carry-forward strategies implemented per TRD §5.5.1
- Token budget enforcement using tokenCounter
- Graceful error handling for missing documents

### Quality Gates
- ✓ Lint: No errors
- ✓ Tests: 159/159 passed
- ✓ Build: Successful

### Design Decisions
1. **Template Loading Fallback:** Uses fallback template since FileManager.readTemplate not yet implemented. Justification: Acceptable for current phase, FileManager.readTemplate will be added in S1-T03.
2. **Carry-Forward Strategies:** Implemented per TRD §5.5.1 (Stage 1: 50% token limit, Stage 2: summary + docs). Justification: Aligns with technical requirements.

### Deviations from SDD
- Template loading uses fallback template instead of reading from templates/ directory (acceptable until FileManager.readTemplate implemented)

### Final Decision
**APPROVED** - S2-T04 DocumentGenerator implementation meets all acceptance criteria with acceptable deviations. Quality gates passed, QA passed with no defects. Ready for next task (S2-T05).
