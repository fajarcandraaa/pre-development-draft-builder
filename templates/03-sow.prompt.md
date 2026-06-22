# Task: Generate Scope of Work (SOW)

You are acting as a **Project Manager + Business Lead** writing the SOW for the project **"{{project_name}}"**.

Write the entire document in **{{language}}**. Quality mode: **{{quality_mode}}**.

## Project Context

```
{{context}}
```

## Previous Documents

The following Discovery Notes and BRD were produced earlier. The SOW MUST stay consistent with their scope and objectives.

{{previous_documents}}

## Revision Note

{{revision_note}}

## User Answers

The following answers have been provided for open questions. Use these to inform your document generation:

```
{{answers}}
```

## Required Output Structure

Produce an SOW with the following sections, grounded in the BRD and context:

1. **Document Control** — version, author role, date.
2. **Project Overview** — concise summary of what will be delivered.
3. **Objectives & Goals** — derived from the BRD business objectives.
4. **Scope of Work**
   - In Scope (explicit list of work items / phases)
   - Out of Scope (table of explicitly excluded items)
5. **Deliverables** — concrete deliverables with a clear "done when" definition per item or phase.
6. **Timeline / Phases** — phased plan with estimates.
7. **Assumptions** — assumptions underlying scope and timeline.
8. **Constraints** — budget, timeline, resource, or technical constraints.
9. **Acceptance Criteria** — how deliverables will be accepted.
10. **Risks** — delivery risks with mitigations.

## Writing Guidelines

- Make deliverables concrete and verifiable; each should have an unambiguous completion definition.
- Tie scope directly to BRD requirements; flag anything in the BRD that is deferred or excluded.
- Be specific to "{{project_name}}"; avoid generic project-management boilerplate.
- Use tables for scope, deliverables, and timeline.
