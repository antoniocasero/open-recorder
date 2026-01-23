# Project Research Summary

**Project:** Open Recorder Tauri  
**Domain:** Desktop audio recorder transcription  
**Researched:** January 23, 2026  
**Confidence:** HIGH

## Executive Summary

Open Recorder Tauri is a desktop audio recorder application that needs to add transcription capabilities using the OpenAI Whisper API. Experts build this feature by extending Tauri’s async command system with a secure Rust backend that calls the Whisper API via the mature `async-openai` crate, keeping API keys in environment variables and never exposing them to the frontend. The frontend adds a transcription button per recording, a modal for timestamped transcript display, and progress indicators to maintain responsiveness during API calls.

The recommended approach is to start with a minimal MVP that delivers single‑file transcription with word‑level timestamps, validation for file size (≤25 MB) and supported formats, and sidecar `.txt` file storage. This avoids the most critical pitfalls: API key exposure, blocking UI, and unexpected API costs. The architecture follows the existing codebase patterns, isolating the OpenAI client in a dedicated Rust module and reusing the established Tauri IPC layer.

Key risks include transcript‑audio association loss when files are moved, language‑detection errors for accented speech, and rate‑limit handling. Mitigations include using audio‑content hashing for stable IDs, optional language/prompt hints, and exponential backoff with user‑friendly error messages. The stack is well‑documented and production‑ready, allowing the team to focus on integration rather than foundational technology choices.

## Key Findings

### Recommended Stack

**Core technologies:**
- `async-openai` 0.32.3 – Official‑style Rust client for OpenAI APIs, handles multipart file upload and Whisper transcription automatically.
- `tokio` 1.49 – Async runtime required by `async-openai` and Tauri async commands.
- `reqwest` 0.13.1 – HTTP client used by `async-openai`; robust with TLS support.
- Tauri 2.9.5 (existing) – Desktop app framework providing secure IPC for frontend‑backend communication.

**Supporting libraries:**
- `serde_json` – JSON serialization for API responses.
- `thiserror` – Ergonomic error definitions for Rust commands.
- `tracing` – Structured logging for debugging transcription flow.
- `tauri‑plugin‑store` (existing) – Persistent key‑value storage for API key if moved from env‑var to UI settings.

**What NOT to use:**
- Storing API key in frontend code or `localStorage` (security violation).
- Synchronous HTTP calls in Rust backend (blocks event loop).
- Manual multipart file‑upload implementation (error‑prone; use `async‑openai`).
- Plain `println!` for logging (use structured `tracing` macros).

### Expected Features

**Must have (table stakes):**
- Per‑recording transcription button with spinner while processing.
- Transcript display with word‑level timestamps for click‑to‑seek navigation.
- Save transcript as `.txt` file alongside original audio.
- Loading indicator and progress feedback.
- Error handling for network, API, and file issues.
- API key configuration via environment variable (user‑supplied).
- Cost transparency (estimated cost before transcribing).
- Support for common audio formats (mp3, m4a, wav, etc.).
- Auto language detection (Whisper default).
- Notification toast on completion.

**Should have (competitive):**
- Batch transcription (multiple files).
- Speaker diarization (using `gpt‑4o‑transcribe‑diarize`).
- Transcript editing & correction.
- Search within transcript.
- Export to multiple formats (SRT, VTT, JSON).
- Custom vocabulary/prompting (improves accuracy for domain terms).

**Defer (v2+):**
- Offline transcription (local Whisper model, ~1.5 GB).
- Real‑time transcription (live streaming).
- AI summary of transcript.
- Auto‑tagging by content.
- Translation to other languages.
- Highlight keywords.
- Integration with note‑taking apps.

### Architecture Approach

The standard architecture extends the existing Tauri command‑driven backend with a new `transcribe_audio` async command. The command reads the audio file, calls the OpenAI Whisper API via a dedicated Rust client module, parses the verbose JSON response (with word‑level timestamps), writes a sidecar `.txt` file, and returns a structured `Transcript` object to the frontend.

**Major components:**
1. **TranscriptionButton** – React component in each recording row; triggers transcription and shows spinner.
2. **TranscriptionModal** – Modal overlay displaying timestamped transcript lines; allows copy/close.
3. **transcribeAudio TypeScript wrapper** – Type‑safe interface invoking the Rust command.
4. **transcribe_audio Rust command** – Async Tauri command that orchestrates file I/O, API call, and transcript saving.
5. **OpenAI client module** – Isolated Rust module handling HTTP communication, error mapping, and response parsing.
6. **Transcript file writer** – Saves `.txt` file with same basename as audio; optional caching by audio hash.

**Key patterns:**
- Command‑driven backend (secure, follows existing codebase pattern).
- Async progress reporting (prevents UI blocking, improves UX).
- Transcript caching (skip re‑transcription of unchanged audio).
- Sidecar file + database storage (maintains audio‑transcript association).

### Critical Pitfalls

1. **File size and format limits ignored** – Whisper API rejects files >25 MB and unsupported formats. **Prevention:** Validate before upload, implement chunking for large files, show clear error messages.
2. **Blocking UI during long‑running transcription** – UI freezes, user may force‑quit. **Prevention:** Use Tauri async commands with progress events, allow cancellation, store intermediate results.
3. **Fragile API error handling** – Network timeouts, rate limits, invalid keys cause cryptic failures. **Prevention:** Map all API errors, implement exponential backoff, show user‑friendly messages.
4. **Transcripts lose association with audio files** – Moving or renaming audio orphans transcripts. **Prevention:** Store audio‑content hash as stable ID, use sidecar files, provide re‑link UI.
5. **API key exposed in client‑side code** – Secret leaked in frontend bundle. **Prevention:** Keep key only in Rust environment variables, never send to frontend, mask in logs.

