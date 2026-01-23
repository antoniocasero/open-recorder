# Codebase Structure

**Analysis Date:** 2026-01-23

## Directory Layout

```
open-recorder-tauri/
├── app/                          # Next.js App Router pages
│   ├── layout.tsx                # Root layout (metadata, global CSS)
│   ├── page.tsx                  # Home page (renders Dashboard)
│   └── globals.css               # Tailwind directives
├── src/                          # Frontend source code
│   ├── components/               # React components
│   │   ├── Dashboard.tsx         # Main dashboard component
│   │   ├── Player.tsx            # Audio player component
│   │   ├── RecordingsList.tsx    # List of audio recordings
│   │   └── Transcription.tsx     # Transcription panel (placeholder)
│   ├── hooks/                    # Custom React hooks (empty)
│   └── lib/                      # Utilities and shared code
│       ├── types.ts              # TypeScript type definitions
│       └── fs/                   # File system operations
│           ├── commands.ts       # Tauri command wrappers
│           └── config.ts         # Store configuration wrapper
├── src-tauri/                    # Rust backend (Tauri)
│   ├── src/                      # Rust source code
│   │   ├── main.rs               # Entry point (calls lib::run)
│   │   └── lib.rs                # Command handlers and business logic
│   ├── capabilities/             # Tauri capability definitions
│   │   └── default.json          # Default permissions
│   ├── icons/                    # Application icons
│   ├── Cargo.toml                # Rust dependencies and metadata
│   └── tauri.conf.json           # Tauri application configuration
├── .planning/                    # Planning documents
│   └── codebase/                 # Codebase analysis (this file)
├── plan/                         # Project planning files
├── public/                       # Static assets (none currently)
├── node_modules/                 # Node.js dependencies (generated)
├── .next/                        # Next.js build cache (generated)
├── out/                          # Next.js static export (generated)
└── [config files]                # Root config files (see below)
```

## Directory Purposes

**app/:**
- Purpose: Next.js App Router pages and layouts
- Contains: Page components, root layout, global styles
- Key files: `layout.tsx`, `page.tsx`, `globals.css`

**src/components/:**
- Purpose: Reusable React components for the application UI
- Contains: Dashboard, Player, RecordingsList, Transcription components
- Key files: All `.tsx` files are used by the Dashboard

**src/lib/:**
- Purpose: Shared utilities, types, and Tauri command interfaces
- Contains: Type definitions, file system command wrappers, store configuration
- Key files: `types.ts`, `fs/commands.ts`, `fs/config.ts`

**src-tauri/:**
- Purpose: Rust backend providing native filesystem access and dialogs
- Contains: Tauri application setup, command handlers, capabilities configuration
- Key files: `src/lib.rs`, `tauri.conf.json`, `Cargo.toml`

**src-tauri/capabilities/:**
- Purpose: Tauri security capability definitions
- Contains: JSON files specifying window and permission allowances
- Key files: `default.json` (enables core and store permissions)

**src-tauri/icons/:**
- Purpose: Application icons for different platforms
- Contains: PNG, ICNS, ICO files at various resolutions

**.planning/codebase/:**
- Purpose: Codebase analysis and documentation for GSD tooling
- Contains: Architecture, structure, conventions, and concerns documents
- Key files: `ARCHITECTURE.md`, `STRUCTURE.md`

**plan/:**
- Purpose: Project planning and progress tracking
- Contains: Planning JSON, progress log, screenshot, helper script
- Generated: No
- Committed: Yes

## Key File Locations

**Entry Points:**
- `app/page.tsx`: Frontend entry component (renders Dashboard)
- `src-tauri/src/main.rs`: Rust executable entry point
- `src-tauri/src/lib.rs`: Tauri application setup and command registration

**Configuration:**
- `package.json`: Node.js dependencies and scripts
- `src-tauri/Cargo.toml`: Rust dependencies and crate configuration
- `src-tauri/tauri.conf.json`: Tauri window settings, build configuration
- `tsconfig.json`: TypeScript compiler options with path alias `@/*`
- `next.config.js`: Next.js static export configuration
- `tailwind.config.js`: Tailwind CSS content sources
- `postcss.config.js`: PostCSS plugins (Tailwind, Autoprefixer)

**Core Logic:**
- `src-tauri/src/lib.rs`: Filesystem scanning, native dialog handling
- `src/components/Dashboard.tsx`: Main application state and orchestration
- `src/lib/fs/commands.ts`: Frontend-to-backend command interface

**Type Definitions:**
- `src/lib/types.ts`: `AudioItem` interface shared across frontend/backend
- `src-tauri/src/lib.rs`: `AudioItem` Rust struct with Serde derives

**Testing:**
- No test files currently present

## Naming Conventions

**Files:**
- PascalCase for React components: `Dashboard.tsx`, `Player.tsx`
- camelCase for utility files: `commands.ts`, `config.ts`
- kebab-case for configuration files: `tauri.conf.json`, `postcss.config.js`

**Directories:**
- Singular lowercase for component categories: `components/`, `hooks/`, `lib/`
- kebab-case for multi-word directories: `src-tauri/` (Tauri convention)
- Descriptive names: `capabilities/`, `icons/`

**Imports:**
- Absolute imports using `@/` alias: `import { AudioItem } from '@/lib/types'`
- Relative imports for sibling files: `import { Player } from './Player'`
- External imports grouped separately

## Where to Add New Code

**New Frontend Feature:**
- Primary code: `src/components/` (new or existing component)
- State management: Add to `Dashboard.tsx` or new custom hook in `src/hooks/`
- Utilities: `src/lib/` (new file or extend existing)

**New Backend Command:**
1. Add Rust function with `#[tauri::command]` in `src-tauri/src/lib.rs`
2. Register in `invoke_handler` array in same file
3. Create TypeScript wrapper in `src/lib/fs/commands.ts`
4. Add types to `src/lib/types.ts` if needed
5. Use in frontend component

**New UI Component:**
- Create `PascalCase.tsx` in `src/components/`
- Import and use in `Dashboard.tsx` or another component
- Add Tailwind classes for styling

**Configuration Changes:**
- Tauri settings: `src-tauri/tauri.conf.json`
- Build/output: `next.config.js`
- Styling: `tailwind.config.js`
- TypeScript paths: `tsconfig.json`

## Special Directories

**node_modules/:**
- Purpose: Node.js dependencies installed by npm
- Generated: Yes (by `npm install`)
- Committed: No (in .gitignore)

**.next/:**
- Purpose: Next.js build cache and development files
- Generated: Yes (by `npm run dev/build`)
- Committed: No (in .gitignore)

**out/:**
- Purpose: Next.js static export output (served by Tauri)
- Generated: Yes (by `npm run build`)
- Committed: No (in .gitignore)

**src-tauri/target/:**
- Purpose: Rust compilation artifacts
- Generated: Yes (by `cargo build`)
- Committed: No (in .gitignore)

**src-tauri/gen/:**
- Purpose: Generated Tauri schemas
- Generated: Yes (by Tauri)
- Committed: No (in .gitignore)

---

*Structure analysis: 2026-01-23*