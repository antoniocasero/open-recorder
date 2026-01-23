# Phase 1: Transcription MVP - Research

**Researched:** 2026-01-23
**Domain:** Audio transcription with OpenAI Whisper API in Tauri desktop app
**Confidence:** HIGH (verified with official OpenAI documentation, async-openai crate docs, and existing project research)

## Summary

This research investigates implementing audio transcription using OpenAI's Whisper API in a Tauri desktop application. The phase goal is to allow users to transcribe audio recordings with clear feedback and saved results.

Key findings:
- Use `async-openai` Rust crate for type-safe Whisper API integration
- Store API key securely in backend environment variable (`OPENAI_API_KEY`)
- Implement Tauri command for async transcription with progress indication
- Save transcripts as `.txt` files alongside original audio files
- Display transcripts in modal overlay with word-level timestamps (if available)
- Provide toast notifications for completion and errors

**Primary recommendation:** Use `async-openai` crate with `gpt-4o-transcribe` model for best accuracy, request `verbose_json` response format with word timestamps, and implement client-side caching of transcript files.

## Standard Stack

The established libraries/tools for OpenAI Whisper integration in Rust:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| async-openai | 0.32.3 | Official-style Rust client for OpenAI APIs, including Whisper transcription | Most mature Rust client with full Whisper support, async/await, automatic multipart file upload, configurable |
| tokio | 1.49.0 | Async runtime for Rust backend commands | Required by async-openai and Tauri async commands; standard Rust async runtime |
| reqwest | 0.13.1 | HTTP client for making API calls (used by async-openai) | Robust, TLS support, streaming; async-openai depends on reqwest ^0.12, compatible with 0.13.1 |
| tauri (existing) | 2.9.5 | Desktop app framework for Rust backend + Next.js frontend | Already in use; provides secure IPC for calling transcription commands from UI |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| serde_json | 1.0 | JSON serialization/deserialization for API responses | Already dependency; used for parsing Whisper API results |
| thiserror | 2.0 | Ergonomic error definitions for Rust commands | When defining custom error types for transcription failures |
| tracing | 0.1 | Structured logging for debugging transcription flow | Optional but recommended for production diagnostics |
| tauri-plugin-store (existing) | 2.4.2 | Persistent key‑value storage for API key and settings | If moving away from env‑var to UI‑configurable API key |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| async-openai | manual reqwest calls | Manual implementation error‑prone, misses API nuances, no type safety |
| OpenAI API via frontend fetch | Rust backend call | Never—API key must stay in backend for security |
| Local Whisper.cpp | OpenAI Whisper API | When offline transcription required; adds ~1‑2 GB model size and CPU/GPU complexity |
| Other OpenAI Rust crates (openai‑rs, openai‑api) | async-openai | async-openai is more actively maintained and covers Whisper specifically |

**Installation:**
```bash
# Add Rust dependencies
cargo add async-openai@0.32.3
cargo add tokio@1.49 --features full
cargo add thiserror@2.0
cargo add tracing@0.1

# Ensure existing dependencies are up to date
cargo update
```

## Architecture Patterns

### Recommended Project Structure
```
src/
├── components/
│   ├── TranscriptionButton.tsx   # Button with spinner state per recording
│   ├── TranscriptionModal.tsx    # Modal with timestamp display
│   └── Toast.tsx                 # Reusable notification toast
├── lib/
│   ├── transcription/
│   │   ├── commands.ts           # TypeScript wrapper for invoke
│   │   ├── types.ts              # Transcript, Timestamp interfaces
│   │   └── state.ts              # React hooks for transcription state
│   └── fs/                       # Existing file system commands

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

### Pattern 1: Secure Backend Transcription Command
**What:** Extend Tauri's command system with a new `transcribe_audio` command that handles the entire transcription pipeline securely in Rust.

**When to use:** When you need secure access to environment variables, filesystem, and network from desktop backend.

**Example:**
```rust
// Source: async-openai crate documentation + OpenAI API spec
#[tauri::command]
async fn transcribe_audio(path: PathBuf) -> Result<Transcript, String> {
    let api_key = std::env::var("OPENAI_API_KEY")
        .map_err(|_| "Missing OPENAI_API_KEY environment variable")?;
    
    let config = OpenAIConfig::new().with_api_key(&api_key);
    let client = Client::with_config(config);
    
    let file = File::open(&path).map_err(|e| format!("Failed to open audio file: {}", e))?;
    
    let request = CreateTranscriptionRequestArgs::default()
        .file(file)
        .model("gpt-4o-transcribe")
        .response_format("verbose_json")
        .timestamp_granularities(&["word"])
        .build()
        .map_err(|e| format!("Invalid request: {}", e))?;
    
    let response = client
        .audio()
        .transcriptions()
        .create(request)
        .await
        .map_err(|e| format!("API error: {}", e))?;
    
    // Save transcript as .txt file alongside original audio
    let transcript_path = path.with_extension("txt");
    std::fs::write(&transcript_path, &response.text)
        .map_err(|e| format!("Failed to write transcript: {}", e))?;
    
    Ok(Transcript {
        text: response.text,
        words: response.words, // word-level timestamps
        duration: response.duration,
        language: response.language,
    })
}
```

### Pattern 2: Frontend State Management per Recording
**What:** Maintain transcription state (loading, error, transcript data) per recording in the UI.

**When to use:** When you need to show per‑recording spinners, error messages, and cached transcripts.

**Example:**
```typescript
// In RecordingsList component
const [transcriptionStates, setTranscriptionStates] = useState<Record<string, TranscriptionState>>({});

