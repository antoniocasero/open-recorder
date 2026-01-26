# Domain Pitfalls

**Domain:** Desktop audio recorder with transcription, editing, search, export, AI summarization, and insights
**Researched:** January 26, 2026
**Confidence:** HIGH

## Existing Critical Pitfalls (Validated)

### Pitfall 1: File Size and Format Limits Ignored
**What goes wrong:** Audio files larger than 25 MB are rejected by the Whisper API. Unsupported audio formats cause transcription failures.
**Why it happens:** Developers assume the API accepts any file the local player can play.
**Consequences:** App appears broken when users try to transcribe large or unsupported files.
**Prevention:** Validate file size before sending to API; convert unsupported formats; chunk large files.
**Detection:** API returns “file too large” or “unsupported format” errors.

### Pitfall 2: Blocking UI During Long‑Running Transcription
**What goes wrong:** Transcription of long audio files can take minutes, freezing the UI.
**Why it happens:** API calls are made from the main thread without background processing.
**Consequences:** Poor user experience, possible data loss if user force‑quits.
**Prevention:** Use Tauri’s `async` commands and spawn for long operations; provide progress feedback.
**Detection:** UI becomes unresponsive during transcription; no progress indicator.

### Pitfall 3: Fragile API Error Handling
**What goes wrong:** Network timeouts, rate limits, invalid API key cause transcription to fail silently or crash.
**Why it happens:** Error handling only checks for HTTP 200; other status codes are unhandled.
**Consequences:** Users see generic “Something went wrong” messages, cannot recover.
**Prevention:** Implement comprehensive error mapping; retry with exponential backoff; show user‑friendly messages.
**Detection:** Console logs show unhandled promise rejections; sporadic failures.

### Pitfall 4: Transcripts Lose Association with Audio Files
**What goes wrong:** Transcripts saved as separate `.txt` files lose the link to the original audio when the audio file is moved, renamed, or deleted.
**Why it happens:** Using only file‑paths as references; not storing a unique, persistent identifier.
**Consequences:** UI shows orphaned transcripts; user confusion.
**Prevention:** Store transcripts in a sidecar file and in a local database with audio file hash as key.
**Detection:** Transcripts disappear after moving the audio folder; duplicate transcripts.

### Pitfall 5: API Key Exposed in Client‑Side Code
**What goes wrong:** API key embedded in frontend code or logs, exposing it to users.
**Why it happens:** Misunderstanding of Tauri’s security model; treating the frontend as “trusted”.
**Consequences:** Security breach, violation of OpenAI terms.
**Prevention:** Keep the API key only in Rust’s environment variables; never send the key to the frontend.
**Detection:** API key appears in browser DevTools network payloads; hard‑coded in `.ts` files.

### Pitfall 6: Ignoring Language Detection and Prompting
**What goes wrong:** Whisper auto‑detects language but can mistake accented speech or low‑quality audio, producing gibberish transcripts.
**Why it happens:** Using default API parameters without `language` or `prompt` hints.
**Consequences:** Poor transcription quality for non‑English audio; technical terms mis‑transcribed.
**Prevention:** Allow users to specify language via UI dropdown; use the `prompt` parameter to provide context.
**Detection:** Transcripts of non‑English audio are poor quality; no UI option to set language.

### Pitfall 7: Not Requesting Timestamps
**What goes wrong:** Transcripts are plain text without timing information, making it impossible to sync playback with text.
**Why it happens:** Default API response is plain text; timestamps require `response_format=verbose_json`.
**Consequences:** No click‑to‑seek functionality; reduced usability.
**Prevention:** Always request `verbose_json` with `timestamp_granularities=[“word”, “segment”]`.
**Detection:** Transcripts stored as plain `.txt` only; no timestamp data in JSON.

### Pitfall 8: Unbounded Transcription Costs
**What goes wrong:** Whisper API costs ~$0.006 per minute; users may transcribe hundreds of hours, leading to unexpectedly high bills.
**Why it happens:** No cost tracking in the app; API key charged directly to developer’s account.
**Consequences:** Financial risk for developer; user dissatisfaction.
**Prevention:** Require users to supply their own OpenAI API key; show estimated cost before transcription.
**Detection:** Single API key used for all installations; no cost estimation in UI.

## New Pitfalls for v1.1

### Pitfall 9: Chart Performance with Large Datasets

**What goes wrong:** Insights page loads thousands of data points into Recharts, causing sluggish rendering and high memory usage.
**Why it happens:** Aggregating all transcription history without pagination or down‑sampling.
**Consequences:** Poor performance on large libraries; UI freezes.
**Prevention:**
- Aggregate data at the server side (Rust) by day/week/month.
- Limit displayed data points (e.g., last 30 days, top 10 languages).
- Use lazy loading for chart components.
**Detection:** Chart rendering takes >500ms; high CPU usage when opening insights page.

### Pitfall 10: i18next Configuration Errors

**What goes wrong:** Translation files not loaded, keys missing, language switching fails silently.
**Why it happens:** Incorrect i18next initialization, missing backend configuration, wrong file paths.
**Consequences:** UI shows translation keys (e.g., `common.save`) instead of translated text.
**Prevention:**
- Follow official i18next + react‑i18next setup guide.
- Use `i18next-http-backend` to load JSON from `/public/locales`.
- Validate translation files with tooling (e.g., i18next‑parser).
- Provide fallback language (English).
**Detection:** Console errors about missing translations; UI displays raw keys.

