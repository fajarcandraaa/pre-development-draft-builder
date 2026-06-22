# Sprint 4 Task 1: Create Stage 2 Prompt Templates

## Task Description

Create 5 prompt template files for Stage 2 document generation in the `templates/` directory.

## Reference Documents

- docs/05-uiux-flow.md (for UI/UX Flow template structure)
- docs/06-srs.md (for SRS template structure)
- docs/07-trd.md (for TRD template structure)
- docs/08-sdd.md (for SDD template structure)
- docs/09-task-breakdown.md (for Task Breakdown template structure)
- templates/01-discovery-notes.prompt.md (as reference for template format)
- src/config/registry.ts (for document IDs and dependencies)

## Files to Create

1. `templates/05-uiux-flow.prompt.md`
2. `templates/06-srs.prompt.md`
3. `templates/07-trd.prompt.md`
4. `templates/08-sdd.prompt.md`
5. `templates/09-task-breakdown.prompt.md`

## Template Structure Requirements

Each template must follow the same structure as Stage 1 templates:

```markdown
# [Document Name] Generation

## Project Context

{{context}}

## Previous Documents

{{previous_documents}}

## Revision Note

{{revision_note}}

## Instructions

Generate a [Document Name] document for the project "{{project_name}}" in {{language}}.

Quality mode: {{quality_mode}}

### Document Structure

[Specific section guidance based on document specification]

### Writing Guidelines

- Use clear, professional language
- Maintain consistency with previous documents
- Include all required sections
- Provide specific, actionable details
```

## Placeholder Requirements

Each template must include these placeholders:
- `{{project_name}}`
- `{{language}}`
- `{{quality_mode}}`
- `{{context}}`
- `{{previous_documents}}`
- `{{revision_note}}`

## Document-Specific Requirements

### UI/UX Flow Template
- Include sections for user flows, screen layouts, interaction patterns
- Reference UI/UX Flow document specification

### SRS Template
- Include sections for functional requirements, non-functional requirements, use cases
- Reference SRS document specification

### TRD Template
- Include sections for technology stack, architecture decisions, infrastructure
- Reference TRD document specification

### SDD Template
- Include sections for module design, interfaces, data structures
- Reference SDD document specification

### Task Breakdown Template
- Include sections for sprint plans, iteration breakdown, task estimation
- Must produce sprint plans per iteration, not individual tasks
- Reference Task Breakdown document specification

## Acceptance Criteria

1. All 5 template files exist in `templates/` directory
2. Each template has required placeholders
3. Each template follows Stage 1 template structure
4. Each template includes document-specific section guidance
5. Templates use correct document IDs from registry
6. Templates can be loaded by `DocumentGenerator.loadTemplate()`

## Testing

After creating templates, verify:
- Files exist in correct location
- Templates can be read by the template loader
- Placeholders are correctly formatted
