# Pitfalls Research

**Domain:** Audio recorder transcription (desktop app with Whisper API)
**Researched:** Jan 23, 2026
**Confidence:** MEDIUM (based on official OpenAI documentation, Tauri best practices, and desktop app patterns; limited community post‑mortem verification)

## Critical Pitfalls

### Pitfall 1: File Size and Format Limits Ignored

**What goes wrong:**
Audio files larger than 25 MB are rejected by the Whisper API. Unsupported audio formats (e.g., .flac, .ogg) cause transcription failures. The app appears broken when users try to transcribe large or unsupported files.

**Why it happens:**
Developers assume the API accepts any file the local player can play. The Whisper API has strict limits (25 MB, specific formats: mp3, mp4, mpeg, mpga, m4a, wav, webm). Without validation, errors propagate as cryptic API errors.

**How to avoid:**
- Validate file size before sending to API.
- Convert unsupported formats to a supported one (e.g., ffmpeg).
- For files >25 MB, implement chunking using PyDub or similar (preserve sentence boundaries).
- Show clear error messages: “File too large (max 25 MB)” or “Format not supported.”

**Warning signs:**
- API returns “file too large” or “unsupported format” errors.
- Users report failures with long recordings.
- No file validation in UI before transcription button click.

**Phase to address:**
Phase 1 (Transcription MVP) – build validation and chunking logic before API integration.

---

### Pitfall 2: Blocking UI During Long‑Running Transcription

**What goes wrong:**
Transcription of a 1‑hour audio file can take minutes. If the UI thread waits synchronously, the app freezes, the user cannot cancel, and may force‑quit, losing progress.

**Why it happens:**
API calls are made from the main thread without background processing. Tauri commands run on the Rust side but still block the frontend if not spawned in a separate task.

**How to avoid:**
- Use Tauri’s `async` commands and `spawn` for long operations.
- Provide progress feedback (estimated time, percent complete) – Whisper streaming can give partial results.
- Allow cancellation (store a cancellation token).
- Store intermediate results so a crash doesn’t lose work.

**Warning signs:**
- UI becomes unresponsive during transcription.
- No progress indicator or cancel button.
- Transcription state is lost on app restart.

**Phase to address:**
Phase 1 (Transcription MVP) – design async architecture with progress and cancellation.

---

### Pitfall 3: Fragile API Error Handling

**What goes wrong:**
Network timeouts, rate limits (requests/min), invalid API key, insufficient credits cause transcription to fail silently or crash. Users see generic “Something went wrong” messages.

**Why it happens:**
Error handling only checks for HTTP 200; other status codes are unhandled. No retry logic, exponential backoff, or user‑actionable feedback.

**How to avoid:**
- Implement comprehensive error mapping: network errors, 429 (rate limit), 401 (invalid key), 402 (quota exceeded), 413 (file too large).
- Retry with exponential backoff for transient errors (network, rate limits).
- Store API errors in logs for debugging.
- Show user‑friendly messages: “OpenAI rate limit reached – please wait a minute” or “Check your API key in settings.”

**Warning signs:**
- Console logs show unhandled promise rejections.
- Users report sporadic failures that resolve after a few minutes.
- No logging of API error details.

**Phase to address:**
Phase 1 (Transcription MVP) – implement error‑handling wrapper for Whisper API calls.

---

### Pitfall 4: Transcripts Lose Association with Audio Files

**What goes wrong:**
Transcripts are saved as separate `.txt` files but lose the link to the original audio when the audio file is moved, renamed, or deleted. The UI shows orphaned transcripts.

**Why it happens:**
Using only file‑paths as references; not storing a unique, persistent identifier (e.g., hash of audio content). File‑system changes break the link.

**How to avoid:**
- Store transcripts in a sidecar file (e.g., `audio.mp3.txt`) **and** in a local database with audio file hash as key.
- Use `AudioItem.id` (MD5 of path) as a stable identifier (but note: ID changes if path changes).
- Consider storing audio metadata (size, mtime) to detect modifications.
- Provide a “re‑link” feature if association is lost.

**Warning signs:**
- Transcripts disappear after moving the audio folder.
- Duplicate transcripts for the same audio file.
- No mechanism to update transcript when audio is re‑recorded.

