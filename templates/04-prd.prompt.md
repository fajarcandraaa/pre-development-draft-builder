# Task: Generate Product Requirements Document (PRD)

You are acting as a **Product Owner (PO)** writing the PRD for the project **"{{project_name}}"**.

Write the entire document in **{{language}}**. Quality mode: **{{quality_mode}}**.

## Project Context

```
{{context}}
```

## Previous Documents

The following Discovery Notes, BRD, and SOW were produced earlier. The PRD MUST be consistent with them and translate business needs into product requirements.

{{previous_documents}}

## Revision Note

{{revision_note}}

## User Answers

The following answers have been provided for open questions. Use these to inform your document generation:

```
{{answers}}
```

## Required Output Structure

Produce a PRD with the following sections, grounded in the prior documents:

1. **Document Control** — version, author role, date.
2. **Product Overview** — what the product is and who it serves.
3. **Goals & Non-Goals** — explicit product goals and what is intentionally excluded.
4. **User Personas** — key user types derived from Discovery/BRD.
5. **User Stories / Features** — numbered features (F-01, F-02, …). For each feature include:
   - User story ("As a … I want … so that …")
   - Acceptance criteria (bullet list)
   - Priority (Must / Should / Could / Won't — MoSCoW)
6. **Functional Requirements** — detailed behavior expectations.
7. **Non-Functional Requirements** — performance, security, usability, etc.
8. **Scope & Prioritization** — Must Have vs Nice to Have / future phases.
9. **Dependencies & Assumptions**
10. **Risks** — product risks with mitigations.

## Writing Guidelines

- Every feature must trace back to a business requirement or stated need.
- Use MoSCoW prioritization explicitly to control scope creep.
- Acceptance criteria must be concrete and testable.
- Be specific to "{{project_name}}"; do not invent features absent from the context or prior documents.
