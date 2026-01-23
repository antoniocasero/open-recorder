# Technology Stack

**Analysis Date:** 2026-01-23

## Languages

**Primary:**
- TypeScript 5.7.3 - Frontend components and utilities (`src/`, `app/`)
- Rust 1.77.2 - Backend system integration (`src-tauri/src/`)

**Secondary:**
- CSS via Tailwind - Styling

## Runtime

**Environment:**
- Node.js (version 18 or higher) - Development and build
- Rust (stable) - Tauri backend compilation
- WebView (provided by Tauri) - Desktop runtime

**Package Manager:**
- npm (included with Node.js)
- Lockfile: `package-lock.json` present

## Frameworks

**Core:**
- Next.js 15.1.6 - React framework with App Router (`app/`, `next.config.js`)
- React 19.0.0 - UI library
- Tauri 2.9.5 - Desktop application framework (`src-tauri/`)

**Testing:**
- Not configured (no test framework detected)

**Build/Dev:**
- TypeScript 5.7.3 - Type checking (`tsconfig.json`)
- Tailwind CSS 3.4.17 - Utility-first CSS (`tailwind.config.js`)
- PostCSS 8.4.49 - CSS processing (`postcss.config.js`)
- ESLint 9.18.0 - Linting (`eslint-config-next`)

## Key Dependencies

**Critical:**
- `@tauri-apps/api` ^2.9.1 - Frontend bindings to Tauri core
- `@tauri-apps/plugin-store` ^2.4.2 - Persistent key‑value storage
- `lucide-react` ^0.562.0 - Icon library

**Infrastructure:**
- `@tauri-apps/cli` ^2.9.6 - Tauri command‑line interface (dev dependency)
- `serde` 1.0 + `serde_json` 1.0 - Rust serialization (`src‑tauri/Cargo.toml`)
- `tauri-plugin-dialog` 2 - Native file‑picker dialogs
- `tauri-plugin-log` 2 - Logging plugin (debug builds only)
- `md5` 0.7 - Hashing for file IDs

## Configuration

**Environment:**
- No `.env` files detected
- No `process.env` usage found in source code
- All configuration is file‑based or defined in code

**Build:**
- `tsconfig.json` – TypeScript compiler settings (target ES2017, path alias `@/*` → `src/*`)
- `next.config.js` – Next.js static export, unoptimized images
- `tailwind.config.js` – Content sources: `app/**/*`, `src/**/*`
- `postcss.config.js` – Autoprefixer setup
- `tauri.conf.json` – App identifier, window size, security CSP, icon set

## Platform Requirements

**Development:**
- Node.js 18+
- Rust toolchain (`rustc`, `cargo`)
- npm

**Production:**
- Built executables for macOS, Windows, Linux via `npm run tauri:build`
- Output directory: `src-tauri/target/release/bundle/`

---

*Stack analysis: 2026-01-23*