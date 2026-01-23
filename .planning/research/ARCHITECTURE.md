# Architecture Research

**Domain:** Desktop audio recorder transcription integration
**Researched:** 2026-01-23
**Confidence:** HIGH (OpenAI API verified), MEDIUM (architecture patterns)

## Standard Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                           Frontend UI Layer                         │
├─────────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌─────────────────────────┐   │
│  │ Transcription│  │ Transcription│  │ Toast Notification      │   │
│  │    Button    │  │    Modal     │  │                         │   │
│  └──────┬───────┘  └──────┬───────┘  └──────────┬──────────────┘   │
│         │                 │                      │                  │
├─────────┴─────────────────┴──────────────────────┴──────────────────┤
│                        Command Layer                                 │
├─────────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │                   transcribeAudio(path)                     │    │
│  │    (TypeScript wrapper for Tauri invoke)                    │    │
│  └──────────────────────────────┬──────────────────────────────┘    │
├─────────────────────────────────┼───────────────────────────────────┤
│                      Backend Service Layer                          │
├─────────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │              transcribe_audio Rust command                  │    │
│  │  (reads file, calls OpenAI API, writes transcript)          │    │
│  └──────────────────────────────┬──────────────────────────────┘    │
├─────────────────────────────────┼───────────────────────────────────┤
│                       External Services                            │
├─────────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │                  OpenAI Whisper API                         │    │
│  │           (cloud transcription service)                     │    │
│  └─────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Typical Implementation |
|-----------|----------------|------------------------|
| Transcription Button | Trigger transcription flow per recording, show spinner during processing | React component in RecordingsList row, uses local state for loading |
| Transcription Modal | Display transcript text with word‑level timestamps, allow copy/close | Modal component that receives transcript data via props |
| Toast Notification | Show success/error feedback after transcription completes | React toast library or custom component with timeout |
| transcribeAudio command wrapper | Type‑safe interface to invoke Rust transcription command | TypeScript function in `src/lib/transcription/commands.ts` |
| transcribe_audio Rust command | Read audio file, call OpenAI API with env var key, parse response, write .txt file | `#[tauri::command]` async function using reqwest for HTTP |
| OpenAI API Client | Handle authentication, multipart form upload, error responses, rate limiting | Dedicated Rust module (`src-tauri/src/transcription.rs`) |
| Transcript File Writer | Save transcript as `.txt` alongside original audio file with same basename | Standard Rust file I/O, error handling for permissions |
| Environment Config | Provide OPENAI_API_KEY from environment variable to backend | Tauri plugin or std::env::var, validated at startup |

## Recommended Project Structure

```
src/
├── components/
│   ├── TranscriptionButton.tsx   # Button with spinner state
│   ├── TranscriptionModal.tsx    # Modal with timestamp display
│   └── Toast.tsx                 # Reusable notification toast
├── lib/
│   ├── transcription/
│   │   ├── commands.ts           # TypeScript wrapper for invoke
│   │   ├── types.ts              # Transcript, Timestamp interfaces
│   │   └── state.ts              # React hooks for transcription state
│   └── fs/                       # Existing file system commands
│
src-tauri/
├── src/
│   ├── commands/
│   │   ├── transcription.rs      # transcribe_audio command handler
│   │   └── mod.rs
│   ├── openai/
│   │   ├── client.rs             # HTTP client for Whisper API
│   │   ├── models.rs             # Request/response structs (serde)
│   │   └── mod.rs
│   └── lib.rs                    # Register new command
└── main.rs
```

### Structure Rationale

- **Frontend separation**: Keep transcription UI components separate from existing components for clarity.
- **Command layer extension**: Follow existing pattern (`src/lib/fs/commands.ts`) for new transcription commands.
- **Backend module isolation**: Dedicated `openai` module encapsulates API specifics, making it testable and replaceable.
- **Type sharing**: Define `Transcript` and `Timestamp` types in TypeScript and Rust (via serde) for type‑safe cross‑language communication.

## Architectural Patterns

### Pattern 1: Command‑Driven Backend

**What:** Extend Tauri's command system with a new `transcribe_audio` command that handles the entire transcription pipeline.

**When to use:** When you need secure access to environment variables, filesystem, and network from desktop backend.

**Trade‑offs:**
- **Pros:** Keeps API key secure in backend, leverages existing Tauri IPC pattern, clean separation of concerns.
- **Cons:** Adds complexity of Rust HTTP client, requires handling async file I/O and networking.

**Example:**
```rust
#[tauri::command]
async fn transcribe_audio(path: PathBuf) -> Result<Transcript, String> {
    let api_key = env::var("OPENAI_API_KEY").map_err(|_| "Missing API key")?;
    let client = OpenAIClient::new(api_key);
    let transcript = client.transcribe(path).await?;
    // Save transcript as .txt file
    fs::write(transcript_path, &transcript.text)?;
    Ok(transcript)
}
```

### Pattern 2: Async Progress Reporting

