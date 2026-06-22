# QA Task: Interactive Mode for docbuilder init

## Task Description

Validate the adjustment that changes `docbuilder init` from requiring long command-line flags to an interactive question-and-answer format.

## Adjustment Summary

**Change:** Made all flags optional in `docbuilder init` command. If flags are not provided, the user is prompted interactively. Added `--yes` flag to skip prompts and use defaults.

**Implementation:**
1. All flags are now optional
2. If flag not provided, user is prompted interactively
3. `--yes` flag skips prompts and uses defaults
4. Validation added for `--yes` with `--input=file` or `--input=text`

## Components to Validate

1. **Interactive Mode**
   - Verify `docbuilder init` without flags prompts for all required information
   - Verify prompts appear in correct order (name, language, quality mode, input method, platform, brief)
   - Verify prompts are user-friendly

2. **Flag Mode**
   - Verify `docbuilder init` with flags skips prompts for those flags
   - Verify partial flags work (some flags provided, others prompted)
   - Verify all flags together works without any prompts

3. **--yes Flag**
   - Verify `docbuilder init --yes` uses defaults for all prompts
   - Verify `--yes` with `--input=file` requires `--file` flag
   - Verify `--yes` with `--input=text` requires `--brief` flag
   - Verify error messages are clear when requirements not met

4. **Backward Compatibility**
   - Verify existing flag-based usage still works
   - Verify scripts using flags continue to work

## Test Scenarios

1. **Test without any flags**
   - Run `docbuilder init`
   - Verify all prompts appear
   - Answer prompts and verify project created

2. **Test with all flags**
   - Run `docbuilder init --name "Test" --language id --mode balanced --input text --platform web --brief "Test brief"`
   - Verify no prompts appear
   - Verify project created with correct values

3. **Test with partial flags**
   - Run `docbuilder init --name "Test" --language id`
   - Verify prompts only for missing flags
   - Verify project created with correct values

4. **Test --yes flag**
   - Run `docbuilder init --yes --brief "Test brief"`
   - Verify no prompts appear
   - Verify project created with defaults

5. **Test --yes validation**
   - Run `docbuilder init --yes --input=file` (without --file)
   - Verify error message appears
   - Run `docbuilder init --yes --input=text` (without --brief)
   - Verify error message appears

## Done Criteria

- Interactive mode works correctly without any flags
- Flag mode skips prompts for provided flags
- --yes flag uses defaults correctly
- Validation errors are clear and helpful
- Backward compatibility maintained
- All test scenarios pass

## Expected QA Output

1. Test results for each scenario
2. Verification of each component
3. Any issues found
4. Recommendation (PASS, PASS WITH RISK, FAIL)
