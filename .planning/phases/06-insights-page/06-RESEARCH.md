# Phase 6: Insights Page (Professional Dashboard) - Research

**Researched:** 2026-01-28
**Domain:** Next.js App Router dashboard + charts + Tauri metrics aggregation
**Confidence:** MEDIUM

## Summary

Phase 6 is primarily a dashboard UX problem (professional KPI + trend charts), but it is gated by data shape: the frontend currently only has `AudioItem` (duration/mtime/size) and transcript text sidecars (`.txt`) with no persisted transcript metadata (language, word count, transcribed minutes). Planning should treat “stats aggregation” as a first-class deliverable (likely via a single Tauri command that returns a normalized dashboard payload).

For charts, use `recharts` and keep all charts in a dedicated Client Component (or dynamically imported Client Component) to avoid SSR issues in the App Router. Recharts also requires explicit sizing; plan chart containers with explicit `h-*` or an aspect ratio wrapper.

For persistence and caching, don’t hand-roll an index file: the repo already ships `@tauri-apps/plugin-store` and has `store:default` enabled in `src-tauri/capabilities/default.json`, so it’s the standard place to cache computed per-recording metadata and/or aggregated dashboard snapshots.

**Primary recommendation:** Implement a single “Insights dashboard payload” model returned by one Tauri command (plus optional plugin-store cache), and render it with KPI cards + Recharts line/bar/pie charts inside a Client Component.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---|---:|---|---|
| `recharts` | `^3.3.0` | Dashboard charts (line/bar/pie/area) | React-native API, no canvas, works well with Tailwind layouts; can be code-split to reduce initial bundle |
| Next.js App Router | `15.1.x` (repo) | Routing + layout | Existing stack |
| Tailwind CSS | `3.4.x` (repo) | Layout + styling | Existing stack |
| Tauri | `2.9.x` (repo) | Local filesystem + Rust compute | Existing stack and required for desktop data access |

### Supporting
| Library | Version | Purpose | When to Use |
|---|---:|---|---|
| `@tauri-apps/plugin-store` | `^2.4.x` (repo) | Persist cached insights/metrics | Cache expensive aggregations; persist per-recording metadata (language/wordcount/transcribedAt) |
| `@tauri-apps/plugin-dialog` | `^2.3.x` (repo) | Export report file picker | Export insights report (JSON/CSV) using the same pattern as transcript export |
| `lucide-react` + Material Symbols | current (repo) | Dashboard iconography | KPI cards, filters, empty/error states |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|---|---|---|
| `recharts` | `chart.js` / `nivo` | Heavier/less “Tailwind-ish” integration; more config; canvas rendering doesn’t buy much for this desktop app |
| plugin-store cache | custom “metrics.json” index | More edge cases (schema migration, atomic writes, corruption handling); plugin-store is already available and permissioned |

**Installation:**
```bash
npm install recharts
```

## Architecture Patterns

### Recommended Project Structure
```
app/
  insights/
    page.tsx                 # Server wrapper OR client page; keep minimal
    InsightsDashboard.tsx     # 'use client' charts + UI
src/
  lib/
    insights/
      types.ts               # Dashboard payload types
      compute.ts             # Frontend-side derived helpers (formatting, bucketing)
      commands.ts            # invoke() wrappers for Tauri insights commands
```

### Pattern 1: “Server wrapper + Client dashboard”
**What:** Keep `app/insights/page.tsx` simple (Server Component by default), and render a Client Component that owns charts + Tauri calls.
**When to use:** Always, because charts and Tauri calls are client-only.

**Pitfall being avoided:** accidentally importing chart libs into server render / SSR.

### Pattern 2: “Single dashboard payload” (Backend-normalized)
**What:** One `invoke('get_library_insights', { folderPath, range })` returns everything needed for the page:
- KPI totals
- time-series arrays for charts
- categorical breakdowns (e.g., language)

**When to use:** Always for performance and correctness; it avoids N×`read_transcript` calls from the UI.

**Why:** In this repo, transcript files are sidecars; iterating them all on the JS thread will cause UI jank. Rust can batch IO and compute quickly.

### Anti-Patterns to Avoid
- **Charting in Server Components:** importing `recharts` in a Server Component increases risk of SSR/runtime errors; keep charts in Client Components.
- **N× transcript reads in React effects:** reading each transcript file with per-recording invokes is slow and hard to cancel; aggregate in one Rust command.
- **“ResponsiveContainer with no height”:** Recharts won’t render if width/height are missing; plan explicit container sizing.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---|---|---|---|
| Chart primitives | Custom SVG charts | `recharts` | Layout/sizing, tooltips, legends, axes, responsive behavior are full of edge cases |
| Metrics persistence | A bespoke JSON index file in the library folder | `@tauri-apps/plugin-store` | Already in repo + permissioned (`store:default`), handles persistence without custom file lifecycle |
| Export path | Custom save dialogs / file writes | `downloadFile()` pattern (`@tauri-apps/plugin-dialog` + `save_export`) | Already implemented and consistent UX |

**Key insight:** A “simple dashboard” becomes data-engineering quickly; investing in a normalized payload + cache prevents repeated rewrites.

