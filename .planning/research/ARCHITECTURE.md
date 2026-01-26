# Architecture Patterns

**Domain:** Desktop audio recorder with transcription, editing, search, export, AI summarization, and insights
**Researched:** January 26, 2026
**Confidence:** HIGH

## Recommended Architecture

### System Overview (Existing + New)

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                                 Frontend UI Layer                                        │
├─────────────────────────────────────────────────────────────────────────────────────────┤
│ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐   │
│ │   Library    │ │    Editor    │ │   Insights   │ │  Settings    │ │  Transcription│   │
│ │    Page      │ │    Page      │ │    Page      │ │    Page      │ │   Components  │   │
│ └──────┬───────┘ └──────┬───────┘ └──────┬───────┘ └──────┬───────┘ └──────┬───────┘   │
│        │                │                 │                │                │            │
├────────┴────────────────┴─────────────────┴────────────────┴────────────────┴────────────┤
│                                   Command Layer                                           │
├─────────────────────────────────────────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────────────────────────────────────────┐  │
│ │                    Tauri Invoke (TypeScript wrappers)                               │  │
│ │  • getRecordings()                                                                  │  │
│ │  • transcribeAudio()                                                                │  │
│ │  • getInsightsData()                                                                │  │
│ │  • getLanguageSettings() / setLanguage()                                            │  │
│ │  • getEditorState() / setEditorState()                                              │  │
│ └────────────────────────────────────┬────────────────────────────────────────────────┘  │
├──────────────────────────────────────┼────────────────────────────────────────────────────┤
│                                  Backend Service Layer                                    │
├─────────────────────────────────────────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────────────────────────────────────────┐  │
│ │                              Rust Commands                                          │  │
│ │  • File system scanning                                                             │  │
│ │  • OpenAI transcription                                                             │  │
│ │  • Insights aggregation (compute stats from transcript files)                       │  │
│ │  • Store management (config.json)                                                   │  │
│ └────────────────────────────────────┬────────────────────────────────────────────────┘  │
├──────────────────────────────────────┼────────────────────────────────────────────────────┤
│                                  External Services                                       │
├─────────────────────────────────────────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────────────────────────────────────────┐  │
│ │                           OpenAI Whisper API                                        │  │
│ └─────────────────────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Typical Implementation |
|-----------|----------------|------------------------|
| **Existing Components** | | |
| Transcription Button | Trigger transcription flow per recording, show spinner during processing | React component in RecordingsList row, uses local state for loading |
| Transcription Modal | Display transcript text with word‑level timestamps, allow copy/close | Modal component that receives transcript data via props |
| Toast Notification | Show success/error feedback after transcription completes | react‑hot‑toast |
| **New Components** | | |
| Insights Page | Display charts and statistics about transcription activity | Next.js page (`/insights`) with Recharts components |
| Language Selector | Dropdown for choosing UI language | React component using i18next `useTranslation` and `changeLanguage` |
| Settings Page | Manage language preference and other settings | Page with form, connected to Tauri store |
| Editor State Persistence | Save/restore UI state (expanded panels, selected options) | Custom hook `usePersistedState` using Tauri store |
| Chart Components (Bar, Line, Pie) | Visualize transcription metrics | Recharts `<BarChart>`, `<LineChart>`, `<PieChart>` with Tailwind styling |

## New Architecture Patterns for v1.1

### Pattern 1: Client‑Side Internationalization

**What:** Use i18next with JSON translation files stored in `public/locales/`. Language preference saved in Tauri store.

**When to use:** Any desktop app needing multi‑language UI without server‑side rendering.

**Trade‑offs:**
- **Pros:** Simple setup, works with static export, dynamic language switching.
- **Cons:** Translation files increase bundle size (manageable), no built‑in pluralization rules for all languages.

**Example:**
```typescript
// src/lib/i18n/config.ts
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import Backend from 'i18next-http-backend'; // loads translations from /public

i18n.use(Backend).use(initReactI18next).init({
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
});
```

### Pattern 2: Chart‑Driven Insights Page

**What:** Use Recharts to render SVG‑based charts from aggregated transcription data.

**When to use:** When you need to visualize usage statistics, trends, distributions.

**Trade‑offs:**
- **Pros:** React‑native, good documentation, customizable.
- **Cons:** Adds ~20 kB gzipped, requires data aggregation logic.

**Example:**
```typescript
// src/components/Insights/TranscriptionStatsChart.tsx
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

export default function TranscriptionStatsChart({ data }) {
  return (
    <BarChart data={data}>
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis dataKey="date" />
      <YAxis />
      <Tooltip />
      <Bar dataKey="count" fill="#3b82f6" />
    </BarChart>
  );
}
```

### Pattern 3: Persistent UI State with Tauri Store

**What:** Extend existing `@tauri‑apps/plugin‑store` usage to persist editor‑page UI state (e.g., expanded panels, selected options).

**When to use:** For any UI state that should survive app restarts.

**Trade‑offs:**
- **Pros:** No need for additional libraries, consistent with existing storage pattern.
- **Cons:** Store is asynchronous; need to handle loading states.

**Example:**
```typescript
// src/lib/store/editor.ts
import { getStore } from '../fs/config';

export async function getEditorState(): Promise<EditorState | null> {
  const store = await getStore();
  return await store.get<EditorState>('editorState');
}

export async function setEditorState(state: EditorState): Promise<void> {
  const store = await getStore();
  await store.set('editorState', state);
  await store.save();
}
```

### Pattern 4: Sticky Footer with Tailwind

**What:** Use `position: sticky` and Tailwind utilities to keep footer elements visible during scrolling.

**When to use:** For pagination controls, action bars that should remain accessible.

