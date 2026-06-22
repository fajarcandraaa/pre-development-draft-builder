# Adjustment: Automatic Question Prompt UX Improvement

## Status: ASSIGNED TO AGENT 1

## Problem

The automatic question prompting feature generates too many questions at once and repeats similar questions across multiple documents in Stage 1. This creates a poor user experience.

### Root Causes
1. `QuestionExtractor` prompt is too broad — asks AI to extract ALL questions including vague assumptions and unclear statements
2. `DocumentPipeline.promptForAnswers()` triggers after every Stage 1 document with no global cap
3. No hard limit on total questions across an entire pipeline run
4. `QuestionPrompter` has no safety cap on how many questions it presents per session

## Acceptance Criteria

1. At most **5 questions extracted per document** (down from unbounded)
2. At most **10 questions asked across the entire Stage 1 pipeline run** (global cap)
3. Questions are **critical and essential only** — not generic assumptions or obvious clarifications
4. No questions are repeated (existing dedup must still work)
5. Prompting is **skipped silently** when global cap is reached
6. All existing tests continue to pass

## Files to Modify

- `src/core/QuestionExtractor.ts` — tighter system prompt, `maxQuestions` parameter, hard cap after dedup
- `src/core/DocumentPipeline.ts` — global session cap (10 total), pass remaining slots to extractor
- `src/core/QuestionPrompter.ts` — safety cap in `promptForAnswersWithSkip`

## Files to Create

- `tests/unit/core/QuestionExtractor.test.ts` — unit tests for extraction limits and prompt filtering
- `tests/unit/core/QuestionPrompter.test.ts` — unit tests for safety cap

## Implementation Notes

### `QuestionExtractor.ts`
- Add `maxQuestions: number = 5` parameter to `extractQuestions()`
- Revise system prompt: only extract truly critical questions that cannot be inferred
- Revise extraction prompt: remove "unclear statements" and "assumptions" categories; keep only explicit questions and missing critical info; add explicit cap instruction
- After dedup, apply `deduped.slice(0, maxQuestions)` as hard cap

### `DocumentPipeline.ts`
- Add `GLOBAL_QUESTION_CAP = 10` constant
- In `promptForAnswers()`, read `askedQuestions` count from state BEFORE calling extractor
- If `askedQuestions.length >= GLOBAL_QUESTION_CAP` → return early (skip silently)
- Compute `remainingSlots = GLOBAL_QUESTION_CAP - askedQuestions.length` and pass as `maxQuestions` to `extractQuestions()`

### `QuestionPrompter.ts`
- Add `MAX_QUESTIONS_PER_SESSION = 10` constant as safety backstop
- In `promptForAnswersWithSkip()`, slice `newQuestions` to `MAX_QUESTIONS_PER_SESSION` before iterating

## QA Task

After implementation, Agent 2 will verify:
- Build passes
- All existing unit tests pass
- New unit tests pass
- Global cap logic is correctly tested
- Extraction prompt is verifiably stricter
