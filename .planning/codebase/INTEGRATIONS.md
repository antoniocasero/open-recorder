# External Integrations

**Analysis Date:** 2026-01-23

## APIs & External Services

**None detected.** The application operates entirely locally and does not call any external APIs or cloud services.

## Data Storage

**Databases:**
- Local file system only
- No external database provider

**File Storage:**
- Local filesystem only – audio files are read from user‑selected folders
- Persistent configuration via Tauri plugin‑store (`@tauri-apps/plugin-store`)

**Caching:**
- Not applicable

## Authentication & Identity

**Auth Provider:**
- None – the application does not require user authentication

## Monitoring & Observability

**Error Tracking:**
- Console logging only (`console.error`)
- Tauri plugin‑log (`tauri-plugin-log`) enabled in debug builds (level: Info)

**Logs:**
- Standard output/error during development
- No external log aggregation service

## CI/CD & Deployment

**Hosting:**
- Desktop application, not web‑hosted

**CI Pipeline:**
- Not detected (no `.github/workflows/`, `.gitlab-ci.yml`, etc.)

## Environment Configuration

**Required env vars:**
- None

**Secrets location:**
- No secrets required

## Webhooks & Callbacks

**Incoming:**
- None

**Outgoing:**
- None

## Tauri Plugins (Internal Integrations)

**Dialog:**
- `tauri-plugin-dialog` – native folder‑picker dialog (`src-tauri/src/lib.rs`)

**Store:**
- `tauri-plugin-store` – persistent key‑value storage (`src/lib/fs/config.ts`)

**Log:**
- `tauri-plugin-log` – structured logging (debug builds only)

---

*Integration audit: 2026-01-23*