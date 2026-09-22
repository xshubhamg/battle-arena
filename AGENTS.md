<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Battle Arena

A monochrome 1v1 arena for characters from anime, comics, and shows. Two
fighters go in; **Jev** (TypeSafe AI's System One model) returns a winner and a
signed **edge**. Read this file before changing code, and `CONTEXT.md` for the
domain vocabulary. Architecture decisions live in `docs/adr/`.

## Commands

```sh
bun run dev        # bun --bun next dev  (Bun runtime — required for bun:sqlite)
bun run build      # bun --bun next build
bun run typecheck  # next typegen && tsc --noEmit
bun run lint       # eslint
bun test           # bun test
```

Always `bun`, never npm/pnpm/yarn. `packageManager` is pinned to `bun@1.4.2`.

## Non-negotiables

1. **Jev returns typed decisions only.** It is a *System One* model: Choice,
   Score, and Noul primitives with probabilities and confidence. It does **not**
   generate prose — never ask it to write text, and never expect a sentence
   back. See `docs/adr/0005-jev-as-judge.md`.
2. **Code owns the judgment math.** Every weight, threshold, and normalization
   lives in one reviewable file (`lib/judge/config.ts`). Do not bury constants
   in components or spread them across files.
3. **The API key never leaves the server.** All Jev calls happen in route
   handlers / server code. `TYPESAFE_API_KEY` has no `NEXT_PUBLIC_` prefix.
4. **Monochrome.** Only grayscale semantic tokens (`bg-background`,
   `text-muted-foreground`, `border-border`). No raw colors, no accent, no
   `text-emerald-500`. See `docs/adr/0003-monochrome-design-tokens.md`.
5. **Squircle rounding.** Use the `Squircle` component or `[corner-shape:squircle]`
   on rounded surfaces, always on the shadcn `--radius` scale. See
   `docs/adr/0004-squircle-rounding.md`.
6. **`bun:sqlite` runs only under the Bun runtime.** All storage sits behind the
   `Store` interface in `lib/db`. Local `dev`/`start` use `bun --bun` and get
   SQLite; Vercel's Node runtime transparently falls back to an in-memory store
   (no durable history). Never import `bun:sqlite` or `drizzle-orm/bun-sqlite`
   statically — `sqlite.ts` loads them with `createRequire` behind a `typeof Bun`
   guard. See `docs/adr/0001-stack-nextjs-bun-sqlite.md`.

## Architecture map

| Path | Responsibility |
| --- | --- |
| `app/` | App Router pages and route handlers (`app/api/*`). |
| `components/ui/` | shadcn/ui primitives (Base UI base). Generated — avoid editing unless needed. |
| `components/motion/` | beUI animated components, installed via the shadcn registry. |
| `components/` | App components (`site-header.tsx`, `squircle.tsx`, arena UI). |
| `lib/sources/` | Live character adapters + cache. One `CharacterSource` interface. |
| `lib/judge/` | The deep module: build Jev state, ask questions, compose the verdict. |
| `lib/db/` | `Store` seam: SQLite (Bun) + in-memory (Node/Vercel) backends. |
| `docs/adr/` | Decision records. Read the relevant one before changing a subsystem. |

## Character sources

- **Anime** — AniList GraphQL. Images + descriptions + favourites.
- **Comics** — Akabab SuperHero API (static JSON, 563 characters, `powerstats`).
- **Shows** — TVMaze (show + cast) then Wikipedia REST (character art + extract).
- Jikan is **not** used (MyAnimeList was returning 504 when this was built).

Sources only supply *text* for the Jev state; Jev cannot see images. Keep each
fighter's description trimmed to fit Jev's 32k `state` budget.

## Working with Jev (TypeSafe)

- SDK: `@typesafe-ai/sdk` (`TypeSafeClient.systemOne`). Env: `TYPESAFE_API_KEY`,
  model alias `jev-latest`.
- Ask **many questions in one request** — they run in parallel and extra
  questions are nearly free. Do not make one call per question.
- Use `choice(instructions, { label: description })`, `score(instructions,
  criteriaArray)`, `noul(instructions)`.
- For the real question-writing and API reference, install and consult the
  TypeSafe agent skill: `npx skills add typesafe-ai/skills --skill typesafe-ai`.
  Docs: https://docs.typesafe.ai.
- `JUDGE_MODE=mock` gives deterministic verdicts for tests and offline work.

## Before writing Next.js code

Read the relevant page under `node_modules/next/dist/docs/`. This Next version
uses generated global types (`LayoutProps<"/">`, `PageProps<...>`) — run
`bun run typecheck` (which runs `next typegen` first) rather than plain `tsc`.
