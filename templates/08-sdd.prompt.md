# Task: Generate System Design Document (SDD)

You are acting as a **Solution Architect + Tech Lead** providing concrete, implementable design specifications for the project **"{{project_name}}"**.

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

- If platform is **web**: Define web system design (component architecture, routing, state management, API integration)
- If platform is **mobile**: Define mobile system design (component architecture, navigation, state management, native modules)
- If platform is **desktop**: Define desktop system design (window management, native APIs, file system access)
- If platform is **cli**: Define CLI system design (command parsing, output formatting, shell integration)
- If platform is **api**: Define API system design (endpoint architecture, middleware, data models, authentication)

## Required Output Structure

Produce an SDD document with the following sections. Every section must contain specific, project-grounded content — never generic boilerplate or placeholders:

1. **Executive Summary / Overview** — what the SDD defines (module structure, interfaces, data schemas, implementation details).
2. **Background / Context** — which documents this is based on (TRD, SRS, UI/UX Flow) and final decisions confirmed.
3. **Objective** — goals of the SDD (define directory structure, modules/interfaces, data schemas, execution flows).
4. **Directory Structure** — complete tree of source, templates, tests directories with file purposes.
5. **Data Schemas**
   - Database schemas (if applicable)
   - API data models (if applicable)
   - State management schemas
   - File format specifications
6. **Module & Interface Design**
   - **Architecture Layers** — based on {{platform}} (presentation, business logic, data access)
   - **Component Design** — module structure and interfaces
   - **API Design** (if applicable) — endpoints, request/response schemas
   - **State Management** — how application state is managed
7. **Execution Flows**
   - User interaction flows
   - Data processing flows
   - Error handling flows
8. **Platform-Specific Design**
   - Based on {{platform}} (web/mobile/desktop/cli/api)
   - Platform-specific patterns and conventions
9. **Security Design**
   - Authentication mechanisms
   - Data encryption
   - Input validation
10. **Performance Design**
   - Caching strategies
   - Optimization techniques
   - Resource management
11. **Assumptions** — assumptions about technology, infrastructure, deployment.
12. **Constraints** — platform-specific constraints, performance requirements, security requirements.
13. **Risks** — implementation risks, dependencies, third-party services.

## Writing Guidelines

- Be specific to "{{project_name}}". Reference concrete module names, methods, and configurations from the context.
- Define system design appropriate for the **{{platform}}** platform.
- Use code blocks for interface definitions and method signatures.
- Use diagrams (ASCII or Mermaid) for architecture visualization.
- Include complete directory structure with file purposes.
- Ensure every module has clear responsibility and method signatures.
- The SDD should be detailed enough that a developer can start coding without additional design decisions.
