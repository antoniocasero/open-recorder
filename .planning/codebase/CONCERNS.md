# Codebase Concerns

**Analysis Date:** 2026-01-23

## Tech Debt

**Silent error swallowing in recursive directory scan:**
- Issue: Subdirectory scan errors are ignored with `let _ = scan_recursive(...)`
- Files: `src-tauri/src/lib.rs` (line 51)
- Impact: Missing audio files if a subdirectory cannot be read (permissions, corruption)
- Fix approach: Propagate errors or at least log them; consider skipping problematic directories with warning

**Missing audio duration population:**
- Issue: `AudioItem.duration` is always `None`; frontend displays "--:--" for all recordings
- Files: `src-tauri/src/lib.rs` (lines 70, 98), `src/components/RecordingsList.tsx` (line 52), `src/components/Player.tsx` (line 228)
- Impact: Users cannot see recording length; player duration unknown
- Fix approach: Extract duration using audio metadata library (e.g., `symphonia`, `audrey`) or invoke frontend `audio.duration` after load

**Debug logging in production code:**
- Issue: `console.log` statements left in Player component for debugging audio paths
- Files: `src/components/Player.tsx` (lines 57‑58)
- Impact: Clutters console in production; potential performance overhead
- Fix approach: Remove or guard with `if (process.env.NODE_ENV === 'development')`

**Static placeholder waveform:**
- Issue: Waveform is generated with random heights instead of actual audio data
- Files: `src/components/Player.tsx` (lines 209‑223)
- Impact: Misleading UI; no real visualization of audio
- Fix approach: Integrate a waveform library (e.g., `wavesurfer.js`) or compute peaks from audio buffer

**Static "Synced just now" badge:**
- Issue: Badge always shows "Synced just now" regardless of actual sync time
- Files: `src/components/Dashboard.tsx` (lines 67‑70)
- Impact: User cannot know when last sync occurred
- Fix approach: Store and display timestamp of last successful folder scan

**No user notifications for errors:**
- Issue: Errors are only logged to console; user may be unaware of failures
- Files: `src/components/Dashboard.tsx` (lines 35, 50), `src/components/Player.tsx` (line 148)
- Impact: Poor UX when operations fail silently
- Fix approach: Add toast/alert component; display error messages inline

**Disabled export button (transcription stub):**
- Issue: Export button is permanently disabled; transcription panel is a stub
- Files: `src/components/Transcription.tsx` (lines 15‑20, 25)
- Impact: Feature advertised but non‑functional
- Fix approach: Implement transcription service (e.g., Whisper) or remove UI until ready

## Known Bugs

**No known critical bugs detected.**  
*Note: Limited testing; undiscovered bugs likely exist.*

## Security Considerations

**Path traversal via dialog‑provided paths:**
- Risk: User‑selected folder paths are trusted; malicious symlinks could cause unexpected file access
- Files: `src-tauri/src/lib.rs` (lines 34‑41)
- Current mitigation: Tauri’s dialog ensures paths are within user‑selected directory
- Recommendations: Add canonicalization and ensure paths remain under selected root

**Lack of input validation for file metadata:**
- Risk: File metadata (size, mtime) could be manipulated; unlikely to cause harm
- Files: `src-tauri/src/lib.rs` (lines 55‑71, 81‑100)
- Current mitigation: `fs::metadata` reads from filesystem; no further validation
- Recommendations: None required for this use case

## Performance Bottlenecks

**Unbounded recursive directory scan:**
- Problem: Scanning deeply nested directories with many files blocks UI thread
- Files: `src-tauri/src/lib.rs` (lines 43‑78)
- Cause: Synchronous recursion on main thread; no pagination or incremental loading
- Improvement path: Move scanning to a background thread; yield control periodically; implement progress reporting

**UI freeze during folder scan:**
- Problem: Frontend `loading` state does not prevent UI blocking during large scans
- Files: `src/components/Dashboard.tsx` (lines 41‑54)
- Cause: `scanFolderForAudio` is async but Rust command runs synchronously
- Improvement path: Implement streaming/progressive loading of audio items

