# Requirements: Open Recorder Tauri

**Defined:** 2026-01-26
**Core Value:** Users can easily record, organize, and listen to audio recordings with a simple, fast desktop interface.

## v1 Requirements

Requirements for milestone v1.1. Each maps to roadmap phases.

### Insights

- [x] **INSIGHTS-01**: User can view design mocks for insights page (professional appearance)
- [x] **INSIGHTS-02**: User can view transcription statistics dashboard with charts (usage patterns, trends)
- [x] **INSIGHTS-03**: User can view key metrics display (total recordings, transcription minutes, language distribution)

### UI Fixes

- [x] **UI-FIXES-01**: User can trigger correct action via library page action button
- [x] **UI-FIXES-02**: User can see accurate duration for each recording in library list
- [x] **UI-FIXES-03**: User can access pagination/actions via sticky footer while scrolling

### Editor Storage

- [x] **EDITOR-01**: User's editor page UI state (expanded panels, selected options) persists across sessions

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Language Settings

- **LANG-01**: User can select UI language via dropdown with flag icons
- **LANG-02**: User can switch UI language dynamically without restarting app
- **LANG-03**: User can view UI translated to multiple languages (English, Spanish, French, etc.)

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Language selection and translation in v1.1 | Deferred to v2 to focus on UI fixes and insights page |
| Advanced chart interactivity (tooltips, filtering) | Defer to post-v1.1; basic charts sufficient |
| Real-time updates of insights data | Not required for v1.1; static data refresh on navigation is acceptable |
| RTL (right-to-left) language support | Additional CSS complexity; defer until language settings implemented |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| INSIGHTS-01 | Phase 6 | Complete |
| INSIGHTS-02 | Phase 6 | Complete |
| INSIGHTS-03 | Phase 6 | Complete |
| UI-FIXES-01 | Phase 4 | Complete |
| UI-FIXES-02 | Phase 4 | Complete |
| UI-FIXES-03 | Phase 4 | Complete |
| EDITOR-01 | Phase 5 | Complete |

**Coverage:**
- v1 requirements: 7 total
- Mapped to phases: 7
- Unmapped: 0 ✓

---
*Requirements defined: 2026-01-26*
*Last updated: 2026-01-28 after Phase 6 completion*
