# ADR 0001 — Next.js on Bun with bun:sqlite

- Status: Accepted
- Date: 2026-09-22

## Context

The app needs a React framework, a fast local database for the roster cache and
battle history, and a single package manager. The author runs Bun 1.4.2 locally.

## Decision

Use **Next.js (App Router) on the Bun runtime** and **`bun:sqlite`** for storage
locally, reached only through a `Store` interface in `lib/db`.

- Scripts run Next under Bun: `bun --bun next dev`, `bun --bun next start`.
- `bun:sqlite` is verified to work inside route handlers under `bun --bun next
  dev` (see the Phase 1 spike).
- `lib/db/store.ts` is the seam. Two backends implement it:
  - `sqlite.ts` — Drizzle + `bun:sqlite`, loaded via `createRequire` with a
    runtime `typeof Bun` guard so no bundler pulls `bun:sqlite` into a Node
    build.
  - `memory.ts` — a process-local `Map` store used when `bun:sqlite` is absent.

## Consequences

- **Local dev/self-host is Bun-only** and gets durable SQLite history.
- **Vercel's Node runtime has no `bun:sqlite`**, so it transparently uses the
  memory store: the app is fully functional (roster + judging), but history and
  cached verdicts last only for the lifetime of a serverless instance. That is
  the deliberate trade-off for a zero-config public deploy.
- For durable history on Vercel, implement `Store` with a hosted engine
  (libSQL/Turso or Postgres) and select it in `lib/db/repo.ts`; nothing else
  changes.
- `bun run typecheck` runs `next typegen` first because this Next version
  generates global route types (`LayoutProps<"/">`, `PageProps<...>`).