### Pitfall 11: Sticky Footer Layout Shifts

**What goes wrong:** Footer overlapping content or causing unexpected scrollbars on different screen sizes.
**Why it happens:** Using fixed heights, not accounting for dynamic content, missing proper CSS containment.
**Consequences:** Broken UI on certain screen resolutions; content hidden behind footer.
**Prevention:**
- Use Tailwind’s `sticky` utility with `bottom‑0` and appropriate `z‑index`.
- Test on multiple viewport sizes (including small laptop screens).
- Ensure parent container has sufficient `padding‑bottom`.
**Detection:** Visual misalignment during testing; user reports of hidden content.

### Pitfall 12: Persistent State Corruption

**What goes wrong:** Editor UI state saved to Tauri store becomes corrupted (invalid JSON, missing fields), causing crashes on load.
**Why it happens:** Changing state structure without migration logic; concurrent writes; power loss during write.
**Consequences:** Editor page fails to load; user loses custom settings.
**Prevention:**
- Version state objects and include migration functions.
- Use atomic writes (write to temporary file, then rename).
- Validate stored JSON before applying.
- Provide default state if corruption detected.
**Detection:** Console errors when parsing stored state; editor page blank.

### Pitfall 13: Language Switching Without Fallback

**What goes wrong:** User selects a language that has incomplete translations; missing keys cause blank labels.
**Why it happens:** Translation files not updated for new UI features; missing plural forms.
**Consequences:** Partial UI in different languages; confusing experience.
**Prevention:**
- Use i18next’s fallback mechanism (`fallbackLng: 'en'`).
- Implement a missing‑key handler that logs missing keys.
- Regularly sync translation files with source code.
**Detection:** Missing translations in console; blank buttons/labels.

### Pitfall 14: Over‑Engineering Chart Customization

**What goes wrong:** Spending excessive time customizing chart colors, animations, tooltips beyond user needs.
**Why it happens:** Desire for pixel‑perfect design; underestimating complexity of chart libraries.
**Consequences:** Delayed milestone delivery; increased maintenance burden.
**Prevention:**
- Start with Recharts defaults; apply only brand colors via Tailwind.
- Defer advanced customization (gradients, custom shapes) until after MVP validation.
**Detection:** Chart component with >500 lines of styling code; frequent tweaks.

### Pitfall 15: Ignoring RTL (Right‑to‑Left) Languages

**What goes wrong:** UI layout breaks when switching to Arabic or Hebrew (RTL scripts).
**Why it happens:** Assuming all languages are LTR; not testing with RTL locales.
**Consequences:** Unusable UI for RTL users; text alignment issues.
**Prevention:**
- Use CSS logical properties (`margin‑inline‑start` instead of `margin‑left`).
- Test with RTL language (e.g., Arabic) early.
- Consider using `i18next‑languagedetector` to detect direction.
**Detection:** UI misaligned when switching to Arabic; text flows incorrectly.

## Phase‑Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation |
|-------------|---------------|------------|
| **Insights page** | Chart performance with large datasets | Aggregate data in Rust, limit data points, use lazy loading. |
| **Language settings** | i18next configuration errors | Follow official setup, validate translation files, provide fallback. |
| **UI fixes** | Sticky footer layout shifts | Test on multiple viewports, use Tailwind’s sticky utilities correctly. |
| **Editor persistent storage** | State corruption | Version state, atomic writes, validate on load. |
| **Dynamic language switching** | Missing translations | Fallback to English, log missing keys, regular sync. |
| **Chart integration** | Over‑engineering | Stick to defaults, defer customization. |
| **RTL support** | Layout breaks | Use logical CSS, test early. |

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Chart performance issues | MEDIUM | Implement data aggregation in next patch; add pagination. |
| Missing translations | LOW | Add missing keys to JSON files; release updated translation pack. |
| Sticky footer layout shifts | LOW | Adjust CSS padding; test on affected viewports. |
| Persistent state corruption | MEDIUM | Reset to default state with user confirmation; add migration. |
| Language switching failures | LOW | Clear browser cache; ensure translation files are correctly deployed. |

## “Looks Done But Isn't” Checklist for v1.1

- [ ] **Insights charts:** Often missing data aggregation – verify charts render with realistic data (not just mock).
- [ ] **Language selector:** Often missing persistence – verify selected language survives app restart.
- [ ] **Translation coverage:** Often missing keys for new UI strings – verify all UI elements have translations.
- [ ] **Sticky footer:** Often overlapping content on small screens – test on 13” laptop.
- [ ] **Editor state persistence:** Often missing versioning – verify state loads after adding new fields.
- [ ] **Chart tooltips:** Often missing proper formatting – verify tooltips show correct units (minutes, count).
- [ ] **RTL layout:** Often ignored – verify Arabic language doesn’t break UI.

## Sources

- **Recharts performance documentation** – Official docs (HIGH confidence)
- **i18next common pitfalls** – Official documentation (HIGH confidence)
- **Tauri plugin‑store best practices** – Official docs (HIGH confidence)
- **Tailwind CSS sticky positioning** – Official docs (HIGH confidence)
- **Existing pitfalls research** – Previously validated (HIGH confidence)

---
*Pitfalls research for: Open Recorder Tauri v1.1 (insights page, UI fixes, language settings)*  
*Researched: January 26, 2026*