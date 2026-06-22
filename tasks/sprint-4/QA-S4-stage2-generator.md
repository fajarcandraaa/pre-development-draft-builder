# Sprint 4 QA Task: Stage 2 Generator

## Task Description

QA validation of Sprint 4 implementation: Stage 2 Generator components.

## Reference Documents

- docs/09-task-breakdown.md (Sprint 4 definition and done criteria)
- docs/08-sdd.md (module design specifications)
- tasks/sprint-4/DEV-S4-T01-stage2-templates.md
- tasks/sprint-4/DEV-S4-T02-carryforward.md
- tasks/sprint-4/DEV-S4-T04-stale.md
- tasks/sprint-4/DEV-S4-T05-pipeline.md

## Components to Validate

### 1. Stage 2 Prompt Templates (Task 1)
**Files:**
- templates/05-uiux-flow.prompt.md
- templates/06-srs.prompt.md
- templates/07-trd.prompt.md
- templates/08-sdd.prompt.md
- templates/09-task-breakdown.prompt.md

**Validation:**
- All templates follow Stage 1 template structure
- All templates include required placeholders: project_name, language, quality_mode, context, previous_documents, revision_note
- Templates reference corresponding document specifications from docs/
- Task Breakdown template emphasizes sprint/iteration level (not individual tasks)
- Templates load correctly with DocumentGenerator.loadTemplate()

### 2. Stage 2 Carry-Forward Strategy (Task 2)
**File:**
- src/core/DocumentGenerator.ts (assembleStage2CarryForward method)

**Validation:**
- Reads stage-1-summary.md if available
- Gracefully handles missing summary file
- Includes full text of previous Stage 2 documents
- Filters to include only Stage 2 documents (stage === 2)

### 3. FinalReview Orchestration (Task 3)
**File:**
- src/core/FinalReview.ts

**Validation:**
- run() method collects document summaries and quality gate results
- saveReport() method saves report to reviews/final-quality-review.md
- JSON parsing with fallback for AI response
- Markdown report formatting with recommendation display
- Correct imports (ProjectState from schemas.js)

### 4. Stale Detection (Task 4)
**Files:**
- src/core/DocumentPipeline.ts (getStaleDocuments, regenerateDocument methods)
- src/core/StateManager.ts (revokeStage1Approval method)

**Validation:**
- getStaleDocuments() returns documents with status 'stale'
- generateNext() checks for stale documents before pending
- regenerateDocument() regenerates stale document with quality gate
- Rolls back to 'stale' on error
- revokeStage1Approval() marks Stage 2 documents as stale

### 5. DocumentPipeline Stage 2 Extension (Task 5)
**File:**
- src/core/DocumentPipeline.ts

**Validation:**
- Stage 1 approval validation for Stage 2 documents
- Blocks generation with informative error if Stage 1 not approved
- DOCUMENT_REGISTRY includes all Stage 2 documents with correct order

### 6. Integration Tests (Task 6)
**File:**
- tests/integration/stage-2-pipeline.test.ts

**Validation:**
- Tests Stage 2 document generation in correct order
- Tests Stage 1 approval validation
- Tests stale detection and regeneration
- Tests Final Review execution
- Tests full pipeline end-to-end
- Proper setup of ProviderRegistryService and ProviderStore
- Uses temporary config path for testing

## Sprint 4 Done Criteria

From docs/09-task-breakdown.md:
- [ ] docbuilder generate after approve stage-1 generates UI/UX Flow → SRS → TRD → SDD → Task Breakdown in order
- [ ] Each Stage 2 document has coherent Quality Gate report
- [ ] Task Breakdown produces sprint plan per iteration (not individual tasks)
- [ ] final-quality-review.md generated after Task Breakdown with recommendation
- [ ] Stale detection functions: regenerate Stage 1 after approval → Stage 2 documents become stale
- [ ] docbuilder status displays stale status for affected Stage 2 documents
- [ ] docbuilder generate blocked with informative message if Stage 1 not approved
- [ ] Integration test Stage 2 with MockProvider: all 5 documents generated without error
- [ ] Full pipeline (Stage 1 + Stage 2) runs end-to-end with MockProvider without error

## QA Test Scenarios

1. **Template Loading Test**: Verify all 5 Stage 2 templates load without error
2. **Carry-Forward Test**: Verify assembleStage2CarryForward reads summary and Stage 2 docs
3. **FinalReview Test**: Verify FinalReview.run() executes and saves report
4. **Stale Detection Test**: Verify stale documents are detected and regenerated
5. **Stage 2 Block Test**: Verify Stage 2 generation blocked when Stage 1 not approved
6. **Integration Test**: Run stage-2-pipeline.test.ts and verify all tests pass

## Expected QA Output

Provide QA result with:
- PASS: All criteria met, ready for Agent 0 approval
- PASS WITH RISK: Minor issues found but acceptable
- FAIL: Critical issues found, requires revision

Include:
- List of validated components
- Any issues found with severity (critical/high/medium/low)
- Recommendations for fixes if needed
