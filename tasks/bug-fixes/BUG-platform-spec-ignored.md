# Bug Fix: Platform Specification Ignored in Stage 2 Documents

## Bug Description

Stage 2 documents (UI/UX Flow, SRS, TRD, SDD, Task Breakdown) ignore the platform specification from the brief and default to CLI-based interface, even when the brief explicitly specifies "berbasis website" (web-based).

## Evidence

**Brief Input:**
"Saya ingin membuat aplikasi kasir (POS) sederhana untuk toko kelontong saya berbasis website."

**Generated UI/UX Flow (line 7):**
"Fokus utama adalah mendesain alur pengguna berbasis _command line interface (CLI)_"

**Generated SRS (line 22):**
"Dokumen ini didasarkan pada **UI/UX Flow** yang telah disusun sebelumnya, yang memberikan gambaran rinci tentang alur interaksi berbasis _command line interface (CLI)_"

## Root Cause

The prompt templates or AI generation logic are not respecting the platform specification from the brief. The system defaults to CLI-based interface regardless of the platform specified in the brief.

## Requirements

### Approach 1: Platform Clarification in Init Command (Preferred)
1. Add `--platform` flag to `docbuilder init` command with options: web, mobile, desktop, cli, api
2. If platform is not specified via flag and not found in brief, prompt user to select platform
3. Store platform in state.json
4. Pass platform to prompt templates for Stage 2 documents
5. Update Stage 2 prompt templates to use platform specification

### Approach 2: Extract from Brief (Fallback)
1. Investigate prompt templates for Stage 2 documents (05-uiux-flow.prompt.md, 06-srs.prompt.md, 07-trd.prompt.md, 08-sdd.prompt.md, 09-task-breakdown.prompt.md)
2. Ensure platform specification (web-based, mobile, desktop, CLI) is extracted from the brief
3. Update prompt templates to respect the platform specification

## Expected Behavior

- When `--platform web` is specified, Stage 2 documents should recommend web-based interface
- When brief specifies "berbasis website" or "web-based", Stage 2 documents should recommend web-based interface
- When brief specifies "berbasis CLI" or "command line", Stage 2 documents should recommend CLI-based interface
- When no platform is specified, system should ask for clarification during init

## Test Cases

1. `docbuilder init --platform web` → Web-based interface in Stage 2 documents
2. Brief with "berbasis website" → Web-based interface in Stage 2 documents
3. Brief with "web-based" → Web-based interface in Stage 2 documents
4. Brief with "berbasis CLI" → CLI-based interface in Stage 2 documents
5. Brief with "command line" → CLI-based interface in Stage 2 documents
6. Brief without platform specification and no flag → System prompts for platform selection

## Success Criteria

- Platform specification is captured during init via flag or prompt
- Platform is stored in state.json
- Stage 2 documents respect the platform specification
- Web-based platform produces web-based interface recommendations
- CLI-based platform produces CLI-based interface recommendations
