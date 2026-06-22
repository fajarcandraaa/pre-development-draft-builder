# S2-T01 — AI Gateway Implementation

**Sprint:** Sprint 2 — Stage 1 Generator  
**Task:** S2-T01  
**Owner:** Agent 1 (Senior Software Engineer)  
**Depends on:** S1-T02 (Config + Storage layer)  
**Status:** Todo

---

## Objective

Implement the AI Gateway layer (Layer 3) with multi-provider support, token budget enforcement, and retry strategy. This layer provides a facade for Core Engine to interact with AI providers without depending on specific implementations.

---

## Scope

### Components to Create

1. **`src/ai/types.ts`** — Type definitions
   - `AIProvider` interface
   - `GenerateRequest` interface
   - `GenerateResponse` interface
   - `QualityMode` type (already defined in storage/schemas.ts, may need to export)

2. **`src/ai/AIGateway.ts`** — Facade + provider resolution + token budget
   - `generate(request, mode)` — main entry point
   - `isProviderAvailable(providerName?)` — health check
   - `resolveProvider()` — get active provider from config
   - `applyTokenBudget(request, mode)` — clamp maxTokens per quality mode

3. **`src/ai/ProviderRegistryService.ts`** — Provider registry
   - `getProvider(name, apiKey)` — instantiate provider
   - `listAvailable()` — list registered provider names
   - `isRegistered(name)` — check if provider exists

4. **`src/ai/providers/OpenAIProvider.ts`** — OpenAI implementation
   - Implements `AIProvider` interface
   - Uses `openai` npm SDK
   - `generate()` — call OpenAI API
   - `isAvailable()` — ping test

5. **`src/ai/providers/AnthropicProvider.ts`** — Anthropic implementation
   - Implements `AIProvider` interface
   - Uses `@anthropic-ai/sdk` npm package
   - `generate()` — call Anthropic API
   - `isAvailable()` — ping test

6. **`src/ai/providers/MockProvider.ts`** — Mock for testing
   - Implements `AIProvider` interface
   - Returns placeholder content without API calls
   - Used for `--dry-run` and unit tests

### Retry Strategy (from TRD §5.6.1)

Implement 4-attempt retry with exponential backoff:
- Attempt 1: Direct call
- Attempt 2: Wait 2 seconds (if error 429 or 5xx)
- Attempt 3: Wait 5 seconds
- Attempt 4: Wait 10 seconds
- After 4 attempts: throw error with informative message

**Retry on:** `429 Too Many Requests`, `500 Internal Server Error`, `502 Bad Gateway`, `503 Service Unavailable`, network timeout  
**No retry on:** `401 Unauthorized`, `400 Bad Request`, `404 Not Found`

### Token Budget Enforcement (from TRD §5.5.3)

| Quality Mode | Max Output Tokens | Max Context Tokens | Total Max |
|-------------|------------------|--------------------|-----------|
| fast-draft | 2.000 | 4.000 | 6.000 |
| balanced | 4.000 | 8.000 | 12.000 |
| deep-analysis | 8.000 | 16.000 | 24.000 |

AIGateway must clamp `maxTokens` in GenerateRequest based on provider config (from `provider.json`).

---

## Acceptance Criteria

1. **Type Definitions**
   - `AIProvider` interface defined with `name`, `supportedModes`, `generate()`, `isAvailable()`
   - `GenerateRequest` includes: `systemPrompt`, `userPrompt`, `model`, `maxTokens`, `temperature`
   - `GenerateResponse` includes: `content`, `tokensUsed` (input/output/total), `model`, `provider`

2. **AIGateway**
   - Resolves provider from `provider.json` default config
   - Applies token budget clamping per quality mode
   - Runs retry strategy with correct delays
   - Throws `APIError` with `retryable` flag for proper error handling

3. **ProviderRegistryService**
   - Returns correct provider instance for registered names
   - Lists: `['openai', 'anthropic', 'mock']`
   - Returns false for unregistered provider names

4. **OpenAIProvider**
   - Instantiates OpenAI client with API key
   - Calls `chat.completions.create()` with correct parameters
   - Returns response in `GenerateResponse` format
   - `isAvailable()` pings models endpoint successfully

