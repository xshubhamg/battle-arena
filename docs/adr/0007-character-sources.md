# ADR 0007 — Live character sources and the `CharacterSource` seam

- Status: Accepted
- Date: 2026-09-22

## Context

Characters come from three different media with three different APIs. We want
live data, no API keys, and the ability to add or replace a source without
touching the judge or the UI.

## Decision

Define one **`CharacterSource`** interface in `lib/sources/types.ts` and
implement it once per medium. Every source returns the same normalized
`Character` shape and is wrapped in a cache.

| Source | Medium | Provides |
| --- | --- | --- |
| **AniList** GraphQL (`graphql.anilist.co`) | anime | art, description, favourites |
| **Akabab SuperHero API** (`akabab.github.io`) | comics | art, `powerstats` (563 characters) |
| **TVMaze** (`api.tvmaze.com`) + **Wikipedia REST** | shows | show/cast list, then character art + extract |

- Jikan is **not** used: MyAnimeList was returning 504 during development.
- TMDB is **not** used: it needs a key and was unreachable from the build
  machine. Wikipedia covers TV characters with no key.
- Sources only supply text/art; Jev cannot see images. Descriptions are trimmed
  to fit the state budget.
- Results cache in SQLite with a TTL; fetch failures degrade gracefully.

## Consequences

- Adding a medium = one new adapter + a registry entry; nothing else changes.
- We depend on third-party availability and rate limits. Cache aggressively,
  back off on 429/5xx, and never block the arena on a single source being down.
- Character art is hotlinked from public APIs for a non-commercial demo; keep
  attribution visible (footer) and do not rehost.
