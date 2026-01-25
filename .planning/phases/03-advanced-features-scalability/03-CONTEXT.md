# Phase 3 Context: UI Redesign

## Overview

Phase 3 focuses on redesigning the user interface from a single‑page dashboard to a three‑page application (Library, Editor, Insights). This context captures decisions about the new UI structure, component breakdown, and migration strategy.

**Scope:** Implement Library page and Editor page based on provided UI mocks. Insights page is out of scope for this phase (placeholder only).

**Source assets:** UX mocks in `/Users/acaserop/Documents/Project/open-recorder-usb/apps/mac/ux-design/`
- `library_page/code.html` + `screen.png`
- `editor_page/code.html` + `screen.png`

## Pages

### 1. Library Page (`/library`)
**Purpose:** Browse and manage all recordings.

**Layout:**
```
┌─────────────────────────────────────────────┐
│ Header (logo, nav, new‑recording, user)     │
├─────────────┬───────────────────────────────┤
│ Left sidebar│ Main content (table)          │
│ (Filters)   │                               │
│             │                               │
├─────────────┼───────────────────────────────┤
│ Footer (totals, sync status)                │
└─────────────┴───────────────────────────────┘
```

**Key components:**
- `Header` (shared)
- `SidebarFilters` (Recent, Transcribed, Favorites)
- `RecordingsTable` (waveform, title, date, duration, status, actions)
- `Footer` (shared)

### 2. Editor Page (`/editor`)
**Purpose:** View and interact with a single recording’s transcript and AI insights.

**Layout:**
```
┌──────────────────────────────────────────────────────────┐
│ Header (logo, nav, settings, user)                       │
├──────────────┬────────────────────────────┬──────────────┤
│ Left sidebar │ Main content               │ Right sidebar│
│ (Player,     │ (Transcript, search,       │ (AI Insights)│
│  waveform)   │  edit/export buttons)      │              │
│              │                            │              │
├──────────────┼────────────────────────────┼──────────────┤
│ Footer (auto‑scroll, word count, shortcuts)              │
└──────────────┴────────────────────────────┴──────────────┘
```

**Key components:**
- `Header` (shared)
- `PlayerSidebar` (waveform, playback controls, metadata)
- `TranscriptView` (speaker‑segmented transcript with timestamps)
- `SearchBar` (keyword search within transcript)
- `ActionButtons` (Edit, Export)
- `InsightsSidebar` (AI Summary, Recommended Actions, Key Topics)
- `Footer` (shared)

### 3. Insights Page (`/insights`)
**Purpose:** (Placeholder) Overview metrics across all recordings.
**Implementation:** Not in scope for this phase. Will show a simple “Coming Soon” message.

## Routing Strategy

**Decision:** Use Next.js App Router with file‑based routing.

```
app/
├── layout.tsx          # Shared header + footer
├── page.tsx           → redirects to /library
├── library/
│   └── page.tsx       # Library page
├── editor/
│   └── page.tsx       # Editor page
└── insights/
    └── page.tsx       # Placeholder
```

**Navigation:** Header contains links to `/library`, `/editor`, `/insights`. Active link highlighted.

**State persistence:** Selected recording ID passed via query parameter (`/editor?recording=id`). Library table rows link to `/editor?id=…`.

## Component Mapping from Existing Code

| Existing Component | New Location | Changes Needed |
|-------------------|--------------|----------------|
| `Dashboard`       | Retired      | Split into pages |
| `RecordingsList`  | Library page | Convert to table with columns, add status badges, waveform placeholder |
| `Player`          | Editor left sidebar | Enhance with waveform visualization, skip‑back/forward buttons |
| `Transcription`   | Editor main content | Expand to speaker‑segmented view, timestamp links, keyword highlighting |
| Search (in Dashboard) | Editor search bar | Move to editor, keep same search logic |
| AI Summary (Phase 2) | Editor right sidebar | Reuse existing AI summary, add Recommended Actions and Key Topics |

## New Components Required

### Library Page
1. `RecordingsTable` – Table with columns: waveform, title, date, duration, status, actions
2. `StatusBadge` – Badges for “Transcribed”, “Audio Only”, “Favorited”, “Transcribing…”
3. `WaveformPlaceholder` – Simple bar visualization (static for now)

