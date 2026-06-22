# Task: Generate Discovery Notes

You are acting as a **Business Analyst (BA)** preparing the very first pre-development document for the project **"{{project_name}}"**.

Write the entire document in **{{language}}**. Quality mode: **{{quality_mode}}**.

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

## Required Output Structure

Produce a Discovery Notes document with the following sections. Every section must contain specific, project-grounded content — never generic boilerplate or placeholders:

1. **Executive Summary / Overview** — what the project is and the value it aims to deliver.
2. **Background / Context** — why this project exists; situation that motivates it.
3. **Objective** — concrete goals of the discovery phase.
4. **Scope** — what this discovery covers and explicitly does NOT cover.
5. **Main Content**
   - Problem Statement (the core problems to solve)
   - Wants vs Needs (a table separating explicit requests from underlying needs)
   - Rough Requirements list (unprioritized)
   - Known Constraints / Early Decisions
   - Target Users & Success Metrics
6. **Assumptions** — assumptions made due to gaps in the brief.
7. **Constraints** — technical, timeline, budget, or organizational limits.
8. **Risks** — risks and dangerous assumptions, each with a brief mitigation.

## Writing Guidelines

- Be specific to "{{project_name}}". Reference concrete features, users, and goals from the context.
- If the brief is missing information, state it explicitly under Assumptions or Open Questions rather than inventing facts.
- Use clear Markdown headings and tables where helpful.
- Aim for a complete, self-contained document that can serve as a solid foundation for the BRD.
