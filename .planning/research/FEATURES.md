# Feature Research

**Domain:** Audio recorder transcription
**Researched:** 2026-01-23
**Confidence:** MEDIUM

## Feature Landscape

### Table Stakes (Users Expect These)

Features users assume exist. Missing these = product feels incomplete.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Per‑recording transcription button | Basic UI affordance to start transcription | Low | Button on each row or in player card |
| Transcript display with timestamps | Need to see what was said and when | Medium | Modal or panel with timestamped lines |
| Word-level timestamps | Users expect to see when each word was spoken for navigation | Medium | Whisper-1 supports `timestamp_granularities=["word"]` with `verbose_json` response format |
| Save transcript as .txt file | Users want to export results | Low | Simple file save dialog |
| Loading indicator & progress | Feedback that transcription is in progress | Low | Spinner + “Transcribing…” label |
| Error handling (network, API, file) | Things go wrong; user needs clear messages | Medium | User‑friendly error messages, retry option |
| API key configuration | Users must supply their own OpenAI key | Medium | Settings panel with secure storage |
| Cost transparency | Users worry about unexpected API costs | Low | Show estimated cost before transcribing |
| Support for common audio formats (mp3, m4a, wav) | Users expect to transcribe their existing recordings | Low | Whisper API supports mp3, mp4, mpeg, mpga, m4a, wav, webm |
| Auto language detection | Users don't want to manually specify language | Low | Whisper automatically detects language (supports 98+ languages) |
| Notification when transcription completes | Users want to know when transcript is ready | Low | Toast notification with "Transcript saved" message |

### Differentiators (Competitive Advantage)

Features that set the product apart. Not required, but valuable.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Batch transcription (multiple files) | Save time transcribing many recordings | Medium | Select multiple files → transcribe all |
| Offline transcription (local Whisper) | Privacy, no API cost, works offline | High | Bundle whisper.cpp + model (~1.5 GB) |
| Speaker diarization | Identify who said what (multiple speakers) | High | Use `gpt-4o-transcribe-diarize` model with chunking strategy; extra API cost |
| Transcript editing & correction | Fix mistakes in generated text | Medium | In‑place editing, save corrected version |
| Translation to other languages | Reach non‑English audiences | Medium | Use Whisper’s translation endpoint |
| AI summary of transcript | Quick overview of long recordings | Medium | Additional GPT call; extra cost |
| Auto‑tagging by content | Categorize recordings by topic | High | Additional NLP processing |
| Search within transcript | Quickly find keywords or phrases in long recordings | Low | Client-side text search highlighting matches |
| Export to multiple formats (SRT, VTT, JSON) | Users need subtitles for video editing or other tools | Medium | Convert Whisper output to SRT/VTT formats; already supports JSON via API |
| Real-time transcription (live) | Transcribe while recording is happening | High | Requires streaming API integration and real-time audio capture |
| Custom vocabulary/prompting | Improve accuracy for domain-specific terms | Low | Use `prompt` parameter to provide context (product names, acronyms) |
| Highlight keywords | Automatically identify important terms | Medium | Use NLP techniques or keyword extraction libraries |
| Integration with note-taking apps | Push transcripts to Obsidian, Notion, etc. | Medium | Build export connectors or copy-paste optimized formatting |

### Anti-Features (Commonly Requested, Often Problematic)

Features that seem good but create problems.

| Anti-Feature | Why Requested | Why Problematic | Alternative |
|--------------|---------------|-----------------|-------------|
| Auto‑transcribe every new recording | Save user effort | Expensive API calls, users may not want it | Explicit user action per recording |
| Storing transcripts unencrypted | Simplicity | Privacy risk if device is shared | Encrypt sensitive transcripts or rely on user’s file system |
| No rate limiting / queueing | Simplicity | Could blow through API quota | Sequential queue, optional pause/cancel |
| Hard‑coded API key | Convenience | Violates OpenAI terms, security risk | User supplies own key via settings |
| Blocking UI during transcription | Simpler implementation | Poor user experience | Async background job with progress |
| No file size validation | Simplicity | May fail on large files, waste API calls | Check file size (Whisper limit 25 MB), offer chunking |
| Auto-delete audio after transcription | Save disk space | Users lose original recordings; irreversible | Keep original audio; offer optional cleanup with confirmation |
| Require cloud account for local-only use | Sync across devices | Adds friction for users who only want local desktop app | Keep local-first; optional cloud sync as premium feature |
| Lock transcripts behind paywall | Monetization strategy | Frustrates users expecting basic functionality | Offer premium features (speaker diarization, export formats) while keeping basic transcription free |
| No way to correct transcription errors | Simplicity | Errors reduce trust in transcription accuracy | Provide basic edit functionality (text correction) in modal |
| No export options | Keep users in app | Users need to use transcripts elsewhere | At minimum save `.txt`; consider adding copy-to-clipboard and export buttons |
| Automatic language selection override | Users want to force language | Auto-detection is usually accurate; manual selection adds UI complexity | Keep auto-detection; add optional language override in settings |

## Feature Dependencies

```
API key configuration → Transcription button (needs key)
Transcription button → Loading indicator → Transcript display
Transcript display → Save as .txt
Batch transcription depends on single‑file transcription
Offline transcription requires local model download
Speaker diarization requires Basic transcription
Edit transcript requires Basic transcription
Export to multiple formats requires Transcript data model
Real-time transcription requires Streaming API integration
Real-time transcription conflicts with Offline transcription (different architecture)
```