const handleTranscribe = async (recording: AudioItem) => {
  setTranscriptionStates(prev => ({ ...prev, [recording.id]: { status: 'loading' } }));
  try {
    const transcript = await transcribeAudio(recording.path);
    setTranscriptionStates(prev => ({ ...prev, [recording.id]: { status: 'success', transcript } }));
    showToast('Transcription complete', 'success');
  } catch (error) {
    setTranscriptionStates(prev => ({ ...prev, [recording.id]: { status: 'error', error: error.message } }));
    showToast(`Transcription failed: ${error.message}`, 'error');
  }
};
```

### Anti-Patterns to Avoid
- **Frontend API Calls:** Never call OpenAI API directly from frontend JavaScript—exposes API key.
- **Blocking UI:** Don't use synchronous commands—always use async Tauri commands with progress indicators.
- **Hard‑Coded Paths:** Don't assume fixed audio file locations—use Tauri's path resolver for cross‑platform compatibility.

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Multipart file upload to OpenAI | Manual form‑data construction | async‑openai's `CreateTranscriptionRequest` | Handles boundary generation, MIME types, file streaming, error recovery |
| API error handling | Ad‑hoc HTTP status checks | async‑openai's `Error` enum with variants for rate limits, authentication, etc. | Comprehensive error mapping, retry logic, backoff strategies |
| Progress indicators | Custom event system | Tauri's event emission + frontend subscription | Built‑in, cross‑process, type‑safe |
| Transcript timestamp parsing | Manual JSON parsing | async‑openai's typed response (`TranscriptionResponse`) | Guaranteed correctness, automatic deserialization, IDE support |
| Audio format validation | Custom validation logic | Whisper API's built‑in validation + async‑openai error messages | Covers all supported formats, upstream‑compatible |

**Key insight:** OpenAI's API has subtle requirements (file size limits, supported formats, timestamp granularities). Using `async-openai` ensures compliance and reduces bugs.

## Common Pitfalls

### Pitfall 1: File Size and Format Limits Ignored
**What goes wrong:** Audio files larger than 25 MB are rejected by Whisper API. Unsupported formats cause silent failures.
**Why it happens:** Developers assume any playable audio file is supported.
**How to avoid:** Validate file size before sending; convert unsupported formats or chunk large files.
**Warning signs:** API returns "file too large" or "unsupported format" errors.

### Pitfall 2: Blocking UI During Long‑Running Transcription
**What goes wrong:** Transcription of long audio files freezes UI, leading to poor UX.
**Why it happens:** API calls made synchronously or without async/await.
**How to avoid:** Use Tauri async commands, show progress spinner, consider streaming.
**Warning signs:** UI becomes unresponsive during transcription.

### Pitfall 3: Fragile API Error Handling
**What goes wrong:** Network timeouts, rate limits, invalid API key cause cryptic errors.
**Why it happens:** Only HTTP 200 responses are handled.
**How to avoid:** Map all error types (429, 401, 402, 413), implement retry logic, show user‑friendly messages.
**Warning signs:** Users see generic "Something went wrong" messages.

### Pitfall 4: API Key Exposed in Client‑Side Code
**What goes wrong:** API key accidentally bundled into frontend code or logs.
**Why it happens:** Misunderstanding Tauri's security model.
**How to avoid:** Keep key only in Rust environment variables; never send to frontend.
**Warning signs:** API key appears in browser DevTools network payloads.

### Pitfall 5: Not Requesting Timestamps
**What goes wrong:** Transcripts lack timing information, preventing click‑to‑seek functionality.
**Why it happens:** Default API response is plain text.
**How to avoid:** Always request `verbose_json` with `timestamp_granularities=["word"]`.
**Warning signs:** Transcripts stored as plain `.txt` only.

## Code Examples

Verified patterns from official sources:

### Basic Transcription with async‑openai
```rust
// Source: async-openai crate documentation + OpenAI API spec
use async_openai::{Client, config::OpenAIConfig};
use async_openai::types::CreateTranscriptionRequestArgs;
use std::fs::File;