**Phase to address:**
Phase 2 (Transcript Management) – design persistent storage model for transcripts.

---

### Pitfall 5: API Key Exposed in Client‑Side Code

**What goes wrong:**
Even though Tauri runs Rust on the backend, developers might accidentally embed the API key in frontend code (e.g., in `invoke` payloads) or log it, exposing it to users.

**Why it happens:**
Misunderstanding of Tauri’s security model; treating the frontend as “trusted” and putting secrets in environment variables that are bundled into the frontend.

**How to avoid:**
- Keep the API key only in Rust’s environment variables (`std::env::var`).
- Never send the key to the frontend.
- Use Tauri’s `plugin` system for secure credential storage if needed.
- Add a pre‑commit hook that scans for API key patterns.

**Warning signs:**
- API key appears in browser DevTools network payloads.
- Key is hard‑coded in `.ts` files.
- Logs print the key (even partially).

**Phase to address:**
Phase 1 (Transcription MVP) – establish secure API key handling pattern.

---

### Pitfall 6: Ignoring Language Detection and Prompting

**What goes wrong:**
Whisper auto‑detects language but can mistake accented speech or low‑quality audio for the wrong language, producing gibberish transcripts. Also, technical terms or proper nouns are mis‑transcribed.

**Why it happens:**
Using default API parameters without `language` or `prompt` hints. Whisper’s prompt parameter can guide transcription (e.g., correct spelling of acronyms), but it’s limited to 224 tokens.

**How to avoid:**
- Allow users to specify language (optional) via UI dropdown.
- Use the `prompt` parameter to provide context: product names, speaker names, topic‑specific vocabulary.
- For critical applications, consider a post‑processing step with GPT‑4 to correct transcripts (adds cost and latency).

**Warning signs:**
- Transcripts of non‑English audio are poor quality.
- Technical terms appear as phonetically similar common words.
- No UI option to set language or add hints.

**Phase to address:**
Phase 2 (Transcript Management) – add language selection and prompting UI.

---

### Pitfall 7: Not Requesting Timestamps

**What goes wrong:**
Transcripts are plain text without timing information, making it impossible to sync playback with text or jump to specific sections. Users expect click‑to‑seek functionality.

**Why it happens:**
Default API response is plain text; timestamps require `response_format=verbose_json` and `timestamp_granularities=[“word”]` (word‑level) or `[“segment”]` (sentence‑level). Developers may not know this feature exists.

**How to avoid:**
- Always request `verbose_json` with `timestamp_granularities=[“word”, “segment”]` (Whisper‑1) or use `gpt‑4o‑transcribe` with `response_format=json` (includes segment timestamps).
- Store timestamps in the transcript data structure.
- Build UI that highlights words as audio plays (like a karaoke player).

**Warning signs:**
- Transcripts are stored as plain `.txt` only.
- No timestamp data in transcript JSON.
- Playback cannot be synchronized with text.

**Phase to address:**
Phase 1 (Transcription MVP) – request timestamps from API and store them.

---

### Pitfall 8: Unbounded Transcription Costs

**What goes wrong:**
Whisper API costs ~$0.006 per minute (as of 2026). Users may transcribe hundreds of hours, leading to unexpectedly high bills. No budgeting or usage alerts.

**Why it happens:**
No cost tracking in the app; API key is charged directly to the developer’s OpenAI account. If the app is distributed, each user would need their own key, but many developers share a single key.

**How to avoid:**
- Require users to supply their own OpenAI API key (store securely per user).
- If using a shared key, implement per‑user rate limiting and cost quotas.
- Show estimated cost before transcription (based on audio duration).
- Log usage metrics to monitor spending.

**Warning signs:**
- Single API key used for all installations.
- No cost estimation in UI.
- OpenAI bill spikes after releasing the app.

**Phase to address:**
Phase 3 (User Management & Billing) – design API key ownership and cost‑tracking.

## Technical Debt Patterns

Shortcuts that seem reasonable but create long‑term problems.