## Data Model (Metrics You Can Derive)

## Proposed UI Sections (Professional Dashboard)

Plan the page as a single scrollable dashboard with a consistent grid rhythm (cards in a 12-col grid), aligned to existing app styling (`slate-deep`, `slate-border`, `indigo-primary`).

1. **Top bar / context**
   - Page title + subtitle (e.g. “Insights”, “Across your library”)
   - Time range control (7d / 30d / 90d / all)
   - Folder context (use last scanned folder from store; link to Library to change)
   - Primary action: `Export report` (reuse `downloadFile()` pipeline)

2. **KPI row (INSIGHTS-03)**
   - Total recordings
   - Total recording minutes
   - Transcribed minutes
   - Coverage % (optional but makes the dashboard feel “real”)

3. **Usage & trend charts (INSIGHTS-02)**
   - Line/area chart: recording minutes per day
   - Line chart: transcribed minutes per day (overlay) OR stacked area
   - Bar chart: recordings per day (optional if minutes chart exists)

4. **Breakdowns (INSIGHTS-03)**
   - Donut/pie: language distribution (requires persisted language)
   - Histogram bar chart: duration buckets

5. **Detail table (optional but adds “professional” feel)**
   - Recent recordings list with: date, duration, “has transcript”, language (if known)

6. **Empty/error/loading states**
   - Empty: no library scanned yet (CTA: “Sync Device” -> navigate to Library)
   - Partial: library exists but no transcripts
   - Error: Tauri command failure

### Existing raw inputs (confirmed in repo)
- `AudioItem` (`src/lib/types.ts`): `id`, `name`, `path`, `size`, `mtime` (unix seconds), `duration?` (seconds)
- Transcript sidecar per recording: `recording.with_extension("txt")` read via `read_transcript` (Rust), exposed as `readTranscript(audioPath)` (TS)
- Existing export pipeline: `downloadFile()` uses Tauri dialog + `invoke('save_export', { path, content })` (`src/lib/transcription/export.ts`)
- Tauri store plugin: enabled and permissioned in `src-tauri/capabilities/default.json` (`store:default`)

### KPI metrics (INSIGHTS-03)
Plan to compute (per selected library folder):
- `totalRecordings`: count of `AudioItem`
- `totalRecordingMinutes`: `sum(duration) / 60`
- `transcribedRecordings`: count where transcript exists
- `transcribedMinutes`: sum of “transcribed duration” (see note below)
- `transcriptionCoveragePct`: `transcribedMinutes / totalRecordingMinutes`
- `totalTranscriptWords`: sum of `wordCount(transcriptText)`
- `avgRecordingMinutes`: `totalRecordingMinutes / totalRecordings`

**Important gap:** “transcription minutes” and “language distribution” are not currently persisted. A `.txt` transcript alone doesn’t carry language, and transcript duration may differ from audio duration. Plan to persist per-recording transcription metadata at transcription time (recommended: store plugin) so the dashboard can be accurate.

### Time-series metrics (INSIGHTS-02)
Use `AudioItem.mtime` (modified time) as the timestamp for trend bucketing unless/until you add `createdAt`:
- `recordingsPerDay`: count by day
- `recordingMinutesPerDay`: sum(duration) by day
- `transcribedMinutesPerDay`: sum(transcribedMinutes) by day

### Categorical metrics
- `languageDistribution`: map `language -> transcribedMinutes` and/or `count` (requires persisted language)
- `recordingDurationBuckets`: histogram buckets (e.g., 0–2m, 2–5m, 5–15m, 15m+)
- `fileTypeDistribution`: by extension (`mp3`/`m4a`/`wav`) (available from `AudioItem.path`)

## Common Pitfalls

## Tauri-Specific Considerations

- **Do heavy aggregation in Rust:** a single command can scan files + compute histograms/time buckets faster than the JS thread; keep the page responsive.
- **Prefer async commands for heavy work:** Tauri docs recommend async commands to avoid UI freezes. https://v2.tauri.app/develop/calling-rust/
- **Use capabilities-aware plugins for persistence:** plugin-store is already enabled and permissioned (`store:default`), so caching is low-friction. https://v2.tauri.app/plugin/store/
- **Keep dashboard data local-first:** avoid any Next.js server dependencies; in Tauri, the webview should be able to render with no backend web server.
- **Export uses existing pattern:** build a JSON/CSV report string and call `downloadFile()` (dialog + `save_export`).

### Pitfall 1: Charts don’t render (size is 0)
**What goes wrong:** Recharts renders nothing when the container has no explicit width/height.
**Why it happens:** In flex layouts, children can collapse to 0 height; `ResponsiveContainer` requires a parent with defined size.
**How to avoid:** Wrap each chart in a container with explicit height (`h-56`, `h-72`) or fixed `height={...}`.
**Source:** Recharts “Chart size” guide notes charts need width/height and `ResponsiveContainer` must have a parent with defined size. https://recharts.github.io/en-US/guide/sizes/