### Dependency Notes

- **Speaker diarization requires Basic transcription:** Diarization builds on transcription output, adding speaker labels to segments.
- **Edit transcript requires Basic transcription:** Need transcript data before editing.
- **Export to multiple formats requires Transcript data model:** Need structured transcript data (words with timestamps) to generate SRT/VTT.
- **Real-time transcription conflicts with Offline transcription:** Real-time uses streaming API; offline uses local model. Choose one architectural direction.
- **Basic transcription requires Audio file selection:** Need to know which audio file to transcribe.
- **Audio file selection requires Folder scanning:** Need to scan folders to populate recording list.

## MVP Definition

### Launch With (v1)

Minimum viable product — what's needed to validate the concept.

- [x] **Per‑recording transcription button** (table stake)
- [x] **Transcript display with timestamps** (table stake)
- [x] **Word-level timestamps** (table stake)
- [x] **Save transcript as .txt file** (table stake)
- [x] **Loading indicator & progress** (table stake)
- [x] **Error handling (network, API, file)** (table stake)
- [x] **API key configuration via env var** (table stake)
- [x] **Cost transparency** (table stake)
- [x] **Support for common audio formats** (table stake)
- [x] **Auto language detection** (table stake)
- [x] **Notification when transcription completes** (table stake)

### Add After Validation (v1.x)

Features to add once core is working.

- [ ] **Batch transcription** — after single‑file works
- [ ] **Speaker diarization** — niche need, higher cost
- [ ] **Transcript editing & correction** — improve accuracy and user trust
- [ ] **Search within transcript** — utility for long recordings
- [ ] **Export to multiple formats (SRT, VTT)** — broader usability
- [ ] **Custom vocabulary/prompting** — improve accuracy for specialized content

### Future Consideration (v2+)

Features to defer until product-market fit is established.

- [ ] **Offline transcription** — major infrastructure change
- [ ] **Real-time transcription (live)** — major architectural change
- [ ] **AI summary of transcript** — additional LLM cost and complexity
- [ ] **Auto‑tagging by content** — additional NLP processing
- [ ] **Translation to other languages** — extra API endpoint
- [ ] **Highlight keywords** — nice-to-have enhancement
- [ ] **Integration with note-taking apps** — ecosystem expansion

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Per‑recording transcription button | HIGH | LOW | P1 |
| Transcript display with timestamps | HIGH | MEDIUM | P1 |
| Word-level timestamps | HIGH | MEDIUM | P1 |
| Save transcript as .txt file | HIGH | LOW | P1 |
| Loading indicator & progress | MEDIUM | LOW | P1 |
| Error handling | HIGH | MEDIUM | P1 |
| API key configuration | HIGH | MEDIUM | P1 |
| Cost transparency | MEDIUM | LOW | P1 |
| Support for common audio formats | HIGH | LOW | P1 |
| Auto language detection | MEDIUM | LOW | P1 |
| Notification on completion | LOW | LOW | P1 |
| Batch transcription | MEDIUM | MEDIUM | P2 |
| Speaker diarization | HIGH | HIGH | P2 |
| Transcript editing & correction | MEDIUM | HIGH | P2 |
| Search within transcript | MEDIUM | LOW | P2 |
| Export to multiple formats | MEDIUM | MEDIUM | P2 |
| Custom vocabulary/prompting | LOW | LOW | P3 |
| Offline transcription | LOW | VERY HIGH | P3 |
| Real-time transcription | LOW | HIGH | P3 |
| AI summary | LOW | HIGH | P3 |
| Auto‑tagging | LOW | HIGH | P3 |
| Translation | LOW | MEDIUM | P3 |
| Highlight keywords | LOW | MEDIUM | P3 |
| Integration with note-taking apps | LOW | MEDIUM | P3 |

**Priority key:**
- P1: Must have for launch (table stakes)
- P2: Should have, add when possible (differentiators for v1.x)
- P3: Nice to have, future consideration (v2+)

## Competitor Feature Analysis

| Feature | Otter.ai | OpenAI Whisper API | Our Approach |
|---------|----------|-------------------|--------------|
| Transcription accuracy | High (custom models) | High (Whisper/GPT-4o) | Use Whisper API (gpt-4o-transcribe) |
| Speaker diarization | Yes (automatic) | Yes (gpt-4o-transcribe-diarize) | Plan to add post-MVP |
| Word-level timestamps | Yes | Yes (whisper-1) | Use whisper-1 with timestamp_granularities |
| Export formats | Text, PDF, SRT, VTT | JSON, text, SRT, VTT, verbose_json | Start with .txt, add SRT/VTT later |
| Edit in-app | Full editor | No (API only) | Basic text correction post-MVP |
| Real-time transcription | Yes (live) | Yes (streaming API) | Defer to v2+ |
| Custom vocabulary | Yes (team vocab) | Yes (prompt parameter) | Support prompting parameter |
| Offline capability | No | No (cloud API) | Defer to v2+ with local model |
| Pricing | Subscription | Pay-per-minute | Free app with user's API key |

## Sources

- **OpenAI Whisper API documentation** (https://platform.openai.com/docs/guides/speech-to-text) — HIGH confidence
- **Otter.ai features page** (https://otter.ai/features) — MEDIUM confidence
- **Project context** (PROJECT.md) — HIGH confidence
- **Industry knowledge of audio recorder apps** (Voice Memos, Android Recorder) — LOW confidence

---
*Feature research for: Open Recorder Tauri transcription feature*
*Researched: 2026-01-23*