## Implications for Roadmap

Based on research, suggested phase structure:

### Phase 1: Transcription MVP
**Rationale:** Delivers core table‑stake features while addressing the most critical pitfalls. Establishes secure backend‑API integration and basic UI workflow.
**Delivers:**
- Async Rust command for Whisper API transcription with word‑level timestamps.
- Frontend transcription button, spinner, and modal display.
- Sidecar `.txt` file saving.
- File size/format validation, error handling, cost estimation.
- API key via environment variable.
**Addresses:** TRAN‑01 through TRAN‑08 (all active requirements).
**Avoids:** Pitfalls 1 (file limits), 2 (blocking UI), 3 (API errors), 5 (key exposure).
**Research flag:** None – stack and API integration are well‑documented.

### Phase 2: Transcript Management & Enhancements
**Rationale:** Builds on stable MVP to add competitive features and fix long‑term association pitfalls. Introduces transcript editing, search, and export formats.
**Delivers:**
- Batch transcription UI.
- Transcript editing & correction.
- Search within transcript.
- Export to SRT/VTT formats.
- Persistent transcript storage (audio‑hash based) to maintain associations.
- Optional language selection and prompting UI.
**Uses:** Existing `async‑openai` client; adds new frontend components.
**Implements:** Architecture components for transcript caching and sidecar database.
**Research flag:** Speaker diarization integration – need to research `gpt‑4o‑transcribe‑diarize` model parameters and cost impact.

### Phase 3: Advanced Features & Scalability
**Rationale:** Addresses scaling concerns and explores offline/local transcription for users with privacy/offline needs. Adds user‑management and cost‑tracking for shared API keys.
**Delivers:**
- Offline transcription with local Whisper model (optional).
- Real‑time transcription (streaming API).
- AI summary of transcripts.
- User‑level API key management and cost tracking.
- Rate‑limit queueing and advanced error recovery.
**Research flag:** Local Whisper model integration – need to evaluate `whisper.cpp` Rust bindings, model bundling, and performance trade‑offs.

### Phase Ordering Rationale

- **Phase 1 first** because it satisfies all active requirements and establishes the secure backend‑frontend pipeline. Without it, no transcription works at all.
- **Phase 2 second** because it adds high‑value differentiators (batch, edit, search) while fixing the transcript‑association pitfall that becomes more painful as users accumulate transcripts.
- **Phase 3 third** because offline/real‑time transcription represent major architectural shifts and are only needed once core transcription proves valuable. User‑level key management is essential if the app scales beyond personal use.

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 2:** Speaker diarization – need to verify `gpt‑4o‑transcribe‑diarize` model availability, pricing, and accuracy.
- **Phase 3:** Local Whisper integration – research `whisper.cpp` Rust bindings, model compression, and CPU/GPU performance across platforms.

Phases with standard patterns (skip research‑phase):
- **Phase 1:** Well‑documented stack (`async‑openai`, Tauri async commands) with established patterns.
- **Phase 2:** Transcript editing and export formats are straightforward frontend additions; batch transcription uses existing single‑file command.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Verified with official `async‑openai` and Tauri docs; versions compatible. |
| Features | MEDIUM | Based on OpenAI documentation and competitor analysis; some differentiators need validation. |
| Architecture | HIGH | Follows established Tauri patterns; OpenAI API integration well‑documented. |
| Pitfalls | MEDIUM | Sourced from official docs and best practices; some pitfalls lack real‑world validation. |

**Overall confidence:** HIGH – the core transcription workflow is well‑understood with production‑ready libraries. The main uncertainties are around advanced features (speaker diarization, local model) which are deferred to later phases.

### Gaps to Address

- **Speaker diarization accuracy:** Need to test `gpt‑4o‑transcribe‑diarize` with varied audio samples to verify speaker‑label quality.
- **Local Whisper model size/performance:** The ~1.5 GB model size may be prohibitive for some users; need to evaluate smaller quantized models.
- **Cost‑tracking implementation:** If the app transitions to shared API keys, a robust usage‑tracking system must be designed.
- **Audio format conversion:** For unsupported formats (e.g., .flac), need to decide whether to integrate `ffmpeg` or reject with a helpful error.

## Sources

### Primary (HIGH confidence)
- `async-openai` crate documentation (docs.rs/async-openai) – Whisper support confirmed.
- OpenAI Whisper API documentation (platform.openai.com/docs/guides/speech-to-text) – API limits, parameters, response formats.
- Tauri command system documentation (v2.tauri.app/development/command/) – Async command patterns.
- Existing project architecture (`.planning/codebase/ARCHITECTURE.md`) – Codebase structure.

### Secondary (MEDIUM confidence)
- Otter.ai features page – Competitive feature landscape.
- Industry knowledge of desktop audio apps – UX patterns for long‑running tasks.
- Community discussions on Whisper pitfalls – File size, rate limits, language detection.

### Tertiary (LOW confidence)
- General desktop app UX patterns – Inferred best practices.

---
*Research completed: January 23, 2026*  
*Ready for roadmap: yes*