# Sprint 4 Task 2: Implement Stage 2 Carry-Forward Strategy

## Task Description

Implement Stage 2 carry-forward strategy in DocumentGenerator to inject `stage-1-summary.md` + full text of previous Stage 2 documents.

## Reference Documents

- docs/07-trd.md (section 5.5: Context Carry-Forward & Token Management)
- docs/08-sdd.md (section 6.2: DocumentGenerator)
- src/core/DocumentGenerator.ts (existing implementation)

## Implementation Requirements

According to TRD 5.5.1:

**Stage 2 Strategy:**
- Stage 1 is summarized into one "Stage 1 Summary" generated after Stage 1 approval
- Stored in `planning/stage-1-summary.md`
- Each Stage 2 document receives: `stage-1-summary.md` + full text of previous Stage 2 documents
- Stage 1 summary is generated during `approve stage-1` command, not on-demand

## Current Status

The `DocumentGenerator.assembleStage2CarryForward()` method (lines 172-198) already implements this strategy:
- Reads `stage-1-summary.md` from planning directory
- Adds full text of previous Stage 2 documents

## Acceptance Criteria

1. `assembleStage2CarryForward()` reads `stage-1-summary.md` if available
2. If summary not found, continues without error (graceful degradation)
3. Previous Stage 2 documents are included with full text
4. Only Stage 2 documents are included (filters by `stage === 2`)
5. Documents are ordered correctly based on dependency chain

## Verification

- Verify the existing implementation matches TRD requirements
- Test with mock FileManager to ensure correct behavior
- Ensure graceful handling when summary file doesn't exist
