---
phase: 06-insights-page
plan: 01
subsystem: ui
tags: [insights, transcription, metadata, tauri-store, whisper]

# Dependency graph
requires:
  - phase: 01-transcription-mvp
    provides: Whisper transcription command returning language + duration
  - phase: 05-editor-state-persistence
    provides: Store-backed config.json helpers
provides:
  - Store-backed transcription metadata map keyed by audio path
  - UI wiring to persist language + duration metadata on transcription completion
affects: [06-insights-page, INSIGHTS-03]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Persist derived per-recording analytics inputs in config.json store (keyed by audio path)

key-files:
  created: [app/not-found.tsx]
  modified:
    - src/lib/fs/config.ts
    - src/components/RecordingsTable.tsx
    - src/components/RecordingsList.tsx
    - app/page.tsx

key-decisions:
  - "Use a single config store key (transcriptionMetaByPath) keyed by full audio path to keep Insights lookups simple"

patterns-established:
  - "Best-effort metadata writes: store persistence failures should not block transcription UX"

# Metrics
duration: 6min
completed: 2026-01-28
---

# Phase 6 Plan 01: Insights Transcription Metadata Summary

**Per-recording transcription metadata (language + durations + timestamps) persisted in config.json so Insights can compute language distribution and totals without parsing .txt sidecars**

## Performance

- **Duration:** 6 min
- **Started:** 2026-01-28T08:51:09Z
- **Completed:** 2026-01-28T08:57:01Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments

- Added `TranscriptionMeta` + get/set/list helpers backed by the existing Tauri store
- Wired single + batch transcription flows to persist metadata after successful transcription
- Backfilled minimal metadata when opening an existing transcript sidecar

## Task Commits

Each task was committed atomically:

1. **Task 1: Add store-backed transcription metadata helpers** - `b7e8fbc` (feat)
2. **Task 2: Persist metadata on transcription completion (single + batch)** - `be64cb2` (feat)

_Additional (unplanned) blocker fix:_ `f7250fb` (fix)

## Files Created/Modified

- `src/lib/fs/config.ts` - Adds `TranscriptionMeta` and helpers storing `transcriptionMetaByPath` in config.json
- `src/components/RecordingsTable.tsx` - Persists metadata after `transcribeAudio()` and when opening existing transcripts
- `src/components/RecordingsList.tsx` - Persists metadata for single and batch transcription results
- `app/page.tsx` - Uses client-side navigation for static export compatibility
- `app/not-found.tsx` - Provides a not-found page so Next export can generate `/_not-found`

## Decisions Made

- Use one store key (`transcriptionMetaByPath`) keyed by full audio path so Insights can fetch all metadata in one call.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Unblocked `next build` for static export**

- **Found during:** Task 1 (verification: `npm run build`)
- **Issue:** Next export failed to generate `/_not-found` due to missing not-found page and a server redirect on `/`.
- **Fix:** Added `app/not-found.tsx` and switched `/` to a client-side `router.replace('/library')`.
- **Files modified:** `app/page.tsx`, `app/not-found.tsx`
- **Verification:** `npm run build` succeeds and exports routes including `/_not-found`.
- **Committed in:** `f7250fb`

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Required to satisfy plan verification (`npm run build`). No scope creep.

## Issues Encountered

- None beyond the static export build blocker (handled via deviation Rule 3).

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Insights can now load transcription metadata (language + durations) from the config store for aggregation.
- Remaining Insights plans (06-02 / 06-03) can build on `getAllTranscriptionMeta()`.

---
*Phase: 06-insights-page*
*Completed: 2026-01-28*
