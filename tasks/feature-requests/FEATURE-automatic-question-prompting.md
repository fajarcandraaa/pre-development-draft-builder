# Feature: Automatic Question Prompting

## Objective

Automatically extract questions from generated documents and prompt users for answers interactively, storing them in state.json for use in subsequent document generation.

## Current State

- "Open Questions" sections removed from templates
- Manual answer management via `docbuilder answer` command
- Answers stored in state.json and used in generation context
- No automatic question extraction or prompting

## Proposed Solution

### 1. Question Extraction

**Approach:** Use AI to extract questions from generated documents

**Implementation:**
- Create a QuestionExtractor service
- Use AI to parse document content and identify questions
- Return list of questions found in the document

**Prompt Strategy:**
```
Analyze the following document and extract all questions that need to be answered.
Return as JSON array of question strings.
```

### 2. Interactive Prompting

**Approach:** Use inquirer/prompts (already used in init.ts)

**Implementation:**
- Create a QuestionPrompter service
- After document generation, check for questions
- If questions found, prompt user for each answer
- Store answers in state.json

**User Experience:**
```
✓ Document generated successfully.
ℹ Found 2 questions in the document:
? What is the timeline? [input]
? Who are the stakeholders? [input]
✓ Answers saved.
```

### 3. Pipeline Integration

**Approach:** Add optional prompting step to DocumentPipeline

**Implementation:**
- Add `promptForAnswers` flag to GenerateOptions
- After document generation, call QuestionPrompter
- Only prompt if questions are found
- Make it configurable (default: true for Stage 1, false for Stage 2)

**Configuration:**
- Can be disabled via flag: `docbuilder generate --no-prompt`
- Default behavior: prompt after Stage 1 documents
- Stage 2: don't prompt (answers already provided)

## Implementation Plan

### Phase 1: Question Extraction
1. Create `src/core/QuestionExtractor.ts`
2. Implement AI-based question extraction
3. Add unit tests

### Phase 2: Interactive Prompting
1. Create `src/core/QuestionPrompter.ts`
2. Implement interactive prompting using inquirer/prompts
3. Add unit tests

### Phase 3: Pipeline Integration
1. Update `src/core/DocumentPipeline.ts`
2. Add prompting step after document generation
3. Add `--no-prompt` flag to generate command
4. Add integration tests

## Files to Create

- `src/core/QuestionExtractor.ts` - Extract questions from documents
- `src/core/QuestionPrompter.ts` - Interactive prompting service

## Files to Modify

- `src/core/DocumentPipeline.ts` - Add prompting step
- `src/commands/generate.ts` - Add `--no-prompt` flag
- `src/core/DocumentGenerator.ts` - May need updates for context

## Acceptance Criteria

1. Questions are automatically extracted from generated documents
2. Users are prompted for answers after document generation
3. Answers are stored in state.json
4. Answers are used in subsequent document generation
5. Prompting can be disabled via `--no-prompt` flag
6. No questions section appears in generated documents
7. Works for all document types

## Test Scenarios

1. Generate document with questions → prompt for answers
2. Generate document without questions → no prompting
3. Generate with `--no-prompt` → no prompting
4. Answers stored correctly in state.json
5. Answers used in next document generation