**Random waveform generation on every render:**
- Problem: Waveform bars are regenerated on each render with `Math.random()`
- Files: `src/components/Player.tsx` (lines 210‑212)
- Cause: No memoization of random heights
- Improvement path: Compute once and memoize; or replace with real waveform data

## Fragile Areas

**Complex audio playback logic:**
- Files: `src/components/Player.tsx` (lines 103‑153)
- Why fragile: Manual promise/event‑listener orchestration; edge cases around `readyState` and `canplay`
- Safe modification: Extract audio control logic into a custom hook; add comprehensive tests
- Test coverage: None

**Error‑prone recursive scan error handling:**
- Files: `src-tauri/src/lib.rs` (lines 43‑78)
- Why fragile: Error handling uses `String` errors; sub‑directory errors are ignored
- Safe modification: Use `anyhow` or `thiserror` for better error types; propagate errors
- Test coverage: None

**Store initialization race condition:**
- Files: `src/lib/fs/config.ts` (lines 3‑10)
- Why fragile: `store` variable may be initialized multiple times if called concurrently
- Safe modification: Use `Promise` caching pattern or initialize once at module level
- Test coverage: None

## Scaling Limits

**Large directory scans:**
- Current capacity: Unknown; depends on available memory and filesystem speed
- Limit: UI becomes unresponsive; may hit memory limits storing all `AudioItem`s
- Scaling path: Paginate results; lazy‑load metadata; implement virtualized list

**Audio file size/duration:**
- Current capacity: Browser‑based `<audio>` element
- Limit: Very large audio files may cause high memory usage and slow seeking
- Scaling path: Use streaming audio chunks; consider server‑side processing for cloud version

## Dependencies at Risk

**`md5` crate for ID generation:**
- Risk: Not cryptographically required; could be replaced with faster non‑crypto hash
- Impact: None for this application
- Migration plan: Switch to `sha1` or `seahash` if needed; keep as‑is acceptable

**Tauri plugin compatibility:**
- Risk: Tauri v2 still evolving; potential breaking changes in plugin APIs
- Impact: Updates may require code changes
- Migration plan: Keep dependencies pinned; test thoroughly before upgrading

## Missing Critical Features

**Transcription functionality:**
- Problem: No speech‑to‑text capability; UI placeholder only
- Blocks: Cannot transcribe recordings; limited value for note‑taking
- Priority: High

**Audio duration extraction:**
- Problem: Duration not populated; user cannot see length of recordings
- Blocks: Player progress bar lacks total duration
- Priority: Medium

**Real waveform visualization:**
- Problem: Fake random waveform provides no useful information
- Blocks: Cannot visually scan audio for sections of interest
- Priority: Low

**Error notification system:**
- Problem: Errors only appear in console; user unaware of failures
- Blocks: User may think feature is broken without feedback
- Priority: Medium

**Sync status & history:**
- Problem: No record of when folder was last scanned; badge is static
- Blocks: User cannot tell if recordings are up‑to‑date
- Priority: Low

## Test Coverage Gaps

**No automated tests:**
- What's not tested: Entire codebase – frontend components, Rust commands, UI interactions
- Files: All source files
- Risk: Regression bugs undetected; refactoring dangerous
- Priority: High

**Component unit tests:**
- What's not tested: React component rendering, state transitions, event handlers
- Files: `src/components/*.tsx`
- Risk: UI bugs introduced silently
- Priority: Medium

**Rust command tests:**
- What's not tested: `scan_folder_for_audio`, `pick_folder`, `read_file_meta`
- Files: `src-tauri/src/lib.rs`
- Risk: Filesystem‑dependent logic may break on edge cases
- Priority: Medium

**Integration tests (frontend‑backend):**
- What's not tested: Tauri command invocations, store persistence
- Files: `src/lib/fs/*.ts`, `src-tauri/src/lib.rs`
- Risk: Broken communication between layers
- Priority: Medium

---

*Concerns audit: 2026-01-23*