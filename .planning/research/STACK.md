# Technology Stack

**Project:** Open Recorder Tauri v1.1
**Domain:** Desktop audio recorder with transcription, editing, search, export, AI summarization, and insights
**Researched:** January 26, 2026
**Confidence:** HIGH (verified with official sources)

## Existing Stack (Validated)

### Core Technologies

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| Tauri | ^2.9.5 | Desktop app framework | Combines Rust backend with web frontend, small binaries |
| Next.js | ^15.1.6 | React framework | Static export for Tauri, excellent developer experience |
| React | ^19.0.0 | UI library | Latest React with concurrent features |
| Tailwind CSS | ^3.4.17 | Utility-first CSS | Rapid UI development, design consistency |
| TypeScript | ^5.7.3 | Type safety | Catch errors early, improve maintainability |
| async-openai | 0.32.3 | Official-style Rust client for OpenAI APIs, including Whisper transcription | Most mature Rust client with full Whisper support, async/await, configurable, handles multipart file upload automatically |
| tokio | 1.49.0 | Async runtime for Rust backend commands | Required by async-openai and Tauri async commands; standard Rust async runtime |
| reqwest | 0.13.1 | HTTP client for making API calls (used by async-openai) | Robust, TLS support, streaming; async-openai depends on it |

### Supporting Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @tauri-apps/plugin-store | ^2.4.2 | Persistent key‑value storage | Cross‑session state persistence |
| lucide-react | ^0.562.0 | Icon library | Consistent, scalable icons |
| react-hot-toast | ^2.6.0 | Notification toasts | User feedback for actions |
| serde_json | 1.0 | JSON serialization/deserialization for API responses | Already dependency; used for parsing Whisper API results |
| thiserror | 2.0 | Ergonomic error definitions for Rust commands | When defining custom error types for transcription failures |
| tracing | 0.1 | Structured logging for debugging transcription flow | Optional but recommended for production diagnostics |

## New Additions for v1.1

### Core Libraries

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| recharts | ^3.7.0 | Data visualization | React‑native charting library, SVG‑based, tree‑shakeable, excellent documentation. Perfect for insights page charts (bar, line, pie). |
| i18next | ^25.8.0 | Internationalization core | Industry‑standard i18n framework, supports JSON translation files, flexible pluralization, formatting. |
| react‑i18next | ^16.5.3 | React bindings for i18next | Seamless React integration, hooks (`useTranslation`), component (`Trans`), works with static export. |

### Supporting Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| (none) | – | – | UI fixes (action button, duration display, sticky footer) are pure Tailwind CSS adjustments. Editor‑page persistent state uses existing `@tauri‑apps/plugin‑store`. |

## Installation

```bash
# Existing Rust dependencies (already in Cargo.toml)
# Ensure they are up to date
cargo update

# New frontend dependencies
npm install recharts@^3.7.0 i18next@^25.8.0 react-i18next@^16.5.3

# No new dev dependencies required
```

## Alternatives Considered

### Charting
| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| **recharts** | Victory | Victory offers more chart types but larger bundle size (~37 kB vs ~20 kB gzipped). Choose Victory if you need advanced customizations like Voronoi polygons or native mobile support. |
| **recharts** | Chart.js + react‑chartjs‑2 | Chart.js is canvas‑based, better for many data points. Use if you need real‑time streaming or thousands of points. Recharts is preferred for typical React‑based dashboards. |

### Internationalization
| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| **i18next** | next‑i18next | next‑i18next requires Next.js server‑side features; this project uses `output: 'export'` (static). i18next works client‑side and integrates with Tauri store for language preference. |
| **i18next** | vanilla JSON + custom hook | Custom solution is lighter but lacks pluralization, formatting, interpolation, and community support. i18next is mature and widely adopted. |

### Transcription (Existing)
| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| **async-openai** | manual reqwest calls | If you need extreme control over HTTP flow (rare) |
| **OpenAI API via Rust backend** | frontend fetch | Never—API key must stay in backend for security |
| **OpenAI Whisper API** | Local Whisper.cpp | When offline transcription is required; adds ~1‑2 GB model size and CPU/GPU complexity |
| **async-openai** | Other OpenAI Rust crates (openai‑rs, openai‑api) | async-openai is more actively maintained and covers Whisper specifically |

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| **Storing API key in frontend code or localStorage** | Exposes secret to users; violates OpenAI terms | Keep key in Rust backend via env var or secure store |
| **Synchronous HTTP calls in Rust backend** | Blocks Tauri event loop, poor UX | Use async commands with tokio runtime |
| **Rolling your own multipart file upload** | Error‑prone, misses API nuances | Leverage async‑openai’s built‑in `audio::transcribe()` |
| **Plain `println!` for logging** | Hard to filter, no structured context | Use `tracing` macros (`info!`, `error!`) |
| **apexcharts** | Large bundle size (~45 kB), not React‑first, requires jQuery‑like integration. | recharts (React‑first, smaller) |
| **react‑intl** | Heavier, complex API, less flexible than i18next. | react‑i18next |
| **localStorage directly** | Not secure for desktop apps, synchronous, limited capacity. | @tauri‑apps/plugin‑store |
| **CSS‑in‑JS libraries** | Adds runtime overhead, conflicts with Tailwind. | Tailwind CSS (already in project) |

## Integration Points

### Recharts
- Import in Insights page components.
- Use `<BarChart>`, `<LineChart>`, `<PieChart>` with data from transcription stats.
- Style with Tailwind classes via `className` prop.

### i18next + react‑i18next
1. Create `public/locales/{en,es,fr}/translation.json` files.
2. Initialize i18next in `src/lib/i18n/config.ts` with `initReactI18next`.
3. Store selected language in Tauri store (extend `src/lib/fs/config.ts`).
4. Wrap app with `I18nextProvider` or use `useTranslation` hook.

### Persistent Editor State
- Extend existing store module (`src/lib/fs/config.ts`) with `getEditorState` / `setEditorState`.
- Create a custom hook `usePersistedState(key, initialValue)` that uses Tauri store.

## Version Compatibility

| Package | Compatible With | Notes |
|---------|-----------------|-------|
| async-openai 0.32.3 | reqwest ^0.12 | Works with reqwest 0.13.1 (tested) |
| tokio 1.49 | tauri 2.9.5 | Tauri already uses tokio internally; no conflict |
| tauri-plugin-store 2.4.2 | tauri 2.9.5 | Already in Cargo.toml |
| recharts@^3.7.0 | react@^16.8.0 || ^17 || ^18 || ^19 | Peer dependency satisfied. |
| i18next@^25.8.0 | typescript@^5 | Optional peer dependency, already satisfied. |
| react‑i18next@^16.5.3 | i18next@>=25.6.2 | Compatible. |

## Sources

- **Recharts v3.7.0** – Official documentation (recharts.github.io) and npm registry.
- **i18next v25.8.0** – Official npm registry, GitHub releases.
- **react‑i18next v16.5.3** – Official npm registry, GitHub releases.
- **async-openai, tokio, reqwest** – Previous research (January 23, 2026) with crates.io and docs.rs.
- **Confidence:** HIGH (all versions fetched directly from npm registry / crates.io).

---
*Stack research for: Open Recorder Tauri v1.1 (insights page, UI fixes, language settings)*  
*Researched: January 26, 2026*