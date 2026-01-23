# Coding Conventions

**Analysis Date:** 2026-01-23

## Naming Patterns

**Files:**
- Components: PascalCase with `.tsx` extension (e.g., `Dashboard.tsx`, `RecordingsList.tsx`)
- Utility/Module files: camelCase with `.ts` extension (e.g., `commands.ts`, `config.ts`)
- Types: `types.ts`

**Functions:**
- camelCase for regular functions (e.g., `formatDuration`, `scanFolder`)
- PascalCase for React components (e.g., `Dashboard`, `RecordingsList`)
- Async functions prefixed with appropriate verbs (e.g., `handleChooseFolder`, `loadLastFolder`)

**Variables:**
- camelCase for local variables and state (e.g., `selectedId`, `isPlaying`)
- `const` used for all declarations unless reassignment needed
- Use descriptive names that indicate purpose (e.g., `audioRef`, `currentTime`)

**Types:**
- PascalCase for interfaces and types (e.g., `AudioItem`, `RecordingsListProps`)
- TypeScript generics use standard naming (`T`, `U`)

## Code Style

**Formatting:**
- Tool: Prettier not configured; relies on editor defaults
- Indentation: 2 spaces
- Semicolons: Used
- Quotes: Single quotes for strings, double quotes for JSX attributes
- Line length: Approximately 80-100 characters

**Linting:**
- Tool: ESLint with Next.js configuration (`eslint-config-next`)
- Script: `npm run lint` runs `next lint`
- No custom ESLint configuration detected

## Import Organization

**Order:**
1. External dependencies (e.g., `import { useState } from 'react'`)
2. Internal modules using path aliases (e.g., `import { AudioItem } from '@/lib/types'`)
3. Relative imports (e.g., `import { RecordingsList } from './RecordingsList'`)

**Path Aliases:**
- `@/*` → `./src/*` (configured in `tsconfig.json`)

**Grouping:**
- React imports first, then Tauri APIs, then Lucide icons, then internal modules

## Error Handling

**Patterns:**
- `try-catch` blocks for async operations
- Error messages logged to console with `console.error`
- User-facing error messages set in component state
- No centralized error handling or error types

**Example:**
```typescript
try {
  const items = await scanFolderForAudio(folderPath)
  setRecordings(items)
} catch (err) {
  console.error('Failed to scan folder:', err)
} finally {
  setLoading(false)
}
```

## Logging

**Framework:** Console API only (`console.log`, `console.error`)

**Patterns:**
- Debug logging for audio loading in development
- Error logging for failed operations
- No production logging strategy defined

## Comments

**When to Comment:**
- Minimal comments; code is self-documenting
- Occasional comments for debugging (`// Debug logging`)
- No JSDoc/TSDoc comments observed

**JSDoc/TSDoc:** Not used

## Function Design

**Size:** Functions are reasonably sized (20-50 lines)
- Larger functions like `togglePlayPause` (53 lines) could be refactored

**Parameters:** Explicit typing for all function parameters
- Use TypeScript interfaces for component props

**Return Values:** Explicit return types for functions (TypeScript inferred where appropriate)

## Module Design

**Exports:**
- Named exports for components and utilities (e.g., `export function Dashboard()`)
- Default exports only for Next.js pages (`export default function Home()`)

**Barrel Files:** Not used

## React-Specific Conventions

**Client Components:** Use `'use client'` directive at top of file
**Hooks:** Use standard React hooks (`useState`, `useEffect`, `useRef`)
**Event Handlers:** Prefix with `handle` (e.g., `handleChooseFolder`, `togglePlayPause`)
**Conditional Rendering:** Use early returns and ternary operators

## TypeScript Usage

**Strict Mode:** Enabled (`strict: true` in `tsconfig.json`)
**Implicit Any:** Not allowed
**Nullish Values:** Explicit handling with optional chaining and nullish coalescing

---

*Convention analysis: 2026-01-23*