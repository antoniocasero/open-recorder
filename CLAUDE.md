# Claude Guide

This repository is a Tauri + Next.js desktop app. Use this guide as the default context for AI assistance.

## Project summary

Open Recorder is a local-first desktop app to play, manage, and analyze audio recordings. It aims to fill the gap between AR recorders and traditional recorders by providing Plaud-like insights without external services.

## Key directories

- `app/` - Next.js App Router pages
- `src/components/` - React UI components
- `src/lib/` - TypeScript utilities and shared logic
- `src-tauri/` - Rust backend and Tauri configuration
- `plan/` - Design references and planning assets

## Common commands

- `npm run tauri:dev` - Run the desktop app in development
- `npm run tauri:build` - Build the desktop app
- `npm run lint` - Run ESLint
- `npm run build` - Build Next.js

## UI conventions

- Dark UI with slate palette and subtle borders.
- Use Tailwind utility classes and existing component patterns.
- For new insights UI, keep the focus on topics, keywords, trends, and KPIs.

## Notes

- Keep analysis local-first (no cloud dependencies).
- Avoid broad refactors unless requested.
