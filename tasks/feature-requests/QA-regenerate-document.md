# QA Task: Regenerate Document Functionality

## Task Description

Validate the implementation of the `docbuilder regenerate` command, which allows regenerating specific documents with optional revision notes.

## Implementation Summary

**Change:** Implemented the regenerate functionality in `DocumentPipeline` and updated the `regenerate` command to call it.

**Implementation:**
1. Added `regenerate` method to `DocumentPipeline` class
2. Added `revisionNote` to `GenerateOptions` interface
3. Updated `buildGenerationContext` to use revision note
4. Updated `regenerate` command to call `pipeline.regenerate()`
5. Version archiving to `versions/` directory
6. Document version increment in state.json
7. Quality gate runs after regeneration

## Components to Validate

1. **Regenerate Command**
   - Verify `docbuilder regenerate <document>` regenerates the specified document
   - Verify `docbuilder regenerate <document> --note "revision note"` includes the note
   - Verify error handling for invalid document names
   - Verify error handling for non-existent projects

2. **Version Management**
   - Verify current version is archived to `versions/` directory
   - Verify document version is incremented in state.json
   - Verify timestamp is updated in state.json

3. **Quality Gate**
   - Verify quality gate runs after regeneration
   - Verify confidence is updated in state.json
   - Verify quality gate report is saved

4. **Error Handling**
   - Verify error when regenerating non-generated document
   - Verify error when regenerating invalid document ID
   - Verify rollback to 'generated' status on error

## Test Scenarios

1. **Regenerate Stage 1 document**
   - Run `docbuilder regenerate brd`
   - Verify document is regenerated
   - Verify version increment
   - Verify version archived

2. **Regenerate Stage 2 document**
   - Run `docbuilder regenerate srs`
   - Verify document is regenerated
   - Verify version increment
   - Verify version archived

3. **Regenerate with revision note**
   - Run `docbuilder regenerate brd --note "expand stakeholder section"`
   - Verify revision note is included
   - Verify document is regenerated

4. **Regenerate invalid document**
   - Run `docbuilder regenerate invalid-doc`
   - Verify error message appears

5. **Regenerate non-generated document**
   - Run `docbuilder regenerate <pending-doc>`
   - Verify error message appears

6. **Verify version archiving**
   - Check `versions/` directory for archived file
   - Verify filename format: `<docId>-v<version>-<timestamp>.md`

## Done Criteria

- Regenerate command works for all document types
- Version archiving works correctly
- Version increment works correctly
- Quality gate runs after regeneration
- Error handling is appropriate
- All test scenarios pass

## Expected QA Output

1. Test results for each scenario
2. Verification of each component
3. Any issues found
4. Recommendation (PASS, PASS WITH RISK, FAIL)
