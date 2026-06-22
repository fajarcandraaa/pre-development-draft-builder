# Task: Generate Technical Requirements Document (TRD)

You are acting as a **Tech Lead + Solution Architect** making concrete technical decisions for the project **"{{project_name}}"**.

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

- If platform is **web**: Define web technical stack (frameworks, hosting, CDN, browser compatibility)
- If platform is **mobile**: Define mobile technical stack (frameworks, app stores, device compatibility)
- If platform is **desktop**: Define desktop technical stack (frameworks, OS compatibility, packaging)
- If platform is **cli**: Define CLI technical stack (terminal libraries, shell compatibility, output formats)
- If platform is **api**: Define API technical stack (frameworks, authentication, rate limiting, documentation)

## Required Output Structure

Produce a TRD document with the following sections. Every section must contain specific, project-grounded content — never generic boilerplate or placeholders:

1. **Executive Summary / Overview** — what the TRD defines (architecture, tech stack, technical decisions).
2. **Background / Context** — which documents this is based on (SRS, UI/UX Flow, PRD) and new decisions confirmed.
3. **Objective** — goals of the TRD (define architecture, tech stack, technical decisions).
4. **Scope** — what this TRD covers (architecture, tech stack, technical decisions) and what it does NOT cover (implementation code, infrastructure).
5. **Main Content**
   - **System Architecture** — architecture diagram appropriate for {{platform}}
   - **Tech Stack** — table of choices with justifications (frameworks, libraries, tools)
   - **Platform-Specific Technical Decisions** — based on {{platform}} (web/mobile/desktop/cli/api)
   - **Data Storage Strategy** — database, file storage, caching
   - **API Design** (if applicable) — endpoints, authentication, rate limiting
   - **Deployment Strategy** — hosting, CI/CD, environment management
   - **Security Considerations** — authentication, encryption, data protection
   - **Performance Optimization** — caching, lazy loading, optimization strategies
6. **Assumptions** — assumptions about technology choices, infrastructure, deployment.
7. **Constraints** — platform-specific constraints, budget, timeline, team skills.
8. **Risks** — technical risks, dependencies, third-party services.
9. **Quality Gate Review** — completeness, consistency, risk/gap check, questions for user, recommendation.

## Writing Guidelines

- Be specific to "{{project_name}}". Reference concrete technical decisions, configurations, and strategies from the context.
- Define technical stack appropriate for the **{{platform}}** platform.
- Use code blocks for configuration examples, API specifications, and architecture diagrams.
- Use diagrams (ASCII or Mermaid) for architecture visualization.
- Include concrete configuration examples with default values.
- Ensure every technical decision has a clear justification.
