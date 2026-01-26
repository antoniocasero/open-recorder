# Feature Landscape

**Domain:** Desktop audio recorder with transcription, editing, search, export, AI summarization, and insights
**Researched:** January 26, 2026
**Confidence:** HIGH

## Existing Features (Validated)

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

## New Features for v1.1

### Insights Page

| Feature | Category | Value Proposition | Complexity | Notes |
|---------|----------|-------------------|------------|-------|
| Transcription statistics dashboard | Differentiator | Visualize usage patterns, track productivity, identify trends | Medium | Use Recharts to display bar/line/pie charts of transcription count, duration, language distribution, word count over time. |
| Design mocks integration | Table stake | Professional, polished appearance | Low | Implement static design mocks as placeholders; later replace with real data. |
| Key metrics display | Differentiator | Show total recordings, total transcription minutes, average duration, most used language | Low | Simple card components with Tailwind CSS. |

### UI Fixes

| Feature | Category | Why Needed | Complexity | Notes |
|---------|----------|------------|------------|-------|
| Action button fix (Library page) | Table stake | Improve usability, ensure button triggers correct action | Low | Adjust button styling and event handling. |
| Duration display fix (Library page) | Table stake | Show accurate duration for each recording | Low | Format milliseconds to MM:SS, ensure data binding. |
| Sticky footer (Library page) | Table stake | Keep pagination/actions accessible while scrolling | Low | CSS `position: sticky` with Tailwind. |

### Editor Page Permanent Storage

| Feature | Category | Value Proposition | Complexity | Notes |
|---------|----------|-------------------|------------|-------|
| Persist action states (expanded panels, selected options) | Table stake | Remember user preferences across sessions, improve UX | Low | Extend existing Tauri store to save editor UI state. |

### Language Settings

| Feature | Category | Value Proposition | Complexity | Notes |
|---------|----------|-------------------|------------|-------|
| Language selection dropdown | Table stake | Allow users to choose UI language | Low | Dropdown with flag icons, store choice in Tauri store. |
| Translation capability | Differentiator | Support multiple languages (English, Spanish, French, etc.) | Medium | Use i18next + react‑i18next with JSON translation files. |
| Dynamic language switching | Table stake | Change UI language without restart | Low | React context + i18next `changeLanguage()`. |

## Anti-Features (Commonly Requested, Often Problematic)

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
Insights page → Recharts library
Language settings → i18next + react‑i18next
Language settings → Tauri store (for preference)
Editor persistent storage → Tauri store
UI fixes → Tailwind CSS adjustments (no new dependencies)
```

### Dependency Notes

- **Insights page requires Recharts:** Charting library needed for data visualization.
- **Language settings require i18next:** Internationalization framework needed for translation management.
- **All new features depend on existing Tauri store:** For persisting user preferences and UI state.
- **No dependency on existing transcription features:** New features are independent and can be developed in parallel.

## MVP Recommendation for v1.1

For milestone v1.1, prioritize:

1. **UI fixes** (action button, duration display, sticky footer) – low‑hanging fruit, immediate UX improvement.
2. **Language settings** (language selection, translation files) – foundational for international users.
3. **Editor page permanent storage** – simple persistence using existing store.
4. **Insights page** (design mocks, basic charts) – adds visual appeal and value.

Defer to post‑v1.1:
- Advanced chart interactivity (tooltips, filtering)
- Additional translation languages beyond English/Spanish/French
- Real‑time updates of insights data

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| UI fixes (action button, duration, sticky footer) | HIGH | LOW | P1 |
| Language selection dropdown | HIGH | LOW | P1 |
| Translation capability (i18n) | HIGH | MEDIUM | P1 |
| Editor persistent storage | MEDIUM | LOW | P1 |
| Insights page design mocks | LOW | LOW | P2 |
| Transcription statistics charts | MEDIUM | MEDIUM | P2 |
| Dynamic language switching | MEDIUM | LOW | P2 |
| Advanced chart interactivity | LOW | HIGH | P3 |

**Priority key:**
- P1: Must have for v1.1
- P2: Should have if time permits
- P3: Nice to have, defer

## Competitor Feature Analysis

| Feature | Otter.ai | OpenAI Whisper API | Our Approach (v1.1) |
|---------|----------|-------------------|-------------------|
| Insights / Analytics | Limited (usage stats) | None | Basic charts (Recharts) |
| Multi‑language UI | Yes (multiple languages) | No (API only) | i18next with JSON translations |
| UI customization | Limited | N/A | Tailwind CSS, sticky footer, action button fixes |
| Persistent UI state | Yes (cloud sync) | N/A | Tauri store (local) |

## Sources

- **Recharts documentation** – Official docs (recharts.github.io)
- **i18next documentation** – Official docs (react.i18next.com)
- **Tauri plugin‑store documentation** – Official docs (tauri.app)
- **Existing project code** – Already validated features

---
*Feature research for: Open Recorder Tauri v1.1 (insights page, UI fixes, language settings)*  
*Researched: January 26, 2026*