| Shortcut | Immediate Benefit | Long‑term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Store transcripts only as sidecar `.txt` files | Simple, no database needed | Hard to search, filter, update; loses metadata | MVP prototype only |
| Use Whisper‑1 model exclusively | Works out‑of‑the‑box | Misses newer model improvements (better accuracy, lower latency) | Never – start with `gpt‑4o‑transcribe` |
| Hard‑code OS‑specific paths (e.g., `C:\Users`) | Quick development | Breaks on macOS/Linux; violates user directory preferences | Never – use Tauri path resolver |
| Over‑engineer timestamp UI before basic display | “Cool” demo feature | Delays MVP; complex UI bugs | After basic transcription works |
| Synchronous Tauri commands | Easier to reason about | UI freezes on long operations | Never – always use async |
| Ignore audio pre‑processing | Faster development | Poor transcription quality for noisy/compressed audio | Only if audio quality is guaranteed |
| No transcript caching | Simpler code | Repeated transcription wastes API credits and time | Never – cache by audio hash |

## Integration Gotchas

Common mistakes when connecting to external services.

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| Whisper API | Sending file as base64 in JSON payload | Use `multipart/form‑data` with file field (OpenAI client handles this) |
| Whisper API | Not setting `model` parameter (default may be deprecated) | Explicitly set `model=“gpt‑4o‑transcribe”` (or `whisper‑1` if needed) |
| Whisper API | Assuming all audio formats supported | Limit to documented formats: mp3, mp4, mpeg, mpga, m4a, wav, webm |
| Tauri command | Returning large JSON (>1 MB) via `invoke` | Stream response or store in file and return file path |
| File system | Assuming audio file is readable (permissions, locks) | Check `fs::read` result and handle `io::Error` gracefully |
| Environment variables | Assuming `.env` is loaded in Tauri backend | Use `std::env::var` and provide fallback; document setup steps |
| Unicode paths | Using `String` instead of `PathBuf` for file operations | Use Rust’s `PathBuf` and UTF‑8 aware functions; test with non‑ASCII names |

## Performance Traps

Patterns that work at small scale but fail as usage grows.

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Loading all transcripts into memory at startup | App starts slowly; high memory usage | Lazy‑load transcripts on demand; use pagination | 100+ transcripts |
| Storing audio files in memory for processing | Out‑of‑memory crashes for long files | Stream audio from disk in chunks | Files >100 MB |
| Blocking main thread on API calls | UI freezes during transcription | Use Tokio tasks in Rust; await in frontend | Any transcription >10 seconds |
| No caching of API results | Repeated transcription of same audio wastes money and time | Cache transcript by audio hash; invalidate if audio modified | User re‑transcribes same file |
| Synchronous file I/O in Rust | UI jank while scanning folder | Use `tokio::fs` for async file operations | Folders with 1000+ files |
| No queue for transcription requests | Rate‑limit errors when user clicks quickly | Implement simple queue with one concurrent transcription | Multiple clicks in quick succession |

## Security Mistakes

Domain‑specific security issues beyond general web security.

| Mistake | Risk | Prevention |
|---------|------|------------|
| Logging API keys in error messages | Key leaked to logs, potentially exposed to users | Redact keys from logs; use `***` masking |
| Storing user API keys in plaintext | Keys stolen if device compromised | Use system keychain (macOS Keychain, Windows Credential Manager) via Tauri plugin |
| Transmitting audio over insecure channel | Audio content intercepted (privacy issue) | Ensure TLS in API calls (OpenAI uses HTTPS) |
| Allowing arbitrary file paths in Tauri commands | Path traversal attacks (e.g., `../../../etc/passwd`) | Validate paths are within user‑selected directories |
| Embedding API key in frontend bundle | Key extractable by reverse‑engineering | Keep key in Rust backend only; use environment variables |
| Over‑logging sensitive data (full transcripts) | Privacy violation; logs become PII repository | Use structured logging with levels; redact transcript text in production logs |

## UX Pitfalls

Common user experience mistakes in this domain.

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| No visual feedback while transcribing | User thinks app crashed | Show progress bar, estimated time, live text stream |
| Transcript displayed as monolithic wall of text | Hard to scan and navigate | Break into paragraphs with timestamps; allow clicking to play from that point |
| No way to edit/correct transcripts | Errors persist forever | In‑place text editing with save option |
| Cannot export transcripts in common formats (SRT, VTT) | Limits usability for video editors | Export as `.txt`, `.srt`, `.vtt`, `.json` |
| Transcription button always enabled even when no API key | User clicks, gets cryptic error | Disable button with tooltip: “Set OpenAI API key in settings” |
| No warning before transcribing long files | User starts 3‑hour transcription unknowingly | Show confirmation: “This will take ~10 minutes and cost ~$1.08. Continue?” |
| No progress indicators | User unsure if transcription is still working | Show spinner, “Transcribing…” label, disable button during processing |

