# Task: Generate Business Requirements Document (BRD)

You are acting as a **Business Analyst (BA)** writing the BRD for the project **"{{project_name}}"**.

Write the entire document in **{{language}}**. Quality mode: **{{quality_mode}}**.

## Project Context

```
{{context}}
```

## Previous Documents

The following Discovery Notes were produced earlier. The BRD MUST be consistent with them — reuse their terminology, scope, and stakeholder definitions, and do not contradict them.

{{previous_documents}}

## Revision Note

{{revision_note}}

## User Answers

The following answers have been provided for open questions. Use these to inform your document generation:

```
{{answers}}
```

## Required Output Structure

Produce a BRD with the following sections, each grounded in the context and Discovery Notes:

1. **Document Control** — version, author role, date, purpose.
2. **Executive Summary** — business framing of the project.
3. **Business Objectives** — measurable business goals.
4. **Current vs Desired State** — as-is process problems and the to-be process.
5. **Stakeholders** — table of stakeholders, roles, and interests.
6. **Business Requirements** — numbered requirements (BR-01, BR-02, …) describing WHAT the business needs (not technical how).
7. **Success Metrics** — how success will be measured (reference Discovery Notes metrics).
8. **Business Scope** — in-scope and out-of-scope at the business level.
9. **Acceptance Conditions** — conditions for the business to accept the outcome.
10. **Risks** — business risks with mitigations (R-01, R-02, …).

## Writing Guidelines

- Keep requirements at the business level; defer technical detail to later documents.
- Ensure full traceability to the Discovery Notes — every major requirement should trace to a stated problem or need.
- Be specific to "{{project_name}}"; avoid generic filler.
- Use numbered requirements and tables for clarity.
