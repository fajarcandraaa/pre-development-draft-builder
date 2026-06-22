# Feature: Implement Regenerate Document Functionality

## Request

Founder requested implementation of the `docbuilder regenerate` command, which is currently a placeholder that shows "Regenerate functionality not yet fully implemented."

## Current State

The `docbuilder regenerate` command exists in `src/commands/regenerate.ts` but is a stub:
- It accepts document argument and optional --note flag
- It initializes all dependencies but doesn't actually regenerate
- It shows a warning message telling users to use `docbuilder generate` instead

## Requirements

1. Implement the regenerate functionality in `DocumentPipeline`
2. Allow regeneration of any document (discovery-notes, brd, sow, prd, uiux-flow, srs, trd, sdd, task-breakdown)
3. Support optional revision note via --note flag
4. Increment document version when regenerating
5. Keep previous version in versions/ directory
6. Update state.json with new version and timestamp
7. Run quality gate after regeneration
8. Handle dependencies (e.g., regenerating BRD should regenerate dependent documents if needed)

## Implementation Notes

- The regenerate command already initializes all necessary dependencies
- Need to add a `regenerate` method to `DocumentPipeline` class
- Should reuse existing document generation logic from `DocumentGenerator`
- Should handle versioning similar to how it's done in the pipeline
- Revision note should be included in the generation context

## Files to Modify

1. `src/core/DocumentPipeline.ts` - Add `regenerate` method
2. `src/commands/regenerate.ts` - Call the new regenerate method from DocumentPipeline
3. `src/core/DocumentGenerator.ts` - May need to support revision notes in context

## Acceptance Criteria

- `docbuilder regenerate <document>` regenerates the specified document
- `docbuilder regenerate <document> --note "revision note"` includes the note in generation
- Document version is incremented in state.json
- Previous version is saved to versions/ directory
- Quality gate runs after regeneration
- Dependent documents are handled appropriately
- Error handling for invalid document names
- Error handling for non-existent projects

## Test Scenarios

1. Regenerate a Stage 1 document (e.g., brd)
2. Regenerate a Stage 2 document (e.g., srs)
3. Regenerate with revision note
4. Regenerate invalid document name (should error)
5. Regenerate outside project directory (should error)
6. Verify version increment
7. Verify previous version saved
