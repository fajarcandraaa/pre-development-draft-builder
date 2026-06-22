# QA Task: Automatic Question Prompt UX Improvement

## Objective

Verify that the automatic question prompting feature now respects per-document and global caps, uses a stricter extraction prompt, and does not regress any existing behaviour.

## Scope

- `src/core/QuestionExtractor.ts`
- `src/core/DocumentPipeline.ts`
- `src/core/QuestionPrompter.ts`
- `tests/unit/core/QuestionExtractor.test.ts`
- `tests/unit/core/QuestionPrompter.test.ts`

## Test Scenarios

### TC-1: Build verification
- Run `pnpm run build`
- Expected: TypeScript compilation succeeds with exit code 0

### TC-2: New unit tests pass
- Run `pnpm vitest run tests/unit/core/QuestionExtractor.test.ts tests/unit/core/QuestionPrompter.test.ts`
- Expected: 14/14 tests pass

### TC-3: Existing unit tests not regressed
- Run `pnpm vitest run tests/unit`
- Expected: Same pass count as before this change (pre-existing failures in StateStore.test.ts are unrelated)

### TC-4: maxQuestions cap (QuestionExtractor)
- Verify `extractQuestions()` now accepts `maxQuestions` param (default 5)
- Verify result is sliced to `maxQuestions` after dedup
- Covered by TC-2

### TC-5: Global cap (DocumentPipeline)
- Verify `GLOBAL_QUESTION_CAP = 10` constant is present
- Verify `promptForAnswers()` reads `askedQuestions.length` and returns early if >= 10
- Verify `remainingSlots` is computed and passed to extractor as `maxQuestions`
- Code review: `src/core/DocumentPipeline.ts` lines ~392–404

### TC-6: Safety cap (QuestionPrompter)
- Verify `MAX_QUESTIONS_PER_SESSION = 10` constant is present
- Verify `capped = newQuestions.slice(0, MAX_QUESTIONS_PER_SESSION)` before prompting
- Verify `addAskedQuestions(capped)` records only presented questions
- Covered by TC-2

### TC-7: Extraction prompt is conservative
- Verify system prompt now says "only the most critical questions" and "Be highly selective"
- Verify extraction prompt lists strict criteria (must meet ALL three criteria)
- Verify "unclear statements" and "assumptions" categories removed from prompt
- Code review: `src/core/QuestionExtractor.ts` lines ~44–50 and ~86–102
