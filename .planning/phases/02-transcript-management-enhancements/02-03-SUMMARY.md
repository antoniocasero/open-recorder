---
phase: 02-transcript-management-enhancements
plan: 03
subsystem: search
tags: [transcript, search, ui, lazy-loading, caching]
requires: [02-02]
provides: transcript-search
affects: []
tech-stack:
  added: []
  patterns:
    - debounced-search
    - transcript-cache
    - lazy-loading-sidecar-files
key-files:
  created: []
  modified:
    - src-tauri/src/commands/transcription.rs
    - src-tauri/src/lib.rs
    - src/lib/transcription/commands.ts
    - src/components/Dashboard.tsx
decisions:
  - "Use transcript file reading for search (not in-memory state) - enables search across all transcripts even those not yet loaded in session"
  - "Implement caching to avoid repeated file reads - Map keyed by audio path"
  - "Debounce search input (300ms) to prevent excessive file reads while typing"
  - "Show filtered recordings list (not highlighting) - simpler UI"
  - "Display 'no results' message with search query when no matches found"
metrics:
  duration: 25
  completed: 2026-01-24
---

# Phase 02 Plan 03: Search across transcripts Summary

**One-liner:** Transcript search with debounced input, lazy file loading, caching, and filtered results display.

## Objective

Add search functionality to find recordings by transcript content, helping users locate specific conversations or topics within their transcribed recordings.

## What Was Built

1. **Backend transcript reading command** (`read_transcript`)
   - New Tauri command that reads sidecar .txt file for a given audio path
   - Returns transcript text or file-not-found error
   - Registered in invoke handler

2. **Search UI in Dashboard**
   - Search input with clear button in header
   - Loading spinner during search
   - Result count display
   - Filtered recording count in title

3. **Transcript search with lazy loading and caching**
   - Debounced search (300ms) to prevent excessive file reads
   - Cache layer (Map) stores transcript text per audio path
   - Sequential file reads with small delays to avoid UI blocking
   - Empty state message when no matches found

## Implementation Details

### Backend Changes
- Added `read_transcript` command in `src-tauri/src/commands/transcription.rs`
- Registered command in `src-tauri/src/lib.rs`
- Added unit test for file reading

### Frontend Changes
- Added `readTranscript` wrapper in `src/lib/transcription/commands.ts` with error handling
- Enhanced `Dashboard.tsx` with search state, cache ref, and search effect
- Implemented debounced transcript search that iterates over recordings
- Added loading states and UI feedback
- Modified recording count to show filtered/total
- Added "no results" placeholder when search yields empty results

## Verification

- **Backend command**: Unit test passes, compiles without errors
- **Frontend search**: TypeScript checks pass, no compilation errors
- **UI behavior**: Search input shows clear button, loading spinner, result count
- **Filtering**: Recordings list filters to matching transcripts
- **Edge cases**: Empty search clears results, missing transcripts handled gracefully

## Deviations from Plan

**None** - plan executed exactly as written.

## Decisions Made

1. **Search across files, not memory**: Instead of lifting transcription states up to Dashboard, we read directly from sidecar .txt files. This ensures search works for all transcripts (including those not yet loaded in current session) and simplifies architecture.

2. **Caching strategy**: Implemented simple Map cache to avoid repeated file reads for the same audio path within a session. Empty string indicates no transcript file.

3. **Debounce timing**: Used 300ms debounce for balance between responsiveness and performance.

4. **Filtering vs highlighting**: Chose to filter the recordings list (showing only matches) rather than highlighting matches within the full list. This provides clearer results.

5. **Loading feedback**: Added spinner icon and "Searching..." text to indicate active search, especially important when reading many transcript files.

## Tech Stack Impact

- **Patterns established**:
  - Debounced search with lazy file loading
  - Transcript caching pattern reusable for other features
  - Sidecar file reading abstraction

- **No new dependencies added**

## Key Files Modified

| File | Changes |
|------|---------|
| `src-tauri/src/commands/transcription.rs` | Added `read_transcript` command and unit test |
| `src-tauri/src/lib.rs` | Registered new command in invoke handler |
| `src/lib/transcription/commands.ts` | Added `readTranscript` frontend wrapper |
| `src/components/Dashboard.tsx` | Added search UI, state, caching, and search logic |

## Commits

- `8b30434` feat(02-03): add backend command to read transcript file
- `8ff9d41` feat(02-03): add search UI to Dashboard  
- `af4a88f` feat(02-03): implement search logic with lazy loading

## Next Phase Readiness

- **Search infrastructure complete**: Transcript reading command and caching layer available for future features
- **No blockers**: All tests pass, compilation clean
- **Ready for**: 02-04 (Export to SRT, VTT, JSON formats) - can reuse transcript reading command

## Performance Considerations

- **File I/O**: Sequential reads with 10ms delays prevent UI freezing with many recordings
- **Cache**: Prevents redundant reads; cache cleared on page refresh
- **Debounce**: Limits frequency of search execution during typing

## User Experience

- **Intuitive**: Search box prominently placed in header with clear visual feedback
- **Responsive**: Results update as typing pauses
- **Clear empty states**: "No transcripts found" message with search query
- **Performance awareness**: Loading indicator shows during file reads

---
*Summary generated by GSD executor*