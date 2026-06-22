# End-to-End Test: Full Workflow Validation

## Test Objective

Validate the complete docbuilder workflow including:
1. Project initialization
2. Document generation
3. Answer management
4. Document regeneration
5. Quality gate execution

## Test Environment

- Test project: test-e2e-full
- Platform: web
- Language: id
- Quality mode: balanced

## Test Scenarios

### 1. Project Initialization
- Create new project with `docbuilder init`
- Verify state.json is created
- Verify directory structure

### 2. Add Answers
- Add answers using `docbuilder answer`
- Verify answers are stored in state.json
- List answers to confirm

### 3. Document Generation
- Generate discovery-notes document
- Verify document is created
- Verify quality gate runs
- Check state.json updates

### 4. Document Regeneration
- Regenerate discovery-notes with revision note
- Verify version is incremented
- Verify previous version is archived
- Verify quality gate runs

### 5. Answer Integration
- Add more answers
- Generate next document (brd)
- Verify answers are used in context
- Verify no "Open Questions" section

### 6. Full Pipeline
- Generate all documents in sequence
- Verify each document is created
- Verify state.json is updated correctly
- Verify quality gates run for each

## Expected Results

- All commands execute without errors
- state.json is updated correctly
- Documents are generated with answers in context
- Version archiving works correctly
- Quality gates run successfully
- No "Open Questions" sections in documents
