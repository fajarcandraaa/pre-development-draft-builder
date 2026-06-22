# Task: Generate Task Breakdown

You are acting as a **Tech Lead + Project Manager** creating a sprint-based task breakdown for the project **"{{project_name}}"**.

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

- If platform is **web**: Define web development tasks (frontend, backend, deployment, testing)
- If platform is **mobile**: Define mobile development tasks (iOS, Android, app store deployment, testing)
- If platform is **desktop**: Define desktop development tasks (native UI, OS-specific features, packaging, testing)
- If platform is **cli**: Define CLI development tasks (command parsing, terminal integration, testing)
- If platform is **api**: Define API development tasks (endpoints, documentation, testing, deployment)

## Required Output Structure

Produce a Task Breakdown document with the following sections. Every section must contain specific, project-grounded content — never generic boilerplate or placeholders:

**CRITICAL: This breakdown must be at the SPRINT/ITERATION level, NOT individual task/story level.**

1. **Executive Summary / Overview** — what this Task Breakdown defines (sprint plan for MVP development based on deliverables from SOW and SDD).
2. **Background / Context** — which documents this is based on (SOW, SDD) and final confirmations.
3. **Sprint Plan Summary** — table of sprints with names, durations, and milestones.
4. **Sprint 1 — Foundation & Setup**
   - Duration and target completion
   - Sprint objective
   - Features & components to implement (platform-specific setup, core infrastructure)
   - Definition of Done (checklist of completion criteria)
   - Dependencies (none — first sprint)
   - Sprint risks
5. **Sprint 2 — Core Features**
   - Duration and target completion
   - Sprint objective
   - Features & components to implement (platform-specific core features)
   - Definition of Done (checklist)
   - Dependencies (Sprint 1 must be complete)
   - Sprint risks
6. **Sprint 3 — Validation & Refinement**
   - Duration and target completion
   - Sprint objective (validation sprint — not feature development)
   - Sprint activities (testing, bug fixes, refinement)
   - Definition of Done (checklist)
   - Dependencies (Sprint 2 complete)
   - Sprint risks
7. **Sprint 4 — Advanced Features**
   - Duration and target completion
   - Sprint objective
   - Features & components to implement (platform-specific advanced features)
   - Definition of Done (checklist)
   - Dependencies (Sprint 3 complete)
   - Sprint risks
8. **Sprint 5 — End-to-End Validation**
   - Duration and target completion
   - Sprint objective
   - Sprint activities (full testing, documentation, deployment)
   - Definition of Done (= MVP Done checklist)
   - Dependencies (Sprint 4 complete)
   - Sprint risks
9. **Cross-Sprint Priorities** — table of priority levels
10. **Backlog Phase 2 (Post-MVP)** — table of items for future iterations
11. **Quality Gate Review** — completeness, consistency, risk/gap check, recommendation.

## Writing Guidelines

- Be specific to "{{project_name}}". Reference concrete components, commands, and deliverables from the context.
- Define tasks appropriate for the **{{platform}}** platform.
- **CRITICAL**: Ensure Task Breakdown produces sprint plans per iteration, NOT individual tasks.
- Use tables for sprint summaries and cross-sprint priorities.
- Include concrete acceptance criteria in each Definition of Done.
- Identify explicit gates between sprints.