5. **AnthropicProvider**
   - Instantiates Anthropic client with API key
   - Calls `messages.create()` with correct parameters
   - Returns response in `GenerateResponse` format
   - `isAvailable()` pings messages endpoint successfully

6. **MockProvider**
   - Returns placeholder: `[DRY RUN / MOCK] Dokumen akan dihasilkan menggunakan model {model}.`
   - Returns zero token usage
   - `isAvailable()` always returns true

7. **Retry Strategy**
   - Retries 429 with 2s, 5s, 10s delays
   - Retries 5xx errors with same delays
   - Does NOT retry 401, 400, 404 (immediate error)
   - After 4 failed attempts, throws error with message

8. **Unit Tests**
   - Test provider resolution
   - Test token budget clamping
   - Test retry strategy (mock delays)
   - Test OpenAIProvider (mocked SDK)
   - Test AnthropicProvider (mocked SDK)
   - Test MockProvider
   - Test error handling (retry vs no-retry)

---

## Dependencies to Add

Add to `package.json`:
```json
{
  "dependencies": {
    "openai": "^4.x.x",
    "@anthropic-ai/sdk": "^0.x.x"
  }
}
```

Run: `pnpm add openai @anthropic-ai/sdk`

---

## Source of Truth

- **SDD §6.3** — Layer 3: AI Gateway design
- **TRD §5.3** — AI Gateway multi-provider design
- **TRD §5.6.1** — Retry strategy
- **TRD §5.5.3** — Token budget per quality mode
- **SRS FR-06** — Document Generation (AI integration)

---

## Implementation Notes

1. **ESM Compatibility**: Both OpenAI and Anthropic SDKs support ESM. Use `import` syntax (no `require`).

2. **Dependency Injection**: AIGateway should receive `ProviderRegistryService` and `ProviderStore` via constructor (no singletons).

3. **Error Types**: Create `APIError` class in `src/core/errors.ts` (if not already there) with fields: `statusCode`, `provider`, `retryable`.

4. **Mock Delays in Tests**: Use `vi.useFakeTimers()` from Vitest to test retry delays without actually waiting.

5. **Provider Config**: Read from `ProviderStore` which already reads `~/.docbuilder/provider.json`. Use existing `providerCatalog` for metadata.

---

## Submission Checklist

- [x] All 6 component files created
- [x] Dependencies added to package.json
- [x] Unit tests for all components (min 80% coverage)
- [x] `pnpm lint` passes
- [x] `pnpm test` passes
- [x] `pnpm build` passes
- [x] No `any` types (except in test mocks where justified)
- [x] No `console.log` outside logger.ts
- [x] All acceptance criteria verified

---

## Submission Report Template

When submitting, include:

### Created Files
- List of all files created with line counts

### Dependencies Added
- Package names and versions

### Commands Run
- `pnpm add ...`
- `pnpm lint`
- `pnpm test`
- `pnpm build`

### Results
- Lint output (summary)
- Test output (summary)
- Build output (summary)

### Design Notes
- Any deviations from SDD/TRD (with justification)
- Edge cases handled

### Risks / Blockers
- Any issues encountered
- Any decisions requiring Agent 0 approval

### Status
- **APPROVED** — Agent 0 review complete

---

## Agent 0 Approval Summary

**Review Date:** 2026-06-19

**Implementation Review:**
- All 6 component files created with proper structure
- Dependencies added: `openai`, `@anthropic-ai/sdk`
- Token budget enforcement matches TRD §5.5.3 (6000/12000/24000)
- Retry strategy matches TRD §5.6.1 (4 attempts, delays [0, 2s, 5s, 10s])
- Dependency injection pattern correctly implemented
- Error handling with APIError properly structured

**QA Review:**
- 14/14 scenarios passed
- 106 total tests passing
- No defects found
- Regression checks all passed
- QA recommendation: PASS

**Quality Gates:**
- Lint: ✓ Passed
- Tests: ✓ Passed (106/106)
- Build: ✓ Passed
- No `any` types outside test mocks
- No `console.log` outside logger.ts

**Decision:** APPROVED - Ready for S2-T02