**What:** Use Tauri events to emit progress updates during long‑running transcription.

**When to use:** For large audio files where users need visual feedback beyond a spinner.

**Trade‑offs:**
- **Pros:** Better UX with incremental updates, can show estimated time remaining.
- **Cons:** More complex event system, requires frontend subscription management.

**Example:**
```rust
// Emit progress events (0‑100%)
window.emit("transcription-progress", 25)?;
```

### Pattern 3: Transcript Caching

**What:** Check for existing `.txt` transcript file before calling API; skip if already exists.

**When to use:** When users may re‑transcribe same file, or when you want offline viewing of past transcripts.

**Trade‑offs:**
- **Pros:** Saves API costs, faster loading of existing transcripts.
- **Cons:** Need versioning if transcription model improves, stale cache if audio changes.

## Data Flow

### Request Flow

```
User clicks "Transcribe" button
    ↓
TranscriptionButton → calls transcribeAudio(path)
    ↓
transcribeAudio invokes Rust transcribe_audio command
    ↓
Rust reads audio file, builds multipart form
    ↓
HTTP POST to OpenAI Whisper API with API key
    ↓
OpenAI returns JSON with text (and optional timestamps)
    ↓
Rust writes .txt file alongside original audio
    ↓
Rust returns Transcript object to frontend
    ↓
Frontend opens TranscriptionModal with transcript data
    ↓
Toast notification shows "Transcription complete"
```

### State Management

```
Recording State
    ↓ (per recording)
{
  id: string,
  isTranscribing: boolean,
  transcript?: Transcript,
  error?: string
}
    ↓ (UI subscribes)
TranscriptionButton (shows spinner when isTranscribing)
TranscriptionModal (shows transcript when present)
```

### Key Data Flows

1. **Audio File → OpenAI API:** Binary audio file streamed via multipart form, max 25MB per API limits.
2. **Transcript → File System:** Plain text `.txt` file saved with same basename as audio file (e.g., `recording.mp3` → `recording.txt`).
3. **Timestamps → UI Display:** Word‑level timestamps (if using `verbose_json` response) used to create interactive transcript with click‑to‑seek.

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|--------------------------|
| 0‑100 users | Current architecture sufficient; API costs minimal |
| 100‑10k users | Consider local caching of transcripts to reduce API calls; batch processing for large libraries |
| 10k+ users | Evaluate local Whisper model (whisper.cpp) to avoid API costs; queue system for concurrent transcriptions |

### Scaling Priorities

1. **First bottleneck:** OpenAI API rate limits (requests per minute). Implement exponential backoff and retry logic.
2. **Second bottleneck:** Large audio libraries (>1k files). Add background batch processing with progress reporting.
3. **Third bottleneck:** File I/O when scanning folders with many transcript files. Cache transcript metadata in SQLite.

## Anti-Patterns

### Anti-Pattern 1: Frontend API Calls

**What people do:** Call OpenAI API directly from frontend JavaScript with API key embedded.

**Why it's wrong:** Exposes secret API key in client bundle, violates OpenAI security policies, CORS issues.

**Do this instead:** Keep API key in backend environment variable, use Tauri commands for secure communication.

### Anti-Pattern 2: Blocking UI During Transcription

**What people do:** Synchronous command that freezes UI until transcription completes.

**Why it's wrong:** Poor user experience, app appears frozen for long audio files.

**Do this instead:** Use async Rust commands (`#[tauri::command] async fn`), show spinner, consider progress events.

### Anti-Pattern 3: Hard‑Coded File Paths

**What people do:** Assume audio files are in a fixed location or have specific permissions.

**Why it's wrong:** Breaks on different OS, fails with read‑only directories, permission errors.

**Do this instead:** Use Tauri's path resolver for appropriate directories, validate file existence and permissions before attempting transcription.

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| OpenAI Whisper API | HTTP multipart form POST to `https://api.openai.com/v1/audio/transcriptions` | API key via Bearer token, max 25MB file size, supports streaming |
| File System (transcript saving) | Rust `std::fs::write` with same basename + `.txt` extension | Ensure UTF‑8 encoding, handle write errors gracefully |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| Frontend ↔ Backend | Tauri invoke with serialized AudioItem path | Follow existing command pattern for consistency |
| Rust command ↔ OpenAI client | Module‑internal function call with `Result` error propagation | Isolate HTTP concerns for testability |

## Sources

- **OpenAI Whisper API Documentation:** https://platform.openai.com/docs/api-reference/audio (HIGH confidence)
- **Tauri Command System:** Official Tauri docs on commands and async handling (HIGH confidence)
- **Existing Project Architecture:** `.planning/codebase/ARCHITECTURE.md` (HIGH confidence)
- **Desktop Audio App Patterns:** Industry knowledge from similar applications (MEDIUM confidence)

---

*Architecture research for: Open Recorder Tauri transcription feature*
*Researched: 2026-01-23*