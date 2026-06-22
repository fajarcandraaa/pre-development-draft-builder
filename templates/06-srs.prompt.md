# Task: Generate Software Requirements Specification (SRS)

You are acting as a **System Analyst** defining the complete system requirements for the project **"{{project_name}}"**.

Write the entire document in **{{language}}**. Quality mode: **{{quality_mode}}**. Platform: **{{platform}}**.

## Project Context

The following is the project brief / context. Base every statement strictly on this material — extract the real problem, do not invent unrelated requirements.

```
{{context}}
```

## Previous Documents

{{previous_documents}}

## Revision Note

{{revision_note}}

## User Answers

The following answers have been provided for open questions. Use these to inform your document generation:

```
{{answers}}
```

## Platform Information

The target platform for this project is: **{{platform}}**.

- If platform is **web**: Define web application requirements (browser compatibility, responsive design, web technologies)
- If platform is **mobile**: Define mobile app requirements (touch interface, mobile OS compatibility, app store deployment)
- If platform is **desktop**: Define desktop application requirements (native UI, OS compatibility, installation)
- If platform is **cli**: Define CLI requirements (command syntax, terminal compatibility, output formats)
- If platform is **api**: Define API requirements (endpoints, authentication, rate limiting, documentation)

## Required Output Structure

Produce an SRS document with the following sections. Every section must contain specific, project-grounded content — never generic boilerplate or placeholders:

1. **Executive Summary / Overview** — what the SRS defines (functional, non-functional, behavior specifications).
2. **Background / Context** — which documents this is based on (PRD, UI/UX Flow) and any new decisions confirmed.
3. **Objective** — goals of the SRS (define functional/non-functional requirements, behavior specs, data structures).
4. **Scope** — what this SRS covers (Must Have and Should Have features, precise behavior specs) and what it does NOT cover (architecture decisions, AI provider implementation).
5. **Functional Requirements (FR-01 to FR-15)**
   - FR-01: Project Initialization (directory structure, slug conversion, state.json structure)
   - FR-02: Input Brief (text/file methods, raw-brief.md storage)
   - FR-03: Interactive Mode (brief evaluation, max 5 questions, clarification log)
   - FR-04: Context Building (context.md structure, placeholders for unknowns)
   - FR-05: Planning Generation (initiate-planning.md, estimation, confirmation)
   - FR-06: Document Generation (sequential order, role personas, carry-forward strategy)
   - FR-07: Quality Gate (automatic execution, rubrics, confidence scoring, report format)
   - FR-08: Approval Gate Stage 1 (validation, required decisions, approval state)
   - FR-09: Document Regeneration (version archiving, approval revocation, stale detection)
   - FR-10: Final Review (automatic execution, input data, output format)
   - FR-11: State Management (atomic write, valid transitions, recovery from hanging state)
   - FR-12: Platform-Specific Requirements (based on {{platform}}: web/mobile/desktop/cli/api)
   - FR-13: Quality Mode Behavior (fast-draft, balanced, deep-analysis comparison table)
   - FR-14: Document Versioning (version file format, version list display)
   - FR-15: Task Breakdown Specification (sprint/iteration level, not individual tasks)
6. **Non-Functional Requirements (NFR-01 to NFR-05)**
   - NFR-01: Performance (response times, progress indicator timing)
   - NFR-02: Reliability (graceful interrupt, API failure handling, atomic write)
   - NFR-03: Security & Privacy (API key from env var, no telemetry, local storage)
   - NFR-04: Maintainability (registry separation, AI Gateway interface, template files, TypeScript)
   - NFR-05: Usability (platform-specific usability: CLI language/web UX/mobile gestures)
7. **Data Structures & File Formats**
   - File naming conventions for documents
   - Version naming format
   - Document slug names for CLI commands
8. **Assumptions** — assumptions about AI provider context windows, prompt templates, environment variables.
9. **Constraints** — language cannot change after init, sequential pipeline, Interactive Mode max 5 questions, state.json as single source of truth.
10. **Risks** — context window overflow in Stage 2, confidence score variability, atomic write failure.
11. **Quality Gate Review** — completeness, consistency, risk/gap check, questions for user, recommendation.

## Writing Guidelines

- Be specific to "{{project_name}}". Reference concrete requirements, parameters, and behaviors from the context.
- Define requirements appropriate for the **{{platform}}** platform.
- Use precise, implementable language — this document becomes the basis for TRD and SDD.
- Include concrete data structures (JSON schemas) where specified.
- Use tables for comparisons (quality modes, command parameters).
- Ensure every functional requirement has clear acceptance criteria.
