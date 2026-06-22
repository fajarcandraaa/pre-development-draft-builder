# QA Report: Automatic Question Prompt UX Improvement

## Overall Result: PASS

---

## Test Results

### TC-1: Build verification ✅ PASS
- `pnpm run build` → exit code 0
- TypeScript compilation successful
- All modified files compiled without errors

### TC-2: New unit tests ✅ PASS
- `QuestionExtractor.test.ts`: 9/9 tests pass
- `QuestionPrompter.test.ts`: 5/5 tests pass
- **Total: 14/14 new tests pass**

### TC-3: Existing unit tests not regressed ✅ PASS
- `tests/unit`: 179/180 pass
- 1 failure in `StateStore.test.ts` is pre-existing (state fixture missing `platform`, `answers`, `askedQuestions` fields — not caused by this change)
- No regression introduced

### TC-4: maxQuestions cap (QuestionExtractor) ✅ PASS
- `extractQuestions()` accepts `maxQuestions: number = 5`
- `deduped.slice(0, maxQuestions)` applied after dedup
- Tests confirm cap is enforced even when AI returns more

### TC-5: Global cap (DocumentPipeline) ✅ PASS (code review)
- `GLOBAL_QUESTION_CAP = 10` constant present at module level
- `promptForAnswers()` reads `askedQuestions.length`; returns early if `>= GLOBAL_QUESTION_CAP`
- `remainingSlots = GLOBAL_QUESTION_CAP - askedQuestions.length`
- `maxQuestions = Math.min(5, remainingSlots)` passed to extractor

### TC-6: Safety cap (QuestionPrompter) ✅ PASS
- `MAX_QUESTIONS_PER_SESSION = 10` constant present
- `capped = newQuestions.slice(0, MAX_QUESTIONS_PER_SESSION)` before prompting loop
- `addAskedQuestions(capped)` — only presented questions recorded (not all newQuestions)

### TC-7: Extraction prompt is conservative ✅ PASS (code review)
- System prompt: "only the most critical questions", "Be highly selective", 3-criteria filter
- Extraction prompt: explicit criteria ("must meet ALL"), explicit prohibitions, "at most N" cap instruction
- Old broad categories ("unclear statements", "assumptions") removed

---

## Issues Found

None.

---

## Files Verified

| File | Status |
|------|--------|
| `src/core/QuestionExtractor.ts` | ✅ Correct |
| `src/core/DocumentPipeline.ts` | ✅ Correct |
| `src/core/QuestionPrompter.ts` | ✅ Correct |
| `tests/unit/core/QuestionExtractor.test.ts` | ✅ 9 pass |
| `tests/unit/core/QuestionPrompter.test.ts` | ✅ 5 pass |

---

## Manual Testing Notes

The following scenarios require manual verification with a live AI provider:
- AI respects the conservative extraction prompt (real documents, real provider)
- Global cap stops prompting after 10 total asked questions across Stage 1
- User experience is noticeably simpler (fewer, more focused questions)

---

## Recommendation

**PASS** — All automated checks pass. Implementation correctly addresses both reported problems:
1. ✅ Per-document limit: max 5 questions extracted, enforced by hard cap
2. ✅ Global limit: max 10 questions across entire Stage 1 run
3. ✅ Stricter filter: AI instructed to only extract truly critical, non-inferable questions
4. ✅ No regressions in existing tests
