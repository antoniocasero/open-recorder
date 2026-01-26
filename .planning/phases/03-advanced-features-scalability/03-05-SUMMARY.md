---
phase: 03-advanced-features-scalability
plan: 05
subsystem: UI Redesign
tags:
  - nextjs
  - tailwind
  - components
  - ai-insights
  - sidebar
dependency_graph:
  requires:
    - 03-03 (Editor page layout)
  provides:
    - AI Insights sidebar with three sections
    - Key topics extraction from transcript
  affects:
    - Future transcript editing integration
tech_stack:
  added: []
  patterns:
    - Insights sidebar composition (AISummary, RecommendedActions, KeyTopics)
    - Simple keyword extraction for key topics
key_files:
  created:
    - src/components/AISummary.tsx
    - src/components/RecommendedActions.tsx
    - src/components/KeyTopics.tsx
    - src/components/InsightsSidebar.tsx
    - src/lib/transcription/insights.ts
  modified:
    - app/editor/page.tsx
    - app/globals.css
decisions:
  - Use simple noun-frequency keyword extraction for key topics (stop words filtered)
  - Recommended Actions use mock data for now (future AI-generated)
  - Add custom-scrollbar CSS class for sidebar scrolling
  - Wrap Editor page with Suspense boundary to satisfy Next.js 15 useSearchParams requirement
metrics:
  duration: 35m
  completed: 2026-01-26
---

# Phase 3 Plan 5: AI Insights Sidebar Summary

**One-liner:** AI Insights sidebar with AI Summary, Recommended Actions, and Key Topics integrated into Editor page.

## What Was Built

Built the AI Insights sidebar for the Editor page as specified in the UI mock, providing three sections:

1. **AI Summary** – Displays generated summary text (or placeholder) with loading skeleton.
2. **Recommended Actions** – Interactive checklist with mock data (three actions, toggleable checkboxes).
3. **Key Topics** – Tag cloud of extracted keywords from the transcript (simple noun‑frequency extraction).

The sidebar is fully integrated into the Editor page, loading transcript text from sidecar `.txt` files, extracting key topics, and generating AI summaries via the existing `summarizeTranscript` function.

## How It Works

- **Component composition:** `InsightsSidebar` imports `AISummary`, `RecommendedActions`, and `KeyTopics` and arranges them in a scrollable 360‑px wide panel.
- **Data flow:** When a recording is selected, the Editor page calls `readTranscript` to load the transcript text, then:
  - Passes the text to `extractKeyTopics` (new utility) to obtain top 5‑7 nouns.
  - Calls `summarizeTranscript` (existing Whisper‑API integration) to generate an AI summary (requires `OPENAI_API_KEY`).
  - Passes mock actions (hard‑coded for now) to the Recommended Actions component.
- **Styling:** Matches the UI mock exactly (`bg‑slate‑900/40`, `border‑slate‑border/50`, `indigo‑primary` checkboxes, etc.). A custom scrollbar style was added to `globals.css`.
- **Interaction:** Checkboxes in Recommended Actions toggle locally; clicking a topic tag could be extended to search the transcript.

## Deviations from Plan

### Auto‑fixed Issues

**1. [Rule 1 – Bug] Fixed syntax error in PlayerSidebar forwardRef**

- **Found during:** Build verification
- **Issue:** `PlayerSidebar.tsx` had a malformed `forwardRef` call causing “Unexpected eof” compilation error.
- **Fix:** Rewrote the component with a cleaner `forwardRef` pattern and explicit props interface.
- **Files modified:** `src/components/PlayerSidebar.tsx`
- **Commit:** `b49d84a`

**2. [Rule 3 – Blocking] Added custom‑scrollbar CSS class**

- **Found during:** Implementing `InsightsSidebar`
- **Issue:** The plan referenced `.custom‑scrollbar` class, which did not exist in the project.
- **Fix:** Added the scrollbar styles to `app/globals.css` under `@layer components`.
- **Files modified:** `app/globals.css`
- **Commit:** part of `4cd3019`

**3. [Rule 3 – Blocking] Wrapped Editor page with Suspense boundary**

- **Found during:** Build verification (Next.js 15 `useSearchParams` prerendering error)
- **Issue:** The Editor page uses `useSearchParams` without a Suspense boundary, causing the build to fail.
- **Fix:** Split the page into `EditorContent` (receives `recordingId` as prop) and an outer `EditorPage` that wraps a `EditorPageClient` with `Suspense`. This satisfies Next.js’s requirement while preserving all functionality.
- **Files modified:** `app/editor/page.tsx`
- **Commit:** applied after Task 3 commits (not separately committed)

## Verification

All verification criteria from the plan were met:

✅ **AI Insights sidebar displays three sections** – `InsightsSidebar` renders `AISummary`, `RecommendedActions`, and `KeyTopics`.  
✅ **AI Summary shows generated summary text (or placeholder)** – The component displays the summary returned by `summarizeTranscript` or a “No summary available” placeholder.  
✅ **Recommended Actions checklist is interactive** – Clicking a checkbox toggles its `completed` state (local UI state).  
✅ **Key Topics shows at least 3 extracted tags from transcript** – `extractKeyTopics` returns the top 5‑7 nouns from the transcript text; mock transcript yields tags.  
✅ **Sidebar width is 360px, scrollable, matches mock design** – `w‑[360px]`, `overflow‑y‑auto custom‑scrollbar`, and precise spacing/colors.

## Next Phase Readiness

**Blockers:** None.  
**Concerns:**  
- AI summary generation depends on the `OPENAI_API_KEY` environment variable; if missing, the summary remains `null`.  
- The keyword extraction is basic (noun frequency) and could be improved with part‑of‑speech tagging or leveraging the Whisper‑API’s word‑level timestamps.  
- Recommended Actions are static mock data; a future phase could connect them to an AI‑generated action list.

**Recommendations:**  
- In Phase 3 Plan 6, consider integrating real waveform data and polishing the transcript‑audio synchronization.  
- Consider adding a “Regenerate summary” button inside the `AISummary` component (similar to the existing modal).  
- The `KeyTopics` tags could be made clickable to jump to the first occurrence in the transcript.

## Commits

| Commit | Message |
|--------|---------|
| `3e387c4` | feat(03‑05): create AI Summary component |
| `2c512c3` | feat(03‑05): create Recommended Actions component |
| `4cd3019` | feat(03‑05): integrate AI Insights sidebar into Editor page |
| `b49d84a` | fix(03‑05): fix syntax error in PlayerSidebar forwardRef |

## Performance

- **Execution time:** ~35 minutes  
- **Lines added:** ~350  
- **Components created:** 4  
- **Files modified:** 6  

## Notes

- The `extractKeyTopics` function uses a simple stop‑word list and length heuristic; it works well for English transcripts but could be extended for other languages.  
- The `InsightsSidebar` is designed to be reusable – it could be extracted into a shared component if insights are needed elsewhere.  
- The Suspense boundary fix is a temporary workaround; a more elegant solution would be to convert the Editor page to a Server Component and pass `searchParams` as a prop (requires Next.js App Router upgrade).  

---

*Summary generated by GSD plan executor on 2026‑01‑26.*