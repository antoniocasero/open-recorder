# Roadmap: Open Recorder Tauri

## Milestones

- ✅ **v1.0 Transcription MVP** - Phases 1-3 (shipped 2026-01-26)
- ✅ **v1.1 UI & Insights Enhancements** - Phases 4-6 (shipped 2026-01-28)

## Phases

<details>
<summary>✅ v1.0 Transcription MVP (Phases 1-3) - SHIPPED 2026-01-26</summary>

### Phase 1: Transcription MVP
**Goal**: Users can transcribe recordings using OpenAI Whisper API with basic UI integration
**Plans**: 5 plans

Plans:
- [x] 01-01: Set up Tauri v2 capabilities for OpenAI API integration
- [x] 01-02: Implement Whisper transcription with word-level timestamps
- [x] 01-03: Add transcription button and modal display
- [x] 01-04: Implement error handling and user notifications
- [x] 01-05: Polish UI and finalize transcription flow

### Phase 2: Transcript Management Enhancements
**Goal**: Users can edit, search, and export transcripts with enhanced UI
**Plans**: 6 plans

Plans:
- [x] 02-01: Add transcript editing with word-level selection
- [x] 02-02: Implement search across transcripts
- [x] 02-03: Add export to multiple formats (SRT, VTT, JSON)
- [x] 02-04: Enhance UI with three-page layout (Library, Editor, Insights)
- [x] 02-05: Implement batch transcription
- [x] 02-06: Add loading states and progress indicators

### Phase 3: Advanced Features & Scalability
**Goal**: Users benefit from AI summarization, caching, and performance improvements
**Plans**: 6 plans

Plans:
- [x] 03-01: Add AI-powered transcript summarization
- [x] 03-02: Implement caching for transcript data
- [x] 03-03: Add library scanning improvements
- [x] 03-04: Enhance error handling and retry logic
- [x] 03-05: Polish UI components and navigation
- [x] 03-06: Final testing and performance optimizations

</details>

### 🚧 v1.1 UI & Insights Enhancements (In Planning)

**Milestone Goal:** Add insights page with design mocks, fix library and editor UI issues, add editor state persistence.

#### Phase 4: UI Fixes & Enhancements
**Goal**: User experiences improved library page with correct actions, accurate durations, and accessible sticky footer
**Depends on**: Phase 3
**Requirements**: UI-FIXES-01, UI-FIXES-02, UI-FIXES-03
**Success Criteria** (what must be TRUE):
  1. User can trigger intended action (e.g., play, transcribe) via the library page action button
  2. User can see accurate duration (mm:ss) for each recording in the library list
  3. User can access pagination controls and action buttons via sticky footer while scrolling through recordings
**Plans**: 2 plans

Plans:
- [x] 04-01-PLAN.md — Populate audio durations during scan
- [x] 04-02-PLAN.md — Wire action button workflow and sticky footer

#### Phase 5: Editor State Persistence
**Goal**: User's editor page UI state persists across app sessions
**Depends on**: Phase 4
**Requirements**: EDITOR-01
**Success Criteria** (what must be TRUE):
  1. User's expanded/collapsed panels in editor page remain as left after reopening app
  2. User's selected options (e.g., export format, search filters) persist across app sessions
**Plans**: 2 plans

Plans:
- [x] 05-01-PLAN.md — Define editor UI state model and store helpers
- [x] 05-02-PLAN.md — Persist editor panels, filters, and export selection

#### Phase 6: Insights Page
**Goal**: User can view transcription statistics and key metrics through a professional insights dashboard
**Depends on**: Phase 5
**Requirements**: INSIGHTS-01, INSIGHTS-02, INSIGHTS-03
**Success Criteria** (what must be TRUE):
  1. User can navigate to insights page and view design mocks with professional appearance
  2. User can view transcription statistics dashboard with charts showing usage patterns and trends
  3. User can view key metrics display (total recordings, transcription minutes, language distribution)
**Plans**: 3 plans

Plans:
- [x] 06-01-PLAN.md — Persist transcription metadata (language + durations) for insights
- [x] 06-02-PLAN.md — Add Rust aggregation command + TS payload types
- [x] 06-03-PLAN.md — Build Insights dashboard UI with Recharts + export report

## Progress

**Execution Order:**
Phases execute in numeric order: 4 → 5 → 6

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1. Transcription MVP | v1.0 | 5/5 | Complete | 2026-01-26 |
| 2. Transcript Management Enhancements | v1.0 | 6/6 | Complete | 2026-01-26 |
| 3. Advanced Features & Scalability | v1.0 | 6/6 | Complete | 2026-01-26 |
| 4. UI Fixes & Enhancements | v1.1 | 2/2 | Complete | 2026-01-27 |
| 5. Editor State Persistence | v1.1 | 2/2 | Complete | 2026-01-27 |
| 6. Insights Page | v1.1 | 3/3 | Complete | 2026-01-28 |

---
*Roadmap created: 2026-01-26 for milestone v1.1*
