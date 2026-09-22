<div align="center">

# Battle Arena

**Characters from anime, comics, and shows go in. Jev decides who wins and by how much.**

A monochrome 1v1 arena where [Jev](https://docs.typesafe.ai) — TypeSafe AI's
System One model — returns a winner and a signed **edge**. No prose, no
vibes-only verdicts: just typed, calibrated decisions your code can inspect.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fxshubhamg%2Fbattle-arena&env=TYPESAFE_API_KEY&envDescription=TypeSafe%20AI%20API%20key%20for%20Jev&envLink=https%3A%2F%2Fconsole.typesafe.ai%2Fkeys)

![Next.js](https://img.shields.io/badge/Next.js-16-000?logo=nextdotjs&logoColor=white)
![Bun](https://img.shields.io/badge/Bun-1.4-000?logo=bun&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5-000?logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-v4-000?logo=tailwindcss&logoColor=white)
![Powered by Jev](https://img.shields.io/badge/judge-Jev%20%C2%B7%20System%20One-000)

</div>

---

## What it does

1. **Pick two fighters** from a live roster — anime (AniList), comics (SuperHero
   API), and TV shows (TVMaze + Wikipedia). Mix sources freely.
2. **Jev judges** both fighters in a single request: a winner Choice, six
   comparative Scores across power, speed, durability, skill, abilities, and
   intellect, and a coin-flip Noul.
3. **Your code owns the math.** Six normalized per-dimension edges are weighted
   into one signed **edge** in `[-1, 1]`, with confidence, a coin-flip flag, and
   a split-verdict flag when the winner Choice and the composite disagree.

Jev is a *decision* model, not an LLM. It never writes text — the verdict is a
typed payload the UI renders as bars, meters, and badges. See
[docs/adr/0005](docs/adr/0005-jev-as-judge.md).

## Features

- **Live, keyless roster** across three media with a cache-through `Store`.
- **Composite scoring** with every weight and threshold in one reviewable file
  (`lib/judge/config.ts`).
- **Monochrome, Vercel-flavored UI** — grayscale semantic tokens only, Geist,
  [beUI](https://beui.dev) motion, and squircle corners via
  `corner-shape: squircle` (with a graceful rounded fallback).
- **Deterministic mock mode** (`JUDGE_MODE=mock`) so tests and offline dev never
  touch the network.
- **Local battle history** in SQLite; in-memory on serverless (see
  [Deploying](#deploying)).

## Tech stack

| Layer | Choice |
| --- | --- |
| Framework | Next.js (App Router) + React 19, TypeScript |
| Runtime / packages | **Bun** (`bun --bun next dev`) |
| Styling | Tailwind v4, shadcn/ui (Base UI), beUI motion |
| Judge | [`@typesafe-ai/sdk`](https://docs.typesafe.ai) → `jev-latest` |
| Storage | `bun:sqlite` (Drizzle) locally, in-memory on Node |
| Validation | Zod |

## Getting started

```sh
bun install
cp .env.example .env.local      # add TYPESAFE_API_KEY
bun run dev                     # http://localhost:3000
```

No key handy? Run the arena fully offline with deterministic verdicts:

```sh
JUDGE_MODE=mock bun run dev
```

### Commands

```sh
bun run dev        # bun --bun next dev  (Bun runtime — required for bun:sqlite)
bun run build      # bun --bun next build
bun run start      # bun --bun next start
bun run typecheck  # next typegen && tsc --noEmit
bun run lint       # eslint
bun test           # bun test
```

### Environment

| Variable | Required | Notes |
| --- | --- | --- |
| `TYPESAFE_API_KEY` | yes (live) | Server-only. Never `NEXT_PUBLIC_`. |
| `TYPESAFE_MODEL` | no | Defaults to `jev-latest`. |
| `JUDGE_MODE` | no | `live` (default) or `mock`. |
| `DATABASE_PATH` | no | SQLite file for Bun. Ignored on Vercel. |

## Deploying

Vercel's Node runtime has no `bun:sqlite`, so the app transparently switches to
an in-memory store: every feature works, but **battle history and cached
verdicts last only for the lifetime of a serverless instance**. That is the
deliberate zero-config trade-off for a public demo. For durable history, implement
the `Store` interface in `lib/db` with a hosted engine (Turso/libSQL or
Postgres) and select it in `lib/db/repo.ts` — nothing else changes.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fxshubhamg%2Fbattle-arena&env=TYPESAFE_API_KEY&envDescription=TypeSafe%20AI%20API%20key%20for%20Jev&envLink=https%3A%2F%2Fconsole.typesafe.ai%2Fkeys)

## Architecture

```
app/                     App Router pages + route handlers (api/*)
  api/characters/        Roster: search + list by source
  api/battle/            Judge a 1v1, persist, return the verdict
  battle/[a]/[b]/        VS stage (server) + client verdict flow
  history/               Past battles
components/
  ui/                    shadcn/ui primitives (Base UI)
  motion/                beUI animated components
  arena/                 Roster, VS stage, verdict panel
lib/
  sources/               One CharacterSource seam: AniList · SuperHero · TVMaze+Wikipedia
  judge/                 State, questions, composite edge, Jev client, mock
  db/                    Store seam: SQLite (Bun) + in-memory (Node)
docs/adr/                Architecture decision records
```

Start with [`AGENTS.md`](AGENTS.md) to work in the repo and
[`CONTEXT.md`](CONTEXT.md) for the domain vocabulary. Decisions live in
[`docs/adr/`](docs/adr/).

## Character data

Art and text are hotlinked from [AniList](https://anilist.co),
[SuperHero API](https://github.com/akabab/superhero-api),
[TVMaze](https://www.tvmaze.com/api), and [Wikipedia](https://www.wikipedia.org),
for a non-commercial demo with attribution.

## License

No license file yet — add one before reuse.
