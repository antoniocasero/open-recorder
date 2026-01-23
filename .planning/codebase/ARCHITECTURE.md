# Architecture

**Analysis Date:** 2026-01-23

## Pattern Overview

**Overall:** Tauri desktop application with Next.js frontend (App Router) and Rust backend

**Key Characteristics:**
- **Frontend/Backend Separation:** React frontend communicates with Rust backend via Tauri's invoke command system
- **File System Access:** Backend has direct filesystem access for scanning audio files and picking folders
- **Client-Side State:** Frontend uses React useState/useEffect for component state management
- **Minimal API Surface:** Only three backend commands cover all file operations
- **Static Export:** Next.js configured for static export (`output: 'export'`) for Tauri's asset protocol

## Layers

**Frontend UI Layer:**
- Purpose: User interface rendering and interaction
- Location: `app/`, `src/components/`
- Contains: Next.js pages, React components, Tailwind CSS styling
- Depends on: Tauri API (`@tauri-apps/api`), React hooks
- Used by: End users

**Command Layer:**
- Purpose: Bridge between frontend and backend operations
- Location: `src/lib/fs/commands.ts`, `src/lib/fs/config.ts`
- Contains: Type-safe wrapper functions that invoke Rust commands
- Depends on: `@tauri-apps/api/core`, `@tauri-apps/plugin-store`
- Used by: UI components

**Backend Service Layer:**
- Purpose: Filesystem operations and native dialog handling
- Location: `src-tauri/src/lib.rs`
- Contains: Rust command handlers for folder picking, file scanning, metadata reading
- Depends on: Tauri framework, Rust standard library, dialog and store plugins
- Used by: Command layer via Tauri invoke

**Persistence Layer:**
- Purpose: Store application configuration and user preferences
- Location: `src/lib/fs/config.ts` (frontend), `tauri-plugin-store` (backend)
- Contains: Store API wrapper for key-value persistence
- Depends on: `@tauri-apps/plugin-store`
- Used by: Command layer for remembering last folder

## Data Flow

**Folder Scanning Flow:**

1. User clicks "Sync Device" → `Dashboard.handleChooseFolder()` calls `pickFolder()`
2. `pickFolder()` invokes Rust `pick_folder` command → native folder picker dialog
3. User selects folder → path returned to frontend
4. Frontend calls `scanFolderForAudio()` with path → invokes Rust `scan_folder_for_audio`
5. Rust recursively scans directory for audio files (mp3, m4a, wav) → returns `AudioItem[]`
6. Frontend updates `recordings` state → `RecordingsList` and `Player` re-render

**Audio Playback Flow:**

1. User selects recording → `Dashboard.setSelectedId()` updates state
2. `Player` component receives `recording` prop → creates audio element with `convertFileSrc()`
3. Audio loads via Tauri's asset protocol (`asset://`) → file served from local filesystem
4. Play/pause controls manipulate HTML5 Audio element directly

**Configuration Persistence Flow:**

1. On app load → `Dashboard.loadLastFolder()` calls `getLastFolder()`
2. `getLastFolder()` reads from Tauri store → returns last scanned folder path
3. After folder selection → `setLastFolder()` saves path to store for next session

**State Management:**
- Component-level React state (`useState`) for recordings, selection, loading state
- No global state management library (Redux, Zustand, etc.)
- Props drilling from Dashboard to child components

## Key Abstractions

**AudioItem:**
- Purpose: Unified representation of audio files across frontend and backend
- Examples: `src/lib/types.ts`, `src-tauri/src/lib.rs` (Rust struct)
- Pattern: Serialized/deserialized via Serde for cross-language communication

**Command Invocation Pattern:**
- Purpose: Type-safe RPC between TypeScript and Rust
- Examples: `invoke<string>('pick_folder')` in `commands.ts`
- Pattern: Frontend defines wrapper functions, backend defines `#[tauri::command]` handlers

**Plugin-Based Extensions:**
- Purpose: Extend Tauri with native capabilities
- Examples: `tauri-plugin-store` for persistence, `tauri-plugin-dialog` for native dialogs
- Pattern: Configured in Rust backend setup, exposed via Tauri API

## Entry Points

**Frontend Entry Point:**
- Location: `app/layout.tsx`, `app/page.tsx`
- Triggers: Tauri window loads `index.html` which loads Next.js app
- Responsibilities: Root layout, metadata, global CSS, render Dashboard component

**Backend Entry Point:**
- Location: `src-tauri/src/main.rs`
- Triggers: Tauri application startup
- Responsibilities: Configure Tauri builder, register plugins, setup command handlers

**Command Registration:**
- Location: `src-tauri/src/lib.rs` `run()` function
- Triggers: Tauri initialization
- Responsibilities: Register command handlers via `invoke_handler`

## Error Handling

**Strategy:** Simple string error propagation

**Patterns:**
- Rust commands return `Result<T, String>` - errors converted to strings
- Frontend `try/catch` blocks around command invocations
- UI displays error messages inline (e.g., Player component shows audio load errors)
- Console logging for debugging (`console.error`)

## Cross-Cutting Concerns

**Logging:** `tauri-plugin-log` configured only in debug builds (`cfg!(debug_assertions)`)
**Validation:** Minimal - assumes valid file paths from native dialog
**Authentication:** None required (local desktop application)
**Security:** Tauri CSP configured to allow asset protocol for local files

---

*Architecture analysis: 2026-01-23*