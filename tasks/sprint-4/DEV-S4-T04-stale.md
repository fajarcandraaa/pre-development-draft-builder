# Sprint 4 Task 4: Implement Stale Detection

## Task Description

Implement stale detection logic and handling in DocumentPipeline and status command.

## Reference Documents

- docs/09-task-breakdown.md (Sprint 4, stale detection requirements)
- docs/08-sdd.md (section 6.2: StateManager)
- src/core/StateManager.ts (existing implementation)

## Implementation Requirements

According to Task Breakdown Sprint 4:
- Stale detection: `StateManager.revokeStage1Approval()` + update status dokumen Stage 2 ke `stale`
- Penanganan dokumen `stale` di `docbuilder generate` dan `docbuilder status`

## Implementation Status

**StateManager.revokeStage1Approval()** (lines 115-127) already implements:
- Revokes Stage 1 approval (sets `stage1Approved: false`)
- Marks specified Stage 2 documents as `stale`
- Validates state transition `generated → stale`

**DocumentPipeline.generateNext()** (lines 84-97) now implements:
- Checks for stale documents before processing pending documents
- Regenerates all stale documents automatically
- Refreshes state and recursively processes next document

**DocumentPipeline.regenerateDocument()** (lines 168-224) implements:
- Regenerates a single stale document
- Runs quality gate on regenerated document
- Rolls back to `stale` on error

**Status command** (src/commands/status.ts lines 34-43) already implements:
- Displays status field directly from state.json
- Will display "stale" for documents with that status

## Acceptance Criteria

1. ✅ `StateManager.revokeStage1Approval()` correctly marks Stage 2 documents as stale
2. ✅ `docbuilder generate` detects stale documents and regenerates them
3. ✅ `docbuilder status` displays `stale` status for affected documents
4. ✅ Stale documents can be regenerated to become `generated` again

## Implementation Completed

1. ✅ Added `getStaleDocuments()` helper method to DocumentPipeline
2. ✅ Modified `generateNext()` to check for stale documents first
3. ✅ Added `regenerateDocument()` method to handle stale document regeneration
4. ✅ Status command already displays stale status correctly