### Editor Page
1. `PlayerSidebar` – Combined player + waveform + metadata
2. `TranscriptView` – Speaker‑segmented transcript with click‑to‑play timestamps
3. `InsightsSidebar` – AI insights panel with three sections
4. `SearchBar` – Dedicated transcript search
5. `ActionButtons` – Edit and Export buttons

### Shared
1. `Header` – Logo, navigation, user area, “New Recording” button (library only)
2. `Footer` – Page‑specific stats (totals vs. word count)

## Data & State

### Recording Status
Each recording needs a `status` field derived from:
- Has transcript file → “Transcribed”
- No transcript, has audio → “Audio Only”
- Transcription in progress → “Transcribing…” (future)
- User‑marked favorite → “Favorited” (future)

### Selected Recording
- Library → Editor transition passes `recordingId` via URL
- Editor loads recording details, transcript, and AI insights

### AI Insights
- **AI Summary**: Already implemented (Phase 2)
- **Recommended Actions**: Mock data for now (future: AI‑generated)
- **Key Topics**: Extract from transcript (simple keyword extraction)

## Implementation Decisions

### 1. Waveform Visualization
**Short‑term:** Use static bar representation (like mocks) with random heights.
**Long‑term:** Integrate `wavesurfer.js` or generate waveform data via Rust backend (post‑Phase 3).

### 2. Speaker Diarization
**Current:** Phase 2 added speaker identification via Whisper‑based diarization.
**Use:** Show speaker labels (Interviewer, Speaker 1, Speaker 2) in transcript.

### 3. Keyword Highlighting
**Approach:** Use simple regex matching for search terms; highlight matches in transcript.

### 4. Navigation State
**Approach:** Use Next.js `useRouter` for page navigation; highlight active link via `pathname`.

### 5. Styling & Theme
**Base:** Dark theme already present.
**Tailwind:** Extend color palette to match mocks (`slate‑deep`, `indigo‑primary`, etc.).
**Icons:** Use `Material Symbols Outlined` (as in mocks) instead of Lucide React.

### 6. Responsiveness
**Constraint:** Desktop‑only app; assume fixed‑width sidebars.

## Success Criteria (Derived from Mocks)

### Library Page
- [ ] User sees table with waveform column (static bars)
- [ ] Each row shows title, date, duration, status badge
- [ ] Status badges reflect actual transcript presence
- [ ] Clicking a row navigates to editor with that recording
- [ ] Left sidebar filters are present (non‑functional for now)
- [ ] Footer shows total recordings and total duration

### Editor Page
- [ ] Left sidebar shows selected recording’s title, metadata, waveform, playback controls
- [ ] Playback works (play/pause, skip ±10s)
- [ ] Main area shows speaker‑segmented transcript with timestamps
- [ ] Clicking a timestamp seeks audio to that position
- [ ] Search bar filters transcript lines by keyword
- [ ] Right sidebar shows AI Summary (existing feature)
- [ ] Right sidebar shows Recommended Actions (mock data)
- [ ] Right sidebar shows Key Topics (extracted from transcript)
- [ ] Footer shows word count, language, auto‑scroll status

### Shared
- [ ] Header navigation works (Library ↔ Editor ↔ Insights)
- [ ] Active page highlighted in nav
- [ ] “New Recording” button appears only on Library page
- [ ] User avatar appears in header

## Open Questions

1. **Waveform data generation** – Should we implement real waveform analysis in this phase?
   → **Decision:** No. Use placeholder bars.

2. **Recommended Actions source** – AI‑generated or manual?
   → **Decision:** Mock data for now; can be extended later.

3. **Key Topics extraction** – Simple noun‑phrase extraction or use existing AI summary?
   → **Decision:** Extract top 5‑10 nouns from transcript (basic NLP).

4. **Status “Favorited”** – Need favorite‑toggle UI?
   → **Decision:** Defer; status badge only for now.

5. **Insights page placeholder** – What to show?
   → **Decision:** “Coming Soon” message with link to roadmap.

## Next Steps

1. **Research:** Confirm Material Symbols integration with Next.js.
2. **Plan:** Break implementation into 4‑6 focused plans (routing, library page, editor page, shared components, etc.).
3. **Execute:** Follow GSD planning workflow.

---
*Context created: 2026‑01‑25*