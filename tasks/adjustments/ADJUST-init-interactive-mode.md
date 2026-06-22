# Adjustment: Change docbuilder init to Interactive Mode

## Founder Request

The founder wants to change the `docbuilder init` command from using long command-line flags to an interactive question-and-answer format. The current command requires typing many flags which is too long and cumbersome.

## Current Behavior

Users must type a long command:
```
docbuilder init --name "Your Project Name" --language en --mode balanced --input text --brief "Your project brief..."
```

## Desired Behavior

Users should simply run:
```
docbuilder init
```

And answer questions interactively:
1. What is your project name?
2. What language? (id/en)
3. What quality mode? (fast-draft/balanced/deep-analysis)
4. How will you provide the brief? (text/file)
5. What platform type? (web/mobile/desktop/cli/api)
6. [If text] What is your brief?
7. [If file] What is the path to your brief file?

## Requirements

1. Make all flags optional in the `docbuilder init` command
2. If a flag is not provided, prompt the user interactively for that value
3. Keep the existing flag functionality for advanced users who want to skip prompts
4. Maintain backward compatibility with existing scripts that use flags
5. Use the existing prompt library (oclif's `select`, `input`, `confirm`) for interactive prompts

## Files to Modify

- `src/commands/init.ts` - Update the init command to use interactive prompts when flags are not provided

## Implementation Notes

- The current implementation already has some interactive prompts (language, qualityMode, inputMethod, platform)
- Need to add interactive prompts for `name` and `brief` when not provided via flags
- Keep the `--yes` flag to skip all prompts for non-interactive use cases
- Ensure the prompts are user-friendly and clear

## Acceptance Criteria

- Running `docbuilder init` without any flags prompts for all required information
- Running `docbuilder init` with flags skips prompts for those flags
- Running `docbuilder init --yes` uses defaults for all prompts
- The interactive flow is intuitive and easy to follow
- Backward compatibility is maintained for existing flag-based usage