## “Looks Done But Isn't” Checklist

Things that appear complete but are missing critical pieces.

- [ ] **Transcription button:** Often missing progress indication – verify a spinner appears and cancel is possible.
- [ ] **Transcript display:** Often missing timestamps – verify each segment has start/end times stored.
- [ ] **API key configuration:** Often missing validation – verify UI tests the key before allowing transcription.
- [ ] **Error handling:** Often missing user‑friendly messages – verify network errors show “Check your connection” not “Error 500”.
- [ ] **File association:** Often missing re‑linking after move – verify moving audio files doesn’t orphan transcripts.
- [ ] **Cost awareness:** Often missing price estimation – verify duration‑to‑cost calculation is shown before transcribing.
- [ ] **Export functionality:** Often missing format options – verify SRT/VTT export works and includes timestamps.
- [ ] **Audio format support:** Often missing validation – verify unsupported formats are rejected with a helpful message.
- [ ] **Unicode paths:** Often missing handling – verify audio files with non‑ASCII names can be transcribed.
- [ ] **Rate limiting:** Often missing queue – verify rapid clicks don’t cause rate‑limit errors.

## Recovery Strategies

When pitfalls occur despite prevention, how to recover.

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Orphaned transcripts (audio moved) | LOW | Scan filesystem for matching audio by hash; offer manual re‑link UI |
| Corrupt transcript cache | LOW | Delete cache file; re‑transcribe (costs API credits) |
| API key leaked | HIGH | Rotate key immediately; notify users to update their settings |
| Whisper API deprecation | MEDIUM | Update model parameter to newer version; test transcription quality |
| Database schema migration | MEDIUM | Write migration script; backup before running |
| Hard‑coded paths breaking on other OS | MEDIUM | Replace with Tauri path resolver; release patch update |
| Rate‑limit ban | LOW | Wait for cooldown; implement exponential backoff |

## Pitfall-to-Phase Mapping

How roadmap phases should address these pitfalls.

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| File size/format limits | Phase 1 (Transcription MVP) | Unit test validation logic with sample files |
| Blocking UI | Phase 1 (Transcription MVP) | Manual test: UI stays responsive during 30‑min transcription |
| API error handling | Phase 1 (Transcription MVP) | Simulate network failure; verify user‑friendly error appears |
| Transcript association | Phase 2 (Transcript Management) | Move audio file, verify transcript still linked |
| API key exposure | Phase 1 (Transcription MVP) | Code review: no API key in frontend bundle |
| Language/prompting | Phase 2 (Transcript Management) | UI test: language dropdown and prompt field affect output |
| Timestamps | Phase 1 (Transcription MVP) | Verify transcript JSON contains `words` array with start/end |
| Cost management | Phase 3 (User Management & Billing) | Cost estimation shown before transcription; usage logs exist |
| Hard‑coded path assumptions | Phase 1 (Transcription MVP) | Test on macOS, Windows, Linux; paths resolve correctly |
| Rate‑limit handling | Phase 1 (Transcription MVP) | Simulate rate‑limit response; verify retry after delay |
| Audio format support | Phase 1 (Transcription MVP) | Test with all Whisper‑supported formats; unsupported formats rejected |

## Sources

- OpenAI Audio API documentation (https://platform.openai.com/docs/guides/speech‑to‑text) – HIGH confidence
- Whisper model limitations (https://github.com/openai/whisper) – MEDIUM confidence
- Tauri security best practices (https://tauri.app/v1/guides/security/) – MEDIUM confidence
- Tauri async commands (https://v2.tauri.app/development/command/) – HIGH confidence
- Desktop app UX patterns for long‑running tasks – LOW confidence (general knowledge)
- OpenAI rate limits (https://platform.openai.com/docs/guides/rate-limits) – HIGH confidence

---
*Pitfalls research for: Open Recorder Tauri transcription feature*
*Researched: Jan 23, 2026*