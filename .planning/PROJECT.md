# Open Recorder Tauri

## What This Is

A desktop audio recorder application built with Tauri (Next.js frontend, Rust backend) that allows users to scan folders for audio recordings, play them back, and manage their collection. The app provides basic audio playback, folder scanning, and a simple UI for navigating recordings.

## Core Value

Users can easily record, organize, and listen to audio recordings with a simple, fast desktop interface.

## Requirements

### Validated

- ✓ User can pick a folder to scan for audio files — existing
- ✓ App recursively scans folder for audio files (mp3, m4a, wav) — existing
- ✓ User can select a recording from the list — existing
- ✓ Audio player plays selected recording (play, pause, seek, volume) — existing
- ✓ UI shows recording list with metadata (filename, date, size) — existing
- ✓ App remembers last selected folder via persistent storage — existing
- ✓ Basic UI components: Dashboard, Player, RecordingsList — existing

### Active

- [ ] **TRAN-01**: User can transcribe a recording using OpenAI Whisper API
- [ ] **TRAN-02**: Transcribe button appears per recording in the list
- [ ] **TRAN-03**: Progress indicator (spinner + "Transcribing...") shows during transcription
- [ ] **TRAN-04**: Transcript appears in modal overlay with word-level timestamps
- [ ] **TRAN-05**: Transcript saved as `.txt` file alongside original audio file
- [ ] **TRAN-06**: Notification toast appears when transcription completes
- [ ] **TRAN-07**: API key provided via environment variable (`OPENAI_API_KEY`)
- [ ] **TRAN-08**: Error handling for missing API key, network errors, unsupported formats
- [ ] **TRAN-09**: Support for common audio formats (mp3, m4a, wav, etc.)
- [ ] **TRAN-10**: Auto language detection via Whisper API

### Out of Scope

- Audio editing (trim, cut, merge) — focus on transcription only
- Cloud sync and sharing — local‑first application
- Transcript editing within app — v1 only displays and saves
- Language selection — auto‑detect via Whisper API
- Audio format conversion — assume Whisper‑supported formats (mp3, m4a, wav, etc.)
- Fixing existing tech debt (missing duration, static waveform, error swallowing) — deferred

## Context

- Existing codebase mapped (see `.planning/codebase/`)
- Tech debt identified but deferred per project direction
- Uses Tauri for desktop integration, Next.js for frontend, Rust for backend
- Already includes audio scanning, playback, and basic UI

## Constraints

- **API**: Must use OpenAI Whisper API (not local model)
- **Authentication**: API key via environment variable only
- **Storage**: Transcripts saved as `.txt` files alongside audio
- **UI**: Button per recording in list, modal display with timestamps
- **Error handling**: Basic user‑friendly messages for common failures
- **Timeline**: Focus on transcription feature only, no other enhancements

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Use OpenAI Whisper API | Faster implementation, no large model download, cost per minute acceptable | — Pending |
| API key via environment variable | Simpler for initial release, avoids building settings UI | — Pending |
| Save transcripts as `.txt` files | Easy to locate, no database overhead, portable | — Pending |
| Button in list + modal display | Consistent with existing UI pattern, clear user flow | — Pending |

---
*Last updated: 2026-01-23 after initialization*
