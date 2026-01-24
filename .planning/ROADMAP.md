# Roadmap: Open Recorder Tauri

## Overview

Add transcription capabilities to the existing audio recorder desktop app using OpenAI Whisper API. Phase 1 delivers the complete v1 transcription feature: secure API integration, user-friendly UI with progress feedback, timestamped transcript display, and sidecar file saving. Future phases (v2) will add enhancements like batch transcription, editing, and export formats.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Transcription MVP** - Complete v1 transcription feature using OpenAI Whisper API
- [x] **Phase 2: Transcript Management & Enhancements** - Batch transcription, editing, search, export formats (v2)
- [ ] **Phase 3: Advanced Features & Scalability** - Offline transcription, real-time, AI summary, user-level key management (v2+)

## Phase Details

### Phase 1: Transcription MVP
**Goal**: User can transcribe audio recordings using OpenAI Whisper API with clear feedback and saved results
**Depends on**: Nothing (first phase)
**Requirements**: TRAN-01, TRAN-02, TRAN-03, TRAN-04, TRAN-05, TRAN-06, TRAN-07, TRAN-08, TRAN-09, TRAN-10
**Success Criteria** (what must be TRUE):
  1. User can provide OpenAI API key via environment variable and the app uses it for transcription
  2. User can click transcribe button on any recording and see progress indicator during processing
  3. User sees transcript in modal with word-level timestamps after completion
  4. User receives notification toast when transcription finishes
  5. User finds .txt transcript file saved alongside original audio file
  6. User gets clear error messages for missing API key, network issues, or unsupported formats
  7. User can transcribe common audio formats (mp3, m4a, wav)
  8. App automatically detects language of audio for transcription
**Plans**: 5 plans

Plans:
- [x] 01-01-PLAN.md — Setup dependencies and types
- [x] 01-02-PLAN.md — Backend transcription command
- [x] 01-03-PLAN.md — Frontend command wrapper and button
- [x] 01-04-PLAN.md — Transcript display and notifications
- [x] 01-05-PLAN.md — Error handling and verification

### Phase 2: Transcript Management & Enhancements
**Goal**: Enhance transcription with batch processing, editing, search, and export capabilities
**Depends on**: Phase 1
**Requirements**: TRAN-11, TRAN-12, TRAN-13, TRAN-14, TRAN-15, TRAN-16 (v2 requirements)
**Success Criteria** (what must be TRUE):
  1. User can select multiple recordings and transcribe them in batch
  2. User can edit transcript text directly in the app
  3. User can search within transcript content for keywords
  4. User can export transcript to multiple formats (SRT, VTT, JSON)
  5. App identifies different speakers in transcript (speaker diarization)
**Plans**: 6 plans

Plans:
- [x] 02-01-PLAN.md — Batch transcription UI and backend
- [x] 02-02-PLAN.md — Transcript editing and saving
- [x] 02-03-PLAN.md — Search across transcripts
- [x] 02-04-PLAN.md — Export to SRT, VTT, JSON formats
- [x] 02-05-PLAN.md — Speaker diarization (identification) (deferred)
- [x] 02-06-PLAN.md — AI summary generation

### Phase 3: Advanced Features & Scalability
**Goal**: Add offline transcription, real-time capabilities, and user management features
**Depends on**: Phase 2
**Requirements**: TRAN-17, TRAN-18 (v2 requirements) plus additional requirements
**Success Criteria** (what must be TRUE):
  1. User can transcribe offline using local Whisper model (optional)
  2. User can get real-time transcription during recording
  3. App generates AI summary of transcript content
  4. User can manage API keys per user with cost tracking
  5. App handles rate limiting with queueing and advanced error recovery
**Plans**: TBD

Plans:
- [ ] 03-01: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Transcription MVP | 5/5 | Complete | 2026-01-24 |
| 2. Transcript Management & Enhancements | 6/6 | Complete | 2026-01-24 |
| 3. Advanced Features & Scalability | 0/TBD | Not started | - |
