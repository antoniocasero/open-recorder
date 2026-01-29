# Local Storage Model Design

## Overview

The app will store all recording artifacts in a dedicated, local-first folder under the OS app data directory. Each recording lives in its own subfolder keyed by the audio name, with a single transcript file and related analysis artifacts. Aggregate insights are stored separately in their own folder.

This replaces timestamped sidecar transcripts and ensures a single canonical transcript per recording.

## Goals

- Store one transcript per recording (no timestamped variants).
- Keep audio + transcript + analysis co-located in a stable folder.
- Provide a configurable root path for advanced users.
- Separate aggregate insights from per-recording artifacts.

## Non-goals

- Changing transcript format (txt stays).
- Rebuilding insights UI or analytics logic.
- Cloud sync or external storage.

## Storage layout

Default root path:

```
<local_data_dir>/open-recorder/
```

Per-recording artifacts:

```
open-recorder/
  audios/
    <audio-name>/
      audio.<ext>
      transcript.txt
      summary.txt
      actions.json
      insights.json
```

Aggregate insights:

```
open-recorder/
  insights/
    library-summary.json
    topics.json
    trends.json
    last-run.json
```

## Naming and collisions

The folder name is based on the source file name without extension. If two files share the same name, append a short hash derived from the original full path (e.g., `meeting-3fa2c1`). The UI continues to display the base filename; the hash is only for storage.

## Data flow changes

1. Resolve managed folder path from the selected recording.
2. Ensure `<root>/open-recorder/audios/<folder>` exists.
3. Copy audio into that folder on first use.
4. Read/write `transcript.txt` only from the managed folder.
5. Save summaries/actions/insights into the same folder.
6. Write aggregate insights under `open-recorder/insights/`.

## Settings

Add a storage location setting with a folder picker. Default is `app.path().local_data_dir()` plus `/open-recorder`. The app always appends `open-recorder` to keep structure consistent. Provide a reset-to-default action.

## Migration behavior

- On read: if managed transcript is missing but a sidecar transcript exists, copy it into the managed folder and use it.
- On write: always write to managed `transcript.txt`.
- No automatic bulk migration is required.

## Error handling

- If the managed root cannot be created, surface a clear error and block transcription/analysis.
- If a copy fails (permissions, disk full), abort the write and keep the original state.

## Future considerations

- Add UI for storage usage and cleanup.
- Allow re-linking if source audio is deleted but managed copy exists.
