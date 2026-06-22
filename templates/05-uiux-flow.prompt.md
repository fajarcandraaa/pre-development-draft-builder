# Task: Generate UI/UX Flow

You are acting as a **UI/UX Designer / Product Designer** documenting the interaction flow for the project **"{{project_name}}"**.

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

- If platform is **web**: Design web-based UI/UX flows (browser interface, navigation, forms, dashboards)
- If platform is **mobile**: Design mobile app UI/UX flows (touch interface, gestures, mobile-specific patterns)
- If platform is **desktop**: Design desktop application UI/UX flows (native UI patterns, window management)
- If platform is **cli**: Design command-line interface flows (commands, arguments, terminal output)
- If platform is **api**: Design API interaction flows (endpoints, request/response patterns)

## Required Output Structure

Produce a UI/UX Flow document with the following sections. Every section must contain specific, project-grounded content — never generic boilerplate or placeholders:

1. **Executive Summary / Overview** — what the UI/UX Flow covers and its focus (user interaction flow and journey, not visual wireframes).
2. **Background / Context** — which documents this is based on (PRD, BRD, etc.).
3. **Objective** — goals of documenting the interaction flow.
4. **Scope** — what this flow covers (main scenarios, feedback messages, edge cases) and what it does NOT cover (visual styling, technical error handling).
5. **Main Content**
   - **UI/UX Map (Sitemap)** — complete tree of all screens, pages, or commands based on the platform.
   - **Flow: Happy Path (End-to-End)** — ideal flow from user entry to completion using Mermaid diagram.
   - **Detailed Scenarios per Stage** — step-by-step flows for:
     - Scenario 1: User onboarding / initial setup
     - Scenario 2: Primary feature usage (main functionality)
     - Scenario 3: Secondary features
     - Scenario 4: Error handling and recovery
     - Scenario 5: Settings / configuration
   - **Flow Diagram: Main Branching** — Mermaid diagram showing decision points and user choices.
   - **Feedback & UX Principles** — table of conditions and user feedback principles (success, warning, error, waiting).
   - **Edge Cases & Dead-End Prevention** — table of situations and system behavior.
6. **Assumptions** — assumptions about user behavior, device capabilities, etc.
7. **Constraints** — platform-specific constraints (screen size, input methods, etc.).
8. **Risks** — risks like poor UX, user confusion, etc.

## Writing Guidelines

- Be specific to "{{project_name}}". Reference concrete flows, screens, and scenarios from the context.
- Design the UI/UX flow appropriate for the **{{platform}}** platform.
- Use Mermaid diagrams for flow visualization.
- Include concrete example outputs or screen flows where helpful.
- Ensure every screen, page, or command mentioned has a clear entry/exit point.
- Identify all decision points where the user must make a choice.
