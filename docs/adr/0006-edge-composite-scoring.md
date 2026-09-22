# ADR 0006 — Edge from composite scoring

- Status: Accepted
- Date: 2026-09-22

## Context

Jev does not reason over the whole matchup in one shot — it answers focused
questions. "Who gets the edge" is a multi-factor judgment, so it must be
decomposed and recombined in code (TypeSafe's *composite scoring* pattern).

## Decision

The **edge** is computed in code, never asked of the model directly.

1. Six comparative **Score** questions (power, speed, durability, skill,
   abilities, intellect) use a symmetric rubric whose middle level is "even".
2. Each score is normalized to a signed value in `[-1, 1]`:
   `signed = 1 - 2 * (score / (levels - 1))`, positive toward `fighter_a`.
3. The overall edge is the weighted sum: `edge = Σ weight_d · signed_d`.
4. A magnitude threshold maps the edge to a label
   (`coin-flip → slight → clear → dominant`).
5. The headline **winner** comes from the separate `winner` Choice. If its sign
   disagrees with the edge sign, the verdict is flagged **split** (ADR-0005
   consequence) rather than reconciled silently.

Weights, levels, and thresholds are the *only* tunables and live together in
`lib/judge/config.ts`. The arithmetic lives in `lib/judge/composite.ts`, a pure,
unit-tested function.

## Consequences

- Changing priorities means editing weights, not rewriting prompts.
- The verdict is inspectable per dimension and reproducible in tests without
  calling Jev (feed fixture answers into `composite.ts`).
- `confidence` from the `winner` Choice is shown alongside the edge; the edge
  itself is deterministic given the answers.
