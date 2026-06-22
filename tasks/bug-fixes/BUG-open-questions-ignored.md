# Bug: Open Questions Ignored in Document Generation

## Issue Description

Founder reported that open questions in documents are not being handled correctly:

**Current Behavior:**
1. Open questions are included in generated documents
2. When user answers them, the answers are not carried forward
3. The next document still shows the same open questions
4. Answers are ignored in subsequent document generation

**Desired Behavior:**
1. Open questions should be interactive prompts (not included in documents)
2. User answers should be stored and used as context for generating subsequent documents
3. The "Open Question" section should not appear in the documents themselves
4. Answers should be carried forward through the document pipeline

## Root Cause

The current implementation:
- Includes "Open Question" sections in document templates
- Does not have a mechanism to capture and store user answers
- Does not pass answers to subsequent document generation
- AI generates the same open questions in each document

## Requirements

1. **Interactive Question System**
   - Create an interactive question system that prompts users for open question answers
   - Questions should be asked after document generation (or before next document)
   - Use the existing prompt library (oclif's `input`, `confirm`, `select`)

2. **Answer Storage**
   - Store user answers in state.json or a separate answers file
   - Associate answers with the document they relate to
   - Track which questions have been answered

3. **Context Integration**
   - Include answered questions in the generation context for subsequent documents
   - Pass answers to the AI as part of the prompt context
   - Ensure AI uses the answers to avoid repeating questions

4. **Template Updates**
   - Remove "Open Question" sections from document templates
   - Update templates to use answered questions as context instead
   - Ensure documents don't include the questions themselves

5. **Pipeline Integration**
   - Integrate question prompting into the document pipeline
   - Prompt for answers after each document generation
   - Or prompt for answers before generating the next document

## Implementation Notes

- Need to decide when to prompt for answers (after generation or before next generation)
- Need to define the schema for storing answers in state.json
- Need to update ContextBuilder to include answered questions
- Need to update all document templates to remove open question sections
- Need to ensure backward compatibility with existing projects

## Files to Modify

1. `src/storage/schemas.ts` - Add answers schema to ProjectState
2. `src/core/StateManager.ts` - Add methods to manage answers
3. `src/core/ContextBuilder.ts` - Include answered questions in context
4. `src/core/DocumentPipeline.ts` - Integrate question prompting
5. All document templates - Remove "Open Question" sections

## Acceptance Criteria

- Open questions are not included in generated documents
- Users are prompted interactively for open question answers
- Answers are stored in state.json
- Answers are used as context for subsequent document generation
- Subsequent documents do not repeat the same questions
- Backward compatibility maintained

## Test Scenarios

1. Generate document with open questions
2. Answer the questions interactively
3. Generate next document
4. Verify answers are used (no repeated questions)
5. Verify answers are stored in state.json
