# Stack Research

**Domain:** Desktop audio recorder transcription
**Researched:** January 23, 2026
**Confidence:** HIGH

## Recommended Stack

### Core Technologies

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| async-openai | 0.32.3 | Official-style Rust client for OpenAI APIs, including Whisper transcription | Most mature Rust client with full Whisper support, async/await, configurable, handles multipart file upload automatically |
| tokio | 1.49.0 | Async runtime for Rust backend commands | Required by async-openai and Tauri async commands; standard Rust async runtime |
| reqwest | 0.13.1 | HTTP client for making API calls (used by async-openai) | Robust, TLS support, streaming; async-openai depends on it |
| tauri (existing) | 2.9.5 | Desktop app framework for Rust backend + Next.js frontend | Already in use; provides secure IPC for calling transcription commands from UI |

### Supporting Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| serde_json | 1.0 | JSON serialization/deserialization for API responses | Already dependency; used for parsing Whisper API results |
| thiserror | 2.0 | Ergonomic error definitions for Rust commands | When defining custom error types for transcription failures |
| tracing | 0.1 | Structured logging for debugging transcription flow | Optional but recommended for production diagnostics |
| tauri-plugin-store (existing) | 2.4.2 | Persistent key‑value storage for API key and settings | If moving away from env‑var to UI‑configurable API key |

### Development Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| cargo-edit | Add/remove dependencies via `cargo add` | Convenient for managing Rust dependencies |
| tauri-cli (existing) | Build, dev, bundle Tauri app | Already installed via `@tauri-apps/cli` |

## Installation

```bash
# Add Rust dependencies
cargo add async-openai@0.32.3
cargo add tokio@1.49 --features full
cargo add thiserror@2.0
cargo add tracing@0.1

# Ensure existing dependencies are up to date
cargo update
```

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| async-openai | manual reqwest calls | If you need extreme control over HTTP flow (rare) |
| OpenAI API via frontend fetch | Rust backend call | Never—API key must stay in backend for security |
| Local Whisper.cpp | OpenAI Whisper API | When offline transcription is required; adds ~1‑2 GB model size and CPU/GPU complexity |
| Other OpenAI Rust crates (openai‑rs, openai‑api) | async-openai | async-openai is more actively maintained and covers Whisper specifically |

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| Storing API key in frontend code or localStorage | Exposes secret to users; violates OpenAI terms | Keep key in Rust backend via env var or secure store |
| Synchronous HTTP calls in Rust backend | Blocks Tauri event loop, poor UX | Use async commands with tokio runtime |
| Rolling your own multipart file upload | Error‑prone, misses API nuances | Leverage async‑openai’s built‑in `audio::transcribe()` |
| Plain `println!` for logging | Hard to filter, no structured context | Use `tracing` macros (`info!`, `error!`) |

## Stack Patterns by Variant

**If you need offline transcription later:**
- Use `whisper.cpp` or `whisper-rs` bindings
- Bundle ~1.5 GB model file with app (size trade‑off)
- Expect slower transcription on CPU, faster with GPU

**If you want to support other transcription providers (Deepgram, AssemblyAI):**
- Create a generic `Transcriber` trait in Rust
- Implement provider‑specific clients behind the trait
- Keep the same frontend interface

## Version Compatibility

| Package A | Compatible With | Notes |
|-----------|-----------------|-------|
| async-openai 0.32.3 | reqwest ^0.12 | Works with reqwest 0.13.1 (tested) |
| tokio 1.49 | tauri 2.9.5 | Tauri already uses tokio internally; no conflict |
| tauri-plugin-store 2.4.2 | tauri 2.9.5 | Already in Cargo.toml |

## Sources

- docs.rs/async-openai/latest — Audio module documentation, Whisper support confirmed (HIGH)
- crates.io/api/v1/crates/async-openai — Version 0.32.3 latest (HIGH)
- crates.io/api/v1/crates/tokio — Version 1.49.0 latest (HIGH)
- crates.io/api/v1/crates/reqwest — Version 0.13.1 latest (HIGH)
- Tauri official docs — Async commands pattern (HIGH)

---
*Stack research for: Open Recorder Tauri transcription feature*
*Researched: January 23, 2026*