### Pitfall 2: SSR / hydration issues with chart libraries
**What goes wrong:** Importing chart libraries in Server Components can crash or cause mismatches.
**How to avoid:** Keep chart rendering inside a Client Component (`'use client'`) and optionally lazy-load it with `next/dynamic`.
**Extra guard:** If you render charts immediately on mount, consider setting `ResponsiveContainer.initialDimension` to prevent a 0x0 first paint / layout shift.
**Source:** Next.js Lazy Loading guide documents `next/dynamic` and `ssr: false` behavior and notes `ssr: false` is not allowed in Server Components. https://nextjs.org/docs/app/guides/lazy-loading

### Pitfall 3: UI jank from scanning/reading many transcripts in React
**What goes wrong:** large libraries cause long UI stalls or “setState after unmount” races.
**How to avoid:** aggregate in a single async Rust command, and keep React state updates coarse (one payload set).
**Source:** Tauri recommends async commands for heavy work to avoid UI freezes. https://v2.tauri.app/develop/calling-rust/

### Pitfall 4: Capability/permission failures when adding persistence
**What goes wrong:** plugin calls fail if not allowed by capabilities.
**How to avoid:** ensure `store:default` remains enabled for the main window.
**Source:** Tauri store plugin docs + capabilities docs. https://v2.tauri.app/plugin/store/ and https://v2.tauri.app/security/capabilities/

## Code Examples

### Recharts: responsive line chart
```tsx
// Source: https://context7.com/recharts/recharts/llms.txt
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

export function MinutesOverTimeChart({ data }: { data: Array<{ name: string; minutes: number }> }) {
  return (
    <div className="h-64">{/* parent provides height */}
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Line type="monotone" dataKey="minutes" stroke="#6366f1" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
```

### Next.js: lazy-load chart-heavy Client Component
```tsx
// Source: https://nextjs.org/docs/app/guides/lazy-loading
'use client'

import dynamic from 'next/dynamic'

export const InsightsCharts = dynamic(() => import('./InsightsCharts'), {
  ssr: false,
  loading: () => <div className="h-64 animate-pulse bg-slate-surface rounded-xl" />,
})
```

### Tauri store: cache aggregated dashboard payload
```ts
// Source: https://v2.tauri.app/plugin/store/
import { load } from '@tauri-apps/plugin-store'

export async function loadInsightsCache() {
  const store = await load('insights-cache.json', { autoSave: false })
  const cached = await store.get('dashboard:v1')
  return { store, cached }
}
```

### Recharts: avoid first paint 0x0 with initialDimension
```tsx
// Source: https://recharts.github.io/en-US/api/ResponsiveContainer/
import { ResponsiveContainer } from 'recharts'

export function ChartFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="h-64">
      <ResponsiveContainer
        width="100%"
        height="100%"
        initialDimension={{ width: 800, height: 256 }}
      >
        {children}
      </ResponsiveContainer>
    </div>
  )
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|---|---|---|---|
| Only `ResponsiveContainer` for resizing | Chart-level `responsive` prop (Recharts 3.3+) | Recharts 3.3 | Fewer wrapper quirks in some layouts; still requires explicit sizing | 

**Relevant note:** Recharts “Chart size” guide documents the `responsive` prop and that it was introduced in 3.3. https://recharts.github.io/en-US/guide/sizes/

## Open Questions

1. **How do we compute “transcription minutes” accurately?**
   - What we know: `AudioItem.duration` exists; transcripts are `.txt` sidecars.
   - What’s unclear: whether “transcribed minutes” should mean audio duration (if transcript exists) vs actual transcript duration from Whisper (not persisted today).
   - Recommendation: in Phase 6 planning, define “transcribedMinutes = audio.duration when transcript exists” as MVP, and add persisted transcript metadata later (or in Phase 6 if INSIGHTS requires accuracy).

2. **Where does language come from for existing transcripts?**
   - What we know: Whisper transcription returns `language`, but it is not stored in `.txt`.
   - What’s unclear: whether language is stored anywhere else (it doesn’t appear to be).
   - Recommendation: persist per-recording language at transcription time (store plugin) so language distribution is real.

## Sources

### Primary (HIGH confidence)
- Recharts chart sizing guide (width/height requirements; responsive behavior): https://recharts.github.io/en-US/guide/sizes/
- Recharts `ResponsiveContainer` API (uses `ResizeObserver`): https://recharts.github.io/en-US/api/ResponsiveContainer/
- Next.js App Router lazy loading + `next/dynamic` / `ssr: false`: https://nextjs.org/docs/app/guides/lazy-loading
- Tauri store plugin overview + usage + permissions: https://v2.tauri.app/plugin/store/
- Tauri “Calling Rust from the Frontend” (async commands guidance): https://v2.tauri.app/develop/calling-rust/
- Tauri capabilities overview: https://v2.tauri.app/security/capabilities/

### Secondary (MEDIUM confidence)
- Recharts code examples via Context7: https://context7.com/recharts/recharts/llms.txt

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - verified in repo + official docs
- Architecture: MEDIUM - derived from repo constraints + documented SSR/lazy loading constraints
- Pitfalls: HIGH - chart sizing + Next dynamic/SSR constraints + Tauri async guidance are documented

**Research date:** 2026-01-28
**Valid until:** 2026-02-27