**Trade‑offs:**
- **Pros:** Pure CSS, no JavaScript, works across browsers.
- **Cons:** May cause layout shifts if content height changes.

**Example:**
```html
<div className="sticky bottom-0 bg-white border-t px-4 py-2">
  <!-- pagination controls -->
</div>
```

## Data Flow for New Features

### Insights Page Data Flow

```
User navigates to /insights
    ↓
Page loads → useEffect fetches aggregated data via Tauri command `getInsightsData`
    ↓
Rust command scans transcript files, computes statistics (counts, durations, languages)
    ↓
Returns JSON with aggregated data
    ↓
React component passes data to Recharts components
    ↓
Charts render with Tailwind styling
```

### Language Settings Data Flow

```
User opens Settings page
    ↓
Dropdown loads current language from Tauri store (`getLanguage`)
    ↓
User selects new language → calls `setLanguage` command
    ↓
Rust saves language code to store
    ↓
Frontend calls i18next `changeLanguage(lng)`
    ↓
i18next loads translation JSON from /public/locales/{lng}/translation.json
    ↓
UI re‑renders with new translations (no page reload)
```

### Editor Persistent State Flow

```
Editor page mounts
    ↓
useEffect calls `getEditorState` command
    ↓
Rust retrieves serialized state from store
    ↓
State applied to UI (expand panels, select options)
    ↓
User interacts → state changes → debounced `setEditorState` calls
    ↓
Rust saves updated state to store (automatically on app exit)
```

## Scaling Considerations

| Concern | At 100 recordings | At 10k recordings | At 100k recordings |
|---------|-------------------|-------------------|-------------------|
| **Insights aggregation** | In‑memory Rust computation (<1s) | Background thread, cache results | Pre‑computed stats, incremental updates |
| **Translation files** | JSON files in /public (negligible) | Same (no scaling issue) | Same |
| **UI state storage** | Store size <10 KB | Store size <1 MB | Consider splitting stores by feature |

## Anti‑Patterns to Avoid

### Anti‑Pattern 1: Storing Translations in Frontend State

**What people do:** Keep translation strings in React context or useState.

**Why it's wrong:** Bloat context, harder to manage dynamic language switching, no support for pluralization.

**Do this instead:** Use i18next with dedicated JSON files and its built‑in caching.

### Anti‑Pattern 2: Direct DOM Manipulation for Sticky Footer

**What people do:** Use JavaScript to calculate scroll position and adjust footer position.

**Why it's wrong:** Over‑engineering, janky scroll performance, harder to maintain.

**Do this instead:** Use CSS `position: sticky` with Tailwind utilities.

### Anti‑Pattern 3: Chart Library Over‑Customization

**What people do:** Spend excessive time tweaking chart aesthetics beyond what users need.

**Why it's wrong:** Diminishing returns, increases code complexity, delays feature delivery.

**Do this instead:** Use Recharts defaults with Tailwind colors; customize only essential brand alignment.

### Anti‑Pattern 4: Blocking UI on Store Reads

**What people do:** Await Tauri store read synchronously during component render.

**Why it's wrong:** Freezes UI until store loads, poor user experience.

**Do this instead:** Use React suspense or loading states, load store asynchronously in useEffect.

## Integration Points

### External Libraries

| Library | Integration Point | Notes |
|---------|------------------|-------|
| **Recharts** | Import in Insights page components | Peer dependencies satisfied (React 19). Use tree‑shaking. |
| **i18next / react‑i18next** | Initialize in `_app.tsx` or root layout | Load translations via HTTP backend from `/public/locales`. |
| **Tauri plugin‑store** | Extended `src/lib/fs/config.ts` | Already used for last‑folder persistence; add new keys for language and editor state. |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| Frontend ↔ Backend (Insights) | New Tauri command `get_insights_data` | Returns aggregated statistics JSON. |
| Frontend ↔ Backend (Language) | Extend existing store commands | Use same store file (`config.json`). |
| Frontend ↔ Backend (Editor state) | Extend existing store commands | Store as JSON object. |
| React ↔ Recharts | Props drilling | Pass data as array of objects. |
| React ↔ i18next | `useTranslation` hook | Access `t()` function. |

## Recommended Project Structure Additions

```
src/
├── components/
│   ├── Insights/
│   │   ├── TranscriptionStatsChart.tsx
│   │   ├── LanguageDistributionChart.tsx
│   │   └── DurationTrendChart.tsx
│   ├── Settings/
│   │   ├── LanguageSelector.tsx
│   │   └── SettingsPage.tsx
│   └── Editor/
│       └── usePersistedState.ts   # custom hook
├── lib/
│   ├── i18n/
│   │   ├── config.ts              # i18next initialization
│   │   └── resources.ts           # type‑safe translation keys
│   ├── insights/
│   │   ├── commands.ts            # getInsightsData wrapper
│   │   └── types.ts               # AggregatedData interface
│   └── store/
│       ├── editor.ts              # getEditorState / setEditorState
│       └── language.ts            # getLanguage / setLanguage
src‑tauri/
├── src/
│   ├── commands/
│   │   ├── insights.rs            # compute aggregated stats
│   │   ├── language.rs            # store language preference
│   │   └── editor_state.rs        # store editor UI state
│   └── lib.rs
public/
└── locales/
    ├── en/
    │   └── translation.json
    ├── es/
    │   └── translation.json
    └── fr/
        └── translation.json
```

## Sources

- **Recharts documentation** – Official docs (recharts.github.io)
- **i18next documentation** – Official docs (react.i18next.com)
- **Tauri plugin‑store documentation** – Official docs (tauri.app)
- **Existing project architecture** – Already validated patterns

---
*Architecture research for: Open Recorder Tauri v1.1 (insights page, UI fixes, language settings)*  
*Researched: January 26, 2026*