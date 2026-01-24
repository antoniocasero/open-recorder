## ISSUES FOUND

**Phase:** 01-transcription-mvp
**Plans checked:** 5
**Issues:** 1 blocker, 1 warning, 1 info

### Blockers (must fix)

**1. [task_completeness] Plan 04 missing Dashboard.tsx in files_modified**
- **Plan:** 04
- **Description:** Plan 04 Task 3 modifies Dashboard.tsx to add Toaster component, but Dashboard.tsx is not listed in files_modified. Without this change, toast notifications won't appear.
- **Fix:** Add "src/components/Dashboard.tsx" to files_modified list in plan frontmatter.

### Warnings (should fix)

**1. [scope_sanity] Ambiguous optional file in Plan 04**
- **Plan:** 04
- **Description:** files_modified includes "src/components/Transcription.tsx (optional, may be replaced)". This creates ambiguity about whether to modify or replace the existing component.
- **Fix:** Clarify intent: either remove from list, or specify to rename/remove existing Transcription.tsx to avoid conflict.

### Info (suggestions)

**1. [verification_derivation] Implementation-focused truths**
- **Plans:** 01, 03
- **Description:** Some must_haves truths are implementation-focused (e.g., "Codebase has TypeScript types", "Frontend can invoke transcription command via type‑safe wrapper"). Could be reframed as user‑observable outcomes.
- **Fix:** Reframe truths to focus on user‑observable outcomes, e.g., "Transcript data is typed for frontend display", "Frontend can trigger transcription".

### Coverage Summary

| Requirement | Plans | Status |
|-------------|-------|--------|
| TRAN-01 (transcribe recording) | 02, 03 | Covered |
| TRAN-02 (transcribe button) | 03 | Covered |
| TRAN-03 (progress indicator) | 03 | Covered |
| TRAN-04 (modal with timestamps) | 04 | Covered |
| TRAN-05 (sidecar .txt file) | 02 | Covered |
| TRAN-06 (notification toast) | 04 | Covered |
| TRAN-07 (API key via env var) | 01, 02 | Covered |
| TRAN-08 (error handling) | 05 | Covered |
| TRAN-09 (format support) | 05 | Covered |
| TRAN-10 (language auto‑detection) | 02 | Covered |

### Plan Summary

| Plan | Tasks | Files | Wave | Status |
|------|-------|-------|------|--------|
| 01   | 3     | 3     | 1    | Valid  |
| 02   | 3     | 2     | 2    | Valid  |
| 03   | 3     | 2     | 2    | Valid  |
| 04   | 3     | 4(+1 missing) | 3 | Needs revision |
| 05   | 3     | 2     | 4    | Valid  |

### Structured Issues

```yaml
issues:
  - plan: "04"
    dimension: "task_completeness"
    severity: "blocker"
    description: "Plan 04 Task 3 modifies Dashboard.tsx but file not listed in files_modified"
    fix_hint: "Add 'src/components/Dashboard.tsx' to files_modified list in plan frontmatter"

  - plan: "04"
    dimension: "scope_sanity"
    severity: "warning"
    description: "Ambiguous optional file 'src/components/Transcription.tsx (optional, may be replaced)'"
    fix_hint: "Clarify intent: either remove from list, or specify to rename/remove existing component"

  - plan: "01"
    dimension: "verification_derivation"
    severity: "info"
    description: "must_haves.truths are implementation-focused ('Codebase has TypeScript types')"
    fix_hint: "Reframe as user‑observable truths"

  - plan: "03"
    dimension: "verification_derivation"
    severity: "info"
    description: "must_haves.truths are implementation-focused ('Frontend can invoke transcription command via type‑safe wrapper')"
    fix_hint: "Reframe as user‑observable truths"
```

### Recommendation

1 blocker requires revision before execution. Update Plan 04 files_modified list to include Dashboard.tsx and clarify optional file.

After fixing, plans will be ready for execution.