# Testing Patterns

**Analysis Date:** 2026-01-23

## Test Framework

**Runner:** No test framework configured
**Assertion Library:** None
**Run Commands:** No test scripts in `package.json`

## Test File Organization

**Location:** No test files present
**Naming:** Not applicable
**Structure:** Not applicable

## Test Structure

**Suite Organization:** Not applicable
**Patterns:** Not applicable

## Mocking

**Framework:** Not configured
**Patterns:** Not applicable

**What to Mock:** (Based on typical patterns)
- Tauri API calls (`invoke`)
- File system operations
- Browser APIs (Audio API)

**What NOT to Mock:** (Guidelines when tests are added)
- React component rendering
- State management logic
- Utility functions

## Fixtures and Factories

**Test Data:** Not defined
**Location:** Not applicable

## Coverage

**Requirements:** None enforced
**View Coverage:** Not applicable

## Test Types

**Unit Tests:** Not implemented
- Should test utility functions, React hooks, component logic

**Integration Tests:** Not implemented
- Should test Tauri command interactions
- Component integration with state

**E2E Tests:** Not implemented
- Could use Playwright or Cypress for UI testing
- Tauri provides testing utilities for native integration

## Rust Testing (Backend)

**Current State:** No tests in `src-tauri/src/lib.rs` or `main.rs`
**Potential Framework:** Rust's built-in test framework (`cargo test`)
**Test Location:** Typically in same file with `#[cfg(test)]` mod or `tests/` directory

## Recommended Test Setup

**Frontend (Next.js):**
```bash
# Suggested dependencies
npm install --dev jest @testing-library/react @testing-library/jest-dom @testing-library/user-event
# or
npm install --dev vitest @testing-library/react happy-dom
```

**Configuration:**
- Jest config in `jest.config.js` or Vitest config in `vitest.config.ts`
- Test environment configured for JSX/TSX
- Path alias mapping for `@/*`

**Backend (Rust):**
- Add `#[cfg(test)]` modules to `lib.rs`
- Create `tests/` directory for integration tests
- Use `cargo test` to run

## Common Patterns for This Codebase

**Async Testing:**
```typescript
// Example pattern for async Tauri commands
jest.mock('@tauri-apps/api/core', () => ({
  invoke: jest.fn()
}))
```

**Error Testing:**
```typescript
// Test error handling in components
await waitFor(() => {
  expect(screen.getByText('Failed to scan folder')).toBeInTheDocument()
})
```

**Component Testing:**
```typescript
// Test React components with mocked dependencies
render(<Dashboard />)
expect(screen.getByText('Recordings')).toBeInTheDocument()
```

## Test Coverage Goals

**Priority Areas:**
1. Tauri command wrappers (`lib/fs/commands.ts`)
2. State management in `Dashboard` component
3. Audio player logic in `Player` component
4. File scanning logic in Rust backend

**Critical Paths:**
- Folder picking and scanning flow
- Audio playback controls
- Error recovery scenarios

---

*Testing analysis: 2026-01-23*