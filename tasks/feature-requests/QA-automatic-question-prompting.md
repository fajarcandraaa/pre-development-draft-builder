# QA Task: Automatic Question Prompting

## Task Description

Validate the implementation of automatic question prompting, which extracts questions from generated documents and prompts users for answers interactively.

## Implementation Summary

**Change:** Implemented automatic question extraction and interactive prompting.

**Implementation:**
1. Created QuestionExtractor service - AI-based question extraction from documents
2. Created QuestionPrompter service - Interactive prompting using inquirer/prompts
3. Updated DocumentPipeline - Added prompting step after document generation
4. Updated generate command - Added `--no-prompt` flag to disable prompting
5. Default behavior - Prompt after Stage 1 documents only
6. Fallback mechanism - Regex extraction if AI parsing fails

## Components to Validate

1. **QuestionExtractor Service**
   - Verify questions are extracted from documents
   - Verify AI-based extraction works
   - Verify fallback regex extraction works
   - Verify empty documents handled correctly

2. **QuestionPrompter Service**
   - Verify interactive prompting works
   - Verify answers are stored in state.json
   - Verify skip functionality works
   - Verify multiple questions handled correctly

3. **Pipeline Integration**
   - Verify prompting happens after document generation
   - Verify prompting only for Stage 1 documents
   - Verify `--no-prompt` flag disables prompting
   - Verify dry-run mode doesn't trigger prompting

4. **Answer Storage**
   - Verify answers stored in state.json
   - Verify answers used in subsequent document generation
   - Verify answers persist across sessions

## Test Scenarios

1. **Generate document with questions**
   - Generate a Stage 1 document
   - Verify questions are extracted
   - Verify user is prompted for answers
   - Verify answers stored in state.json

2. **Generate document without questions**
   - Generate a document with no questions
   - Verify no prompting occurs
   - Verify document generation completes normally

3. **Disable prompting with flag**
   - Generate with `--no-prompt` flag
   - Verify no prompting occurs
   - Verify document generation completes normally

4. **Skip questions**
   - Generate document with questions
   - Skip some questions by pressing Enter
   - Verify only answered questions stored

5. **Stage 2 documents**
   - Generate Stage 2 document
   - Verify no prompting occurs (default behavior)
   - Verify document generation completes normally

6. **Answer usage in context**
   - Add answers via prompting
   - Generate next document
   - Verify answers used in generation context

## Done Criteria

- QuestionExtractor extracts questions correctly
- QuestionPrompter prompts interactively
- Answers stored in state.json
- Prompting only for Stage 1 documents
- `--no-prompt` flag works correctly
- Answers used in subsequent document generation
- All test scenarios pass

## Expected QA Output

1. Test results for each scenario
2. Verification of each component
3. Any issues found
4. Recommendation (PASS, PASS WITH RISK, FAIL)
