# Requirements: Open Recorder Tauri

**Defined:** 2026-01-23
**Core Value:** Users can easily record, organize, and listen to audio recordings with a simple, fast desktop interface.

## v1 Requirements

Requirements for initial transcription feature release.

### Transcription

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

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Transcription Enhancements

- **TRAN-11**: Batch transcription (multiple files at once)
- **TRAN-12**: Speaker diarization (identify different speakers)
- **TRAN-13**: Transcript editing (edit transcript text in-app)
- **TRAN-14**: AI summary of transcript
- **TRAN-15**: Search within transcript for keywords
- **TRAN-16**: Export to multiple formats (SRT, VTT, JSON)
- **TRAN-17**: Integration with note-taking apps (push transcripts)
- **TRAN-18**: Cost transparency (show estimated cost before transcribing)

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Audio editing (trim, cut, merge) | Focus on transcription only |
| Cloud sync and sharing | Local‑first application |
| Transcript editing within app (v1) | v1 only displays and saves |
| Language selection | Auto‑detect via Whisper API |
| Audio format conversion | Assume Whisper‑supported formats |
| Fixing existing tech debt | Deferred per project direction |
| Auto‑transcribe every new recording | Expensive API calls, explicit user action preferred |
| Storing transcripts unencrypted | Privacy risk; rely on user's file system |
| No rate limiting / queueing | Could blow through API quota; sequential queue needed |
| Hard‑coded API key | Violates OpenAI terms; user supplies own key |
| Blocking UI during transcription | Poor user experience; async required |
| No file size validation | May fail on large files; check file size (25 MB limit) |
| Auto-delete audio after transcription | Users lose original recordings; irreversible |
| Require cloud account for local-only use | Adds friction for local desktop app |
| Lock transcripts behind paywall | Frustrates users expecting basic functionality |
| No way to correct transcription errors | Errors reduce trust; basic edit functionality needed |
| No export options | Users need to use transcripts elsewhere; at minimum .txt |
| Automatic language selection override | Auto-detection accurate; manual selection adds UI complexity |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| TRAN-01 | Phase 1 | Pending |
| TRAN-02 | Phase 1 | Pending |
| TRAN-03 | Phase 1 | Pending |
| TRAN-04 | Phase 1 | Pending |
| TRAN-05 | Phase 1 | Pending |
| TRAN-06 | Phase 1 | Pending |
| TRAN-07 | Phase 1 | Pending |
| TRAN-08 | Phase 1 | Pending |
| TRAN-09 | Phase 1 | Pending |
| TRAN-10 | Phase 1 | Pending |

**Coverage:**
- v1 requirements: 10 total
- Mapped to phases: 10
- Unmapped: 0 ✓

---
*Requirements defined: 2026-01-23*
*Last updated: 2026-01-23 after roadmap creation*
