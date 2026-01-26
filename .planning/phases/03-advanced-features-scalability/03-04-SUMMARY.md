---
phase: 03-advanced-features-scalability
plan: 04
subsystem: UI Redesign
tags:
  - nextjs
  - tailwind
  - components
  - transcript
  - search
  - player
  - speaker-segmentation
dependency_graph:
  requires:
    - 03-03
  provides:
    - Transcript viewing with speaker segmentation
    - Search bar for transcript keywords
    - Click‑to‑play timestamp seeking
    - Word count in footer
  affects:
    - 03-05 (Transcript editing)
    - 03-06 (Advanced insights)
tech_stack:
  added:
    - None (used existing libraries)
  patterns:
    - Forward ref for player control
    - Mock segmentation for missing word timestamps
key_files:
  created:
    - src/components/SearchBar.tsx
    - src/components/TranscriptView.tsx
    - src/lib/transcription/segment.ts
  modified:
    - src/lib/transcription/types.ts
    - src/components/Player.tsx
    - src/components/PlayerSidebar.tsx
    - app/editor/page.tsx
decisions:
  - Use mock speaker segmentation (alternating Interviewer/Speaker 1) because word‑level timestamps are not saved in sidecar .txt files
  - Expose seek and time‑update via forwardRef to allow transcript‑view‑to‑player synchronization
metrics:
  duration: 35m
  completed: 2026-01-26
---

# Phase 3 Plan 4: Transcript Viewing & Search Summary

**One-liner:** Transcript view with speaker segmentation, search filtering, click‑to‑play timestamps, and word count integration.

## What Was Built

Built the transcript viewing and search functionality for the Editor page, delivering speaker‑segmented transcript display, real‑time keyword search, and audio seeking from timestamps.

**Key deliverables:**

1. **SearchBar component** – dedicated search input with Material Symbols icon, matches mock styling, controlled `value`/`onChange` props.
2. **TranscriptView component** – displays transcript as speaker‑segmented lines with formatted timestamps, speaker labels, and search‑term highlighting.
3. **Segment‑conversion utility** (`transcriptToSegments`) – converts a plain‑text transcript into `TranscriptSegment[]` with mock speaker labels and estimated timestamps.
4. **Player integration** – added `seek` method and `onTimeUpdate` callback to Player component via forwardRef; PlayerSidebar forwards ref and callback.
5. **Editor page integration** – search bar filters transcript lines; clickable timestamps seek audio; footer shows live word count.
6. **Word‑count calculation** – derived from transcript segments and displayed in the editor footer.

## How It Works

- The Editor page loads a transcript via `readTranscript` and passes the plain text to `transcriptToSegments`.
- The segmentation utility splits the text by sentences and assigns alternating speaker labels (“Interviewer” / “Speaker 1”) and estimated timestamps based on recording duration.
- The `TranscriptView` renders each segment with a timestamp button, speaker label, and transcript text; matching search terms are highlighted.
- When a timestamp button is clicked, `handleSeek` calls `playerSidebarRef.current.seek(time)`, which sets the audio element’s current time.
- The Player component’s `onTimeUpdate` callback updates `currentTime` state, which highlights the active transcript segment.
- The search bar filters the segment list in real time (case‑insensitive substring match).
- The footer’s word count is computed from all segments (ignoring search filtering).

## Deviations from Plan

**1. [Rule 2 – Missing Critical] No word‑level timestamps or speaker diarization data**

- **Found during:** Task 2
- **Issue:** The existing `readTranscript` command returns only plain text; word‑level timestamps (`words` array) are not saved to sidecar files.
- **Fix:** Created mock segmentation that splits text by sentences and assigns alternating speakers. Added `TranscriptSegment` type and `transcriptToSegments` utility.
- **Files modified:** `src/lib/transcription/types.ts`, `src/lib/transcription/segment.ts`
- **Commit:** `3467265`

**2. [Rule 2 – Missing Critical] Player lacked external seek and time‑update interface**

- **Found during:** Task 3
- **Issue:** The transcript view needed to seek the audio player and receive current‑time updates, but Player had no public API for those operations.
- **Fix:** Added `seek` method and `onTimeUpdate` prop to Player component using `forwardRef` and `useImperativeHandle`. Updated PlayerSidebar to forward the ref and prop.
- **Files modified:** `src/components/Player.tsx`, `src/components/PlayerSidebar.tsx`
- **Commit:** `2ec8876`

## Verification

All verification criteria from the plan were met:

✅ **Transcript displays speaker‑segmented lines with formatted timestamps** – `TranscriptView` renders each segment with timestamp button and speaker label.  
✅ **Clicking a timestamp seeks audio player to that position** – `handleSeek` calls `playerSidebarRef.current.seek(time)`; Player updates audio element.  
✅ **Search bar filters transcript lines by keyword (live update)** – search input filters `transcriptSegments`; filtered list passed to `TranscriptView`.  
✅ **Matching keywords are highlighted in transcript text** – `TranscriptView` highlights matched substrings with indigo background.  
✅ **Footer shows correct word count based on transcript** – word count calculated from all segments and displayed in footer.

## Next Phase Readiness

**Blockers:** None.  
**Concerns:**  
- Speaker segmentation is mock (alternating speakers). Real speaker diarization data is not yet available.  
- Word‑level timestamps are not saved; seeking uses estimated segment start times.  
- The “Edit” and “Export” buttons remain non‑functional placeholders.

**Recommendations:**  
- In Phase 3 Plan 5, implement transcript editing with live synchronization.  
- Consider adding a JSON sidecar file that stores word‑level timestamps and speaker labels when transcription is performed.  
- Integrate real speaker diarization (if available) in a future iteration.

## Commits

| Commit | Message |
|--------|---------|
| `4bb362a` | feat(03‑04): create SearchBar component for transcript search |
| `3467265` | feat(03‑04): create TranscriptView component with speaker segmentation |
| `2ec8876` | feat(03‑04): integrate transcript view and search into Editor page |

## Performance

- **Execution time:** ~35 minutes  
- **Lines added:** ~300  
- **Components created:** 2  
- **Files modified:** 6  

## Notes

- Added `TranscriptSegment` type to `src/lib/transcription/types.ts`.  
- The segmentation utility currently uses simple sentence‑boundary detection (period, exclamation, question mark).  
- Player’s forwardRef exposes only `seek`; other controls (play/pause) remain internal.  
- The mock waveform in PlayerSidebar is still static; real waveform visualization is out of scope for this plan.

---

*Summary generated by GSD plan executor on 2026‑01‑26.*