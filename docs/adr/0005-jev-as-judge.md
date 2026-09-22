# ADR 0005 — Jev is the judge (typed decisions, no narration)

- Status: Accepted
- Date: 2026-09-22

## Context

The arena needs a judge that "declares the winner and the edge". **Jev**
(TypeSafe AI's System One model, `jev-latest`) evaluates a *state* against typed
*questions* and returns calibrated values. It is explicitly **not** a text
generator: it answers Choice, Score, and Noul questions with probabilities and
confidence, and nothing else.

## Decision

Use Jev as the sole judge and accept that the verdict is **data, not prose**.

- One request per Battle. `state` is a JSON object holding both Fighters.
- Questions asked together, in parallel, in a single `client.systemOne` call:
  - `winner` — **Choice** over `{ fighter_a, fighter_b, draw }`.
  - `dim_power/dim_speed/dim_durability/dim_skill/dim_abilities/dim_intellect`
    — six comparative **Scores**, symmetric around "even".
  - `coin_flip` — **Noul** for "too close to call".
- Question text and criteria live in `lib/judge/config.ts`, not in components.
- `JUDGE_MODE=mock` substitutes a deterministic local judge for tests/offline.

There is **no LLM narration layer**. The UI renders winner, probabilities,
confidence, dimensions, and edge from the typed response.

## Consequences

- The verdict can never contain a generated sentence; any descriptive copy in
  the UI is static and authored by us.
- Jev is trained on real-world text judgments, so "who wins a fictional fight"
  is out-of-distribution. That is the intended use of the model here; surface
  `confidence` and `coin_flip` honestly instead of hiding uncertainty.
- All Jev calls are server-only. `TYPESAFE_API_KEY` never reaches the client.
- Ask many questions per request; never one call per question.
