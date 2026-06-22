<div align="center">
  <img src="project-logo.png" alt="Mindtoscreen Pre-Development Document Builder" width="50" style="vertical-align: middle;"> <span style="font-size: 20px; vertical-align: middle;">Pre-Development Document Builder</span>
</div>

AI-assisted CLI tool for generating pre-development documents using AI.

## Installation

```bash
npm install -g pre-development-draft-builder
```

Or build from source:

```bash
git clone <repository-url>
cd pre-development-documents-builder
npm install
npm run build
npm link
```

## Uninstallation

To uninstall the globally installed package:

```bash
npm uninstall -g pre-development-draft-builder
```

If you built from source and linked the package:

```bash
npm unlink -g pre-development-draft-builder
```

To remove the source build:

```bash
cd pre-development-documents-builder
npm unlink
rm -rf node_modules
```

## Setup

### 1. Configure AI Provider

The tool supports multiple AI providers. Configure one before running the pipeline:

**Using OpenAI:**
```bash
export OPENAI_API_KEY=your-api-key
docbuilder provider add openai --key your-api-key
```

**Using Anthropic:**
```bash
export ANTHROPIC_API_KEY=your-api-key
docbuilder provider add anthropic --key your-api-key
```

**Using Dinoiki:**
```bash
export DINOIKI_API_KEY=your-api-key
docbuilder provider add dinoiki --key your-api-key
```

**Check provider status:**
```bash
docbuilder provider status
```

## First Run

### 1. Initialize a Project

Run the command and answer the prompts interactively:

```bash
docbuilder init
```

You will be prompted for:
- Project name
- Document language (Indonesian/English)
- Quality mode (fast-draft/balanced/deep-analysis)
- Brief input method (text/file)
- Platform type (web/mobile/desktop/cli/api)
- Your project brief

### 2. Check Pipeline Status

```bash
cd <project-slug>
docbuilder status
```

### 3. Generate Documents

```bash
docbuilder generate
```

This will generate documents sequentially based on the pipeline order.

**Automatic Question Prompting:**
- After generating Stage 1 documents, the system will automatically extract questions and prompt you for answers
- Answers are stored in state.json and used as context for subsequent documents
- To disable automatic prompting, use `--noPrompt` flag:
  ```bash
  docbuilder generate --noPrompt
  ```

### 4. Approve Stage 1

After Stage 1 documents (Discovery Notes, BRD, SOW, PRD) are generated:

```bash
docbuilder approve stage-1
```

### 5. Generate Stage 2 Documents

After Stage 1 approval, continue generating Stage 2 documents:

```bash
docbuilder generate
```

Stage 2 includes: UI/UX Flow, SRS, TRD, SDD, Task Breakdown.

## Commands

### `docbuilder init`
Initialize a new pre-development document project.

### `docbuilder generate`
Generate the next pending document in the pipeline.

**Flags:**
- `--mode`: Quality mode override (fast-draft/balanced/deep-analysis)
- `--dryRun`: Show what would be generated without actually generating
- `--force`: Force generation even if confidence is low
- `--noPrompt`: Disable automatic question prompting after document generation

### `docbuilder status`
Show the document pipeline status for the current project.

### `docbuilder approve`
Approve a stage or document to proceed to the next phase.

### `docbuilder regenerate`
Regenerate a specific document with optional revision note.

**Usage:**
```bash
docbuilder regenerate <document-id> --note "revision note"
```

### `docbuilder review`
Review a document or quality gate report.

### `docbuilder answer`
Manage answers to open questions (stored in state.json for use in document generation).

**Usage:**
```bash
docbuilder answer --list                              # List all answers
docbuilder answer --clear                             # Clear all answers
docbuilder answer --question "Q" --answer "A"          # Add answer
docbuilder answer --question "Q"                      # Prompt for answer
```

### `docbuilder provider`
Manage AI providers (list / add / set / test / status).

## Pipeline Stages

### Stage 1
1. Discovery Notes
2. Business Requirements Document (BRD)
3. Scope of Work (SOW)
4. Product Requirements Document (PRD)

### Stage 2
5. UI/UX Flow
6. Software Requirements Specification (SRS)
7. Technical Requirements Document (TRD)
8. System Design Document (SDD)
9. Task Breakdown

## Quality Modes

- **fast-draft**: Quick generation with lower token budget (6000 tokens)
- **balanced**: Standard quality with moderate token budget (12000 tokens)
- **deep-analysis**: High quality with extensive token budget (24000 tokens)

## Troubleshooting

### Provider Not Configured
```
Error: Provider not configured
```
**Solution:** Configure a provider using `docbuilder provider add <provider> --key <api-key>`

### Stage 2 Generation Blocked
```
Error: Stage 1 not approved
```
**Solution:** Approve Stage 1 using `docbuilder approve stage-1`

### API Key Issues
```
Error: API key not found
```
**Solution:** Set environment variable or configure provider with `docbuilder provider add`

### Document Generation Failed
```
Error: Generation failed
```
**Solution:** Check provider status, verify API key, check network connection

## Project Structure

```
<project-slug>/
├── .docbuilder/
│   └── state.json          # Pipeline state
├── documents/              # Generated documents
├── input/
│   └── raw-brief.md        # Original brief
├── planning/               # Planning documents
├── reviews/                # Quality gate reports
└── versions/               # Document versions
```

## Language Support

- English (`en`)
- Indonesian (`id`)

## Development

### Build
```bash
npm run build
```

### Test
```bash
npm test
```

### Lint
```bash
npm run lint
```

## License

See LICENSE file.