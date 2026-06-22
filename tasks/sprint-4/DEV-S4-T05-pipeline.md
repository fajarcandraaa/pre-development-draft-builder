# Sprint 4 Task 5: Extend DocumentPipeline for Stage 2

## Task Description

Extend DocumentPipeline to handle Stage 2 document generation with proper validation.

## Reference Documents

- docs/09-task-breakdown.md (Sprint 4, Stage 2 pipeline requirements)
- docs/08-sdd.md (section 6.4: DocumentPipeline)
- src/core/DocumentPipeline.ts (existing implementation)

## Implementation Requirements

According to Task Breakdown Sprint 4:
- `docbuilder generate` untuk Stage 2 (sudah ada command-nya, extend pipeline logic)
- Validasi bahwa `docbuilder generate` untuk Stage 2 blocked jika `stage1Approved: false`

## Implementation Status

**DocumentPipeline.generateNext()** (lines 106-108) already implements:
- Stage 1 approval validation for Stage 2 documents
- Blocks generation with informative error message if Stage 1 not approved

**DocumentPipeline.getNextPending()** (lines 42-50) already implements:
- Iterates through DOCUMENT_REGISTRY in order
- Returns next pending document regardless of stage
- Stage 2 documents (uiux-flow, srs, trd, sdd, task-breakdown) are in registry with correct order

**DOCUMENT_REGISTRY** (src/config/registry.ts) already includes:
- All 5 Stage 2 documents with correct order (5-9)
- Dependencies between Stage 2 documents
- Stage field set to 2

## Acceptance Criteria

1. ✅ `docbuilder generate` after `approve stage-1` generates UI/UX Flow → SRS → TRD → SDD → Task Breakdown in order
2. ✅ `docbuilder generate` blocked with informative message if Stage 1 not approved

## Implementation Completed

1. ✅ Stage 1 approval validation already exists in generateNext()
2. ✅ DOCUMENT_REGISTRY already includes Stage 2 documents with correct order
3. ✅ Pipeline processes documents sequentially based on registry order
4. ✅ Error message is informative: "Stage 1 must be approved before generating Stage 2 documents."

## Verification

The pipeline is already capable of generating Stage 2 documents because:
- DOCUMENT_REGISTRY includes all Stage 2 documents
- generateNext() processes documents in registry order
- Stage 1 approval validation prevents unauthorized Stage 2 generation
- Stale detection (Task 4) handles Stage 2 document regeneration