async fn transcribe_audio_file(path: &str) -> Result<String, Box<dyn std::error::Error>> {
    let config = OpenAIConfig::new()
        .with_api_key(std::env::var("OPENAI_API_KEY")?);
    let client = Client::with_config(config);
    
    let file = File::open(path)?;
    let request = CreateTranscriptionRequestArgs::default()
        .file(file)
        .model("gpt-4o-transcribe")
        .response_format("verbose_json")
        .timestamp_granularities(&["word"])
        .build()?;
    
    let response = client.audio().transcriptions().create(request).await?;
    Ok(response.text)
}
```

### Tauri Command Integration
```rust
// Source: Tauri command pattern + async-openai
#[tauri::command]
async fn transcribe_audio(path: PathBuf) -> Result<Transcript, String> {
    // ... implementation as in Pattern 1
}
```

### Frontend Command Wrapper
```typescript
// Source: Existing project pattern (src/lib/fs/commands.ts)
import { invoke } from '@tauri-apps/api/core';
import { Transcript } from '@/lib/transcription/types';

export async function transcribeAudio(filePath: string): Promise<Transcript> {
  return invoke<Transcript>('transcribe_audio', { path: filePath });
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| whisper‑1 model | gpt‑4o‑transcribe model | 2024 | Better accuracy, lower latency, supports streaming |
| Plain text response | verbose_json with word timestamps | Whisper V2 | Enables interactive transcript navigation |
| Manual file chunking | Server‑side VAD chunking (chunking_strategy="auto") | gpt‑4o‑transcribe | Better handling of long audio, preserves sentence boundaries |
| Frontend API key storage | Backend environment variables | Security best practices | Prevents key exposure, complies with OpenAI terms |

**Deprecated/outdated:**
- `whisper-1` model: Still works but less accurate than `gpt-4o-transcribe`
- `response_format="text"`: Loses timestamp metadata needed for interactive transcripts
- Synchronous Tauri commands: Block UI, poor user experience

## Open Questions

Things that couldn't be fully resolved:

1. **Chunking large audio files (>25 MB)**
   - What we know: Whisper API has 25 MB file size limit; server‑side VAD chunking available via `chunking_strategy="auto"`
   - What's unclear: Whether client‑side chunking is needed for files >25 MB (API may reject before server‑side chunking)
   - Recommendation: Implement client‑side validation and chunking using PyDub or similar if API rejects large files

2. **Streaming transcription for real‑time feedback**
   - What we know: `gpt-4o-transcribe` supports streaming via `stream=true`
   - What's unclear: How to integrate streaming with Tauri event system for incremental UI updates
   - Recommendation: For MVP, use non‑streaming; add streaming in future phase for better UX

## Sources

### Primary (HIGH confidence)
- OpenAI Audio API documentation (https://platform.openai.com/docs/api-reference/audio) – Create transcription endpoint, parameters, response formats
- async-openai 0.32.3 documentation (https://docs.rs/async-openai/latest/async_openai/) – Audio module, Transcriptions struct, request builders
- Tauri Command System (https://v2.tauri.app/development/command/) – Async commands, error handling, IPC patterns

### Secondary (MEDIUM confidence)
- Existing project research (`.planning/research/STACK.md`, `ARCHITECTURE.md`, `PITFALLS.md`) – Validated stack recommendations, architecture patterns, common pitfalls
- Tauri security best practices (https://tauri.app/v1/guides/security/) – Environment variable handling, frontend/backend separation

### Tertiary (LOW confidence)
- Community patterns for Tauri + OpenAI integration – Limited verification but aligns with official documentation

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH – Verified with official crate documentation and OpenAI API spec
- Architecture: HIGH – Based on existing Tauri patterns and verified async-openai usage
- Pitfalls: MEDIUM – Drawn from existing research with some unverified community reports

**Research date:** 2026-01-23
**Valid until:** 2026-02-23 (30 days, stable stack)

--- 

*Research for: Phase 1 Transcription MVP - Open Recorder Tauri*