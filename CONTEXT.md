# Context — domain vocabulary

The shared language of Battle Arena. If a term here conflicts with how the code
uses it, the code is wrong — fix one of them and note it in an ADR.

## Cast

**Source** — where a character comes from. One of `anime`, `comics`, `shows`.
Never a free string.

**Character** — a normalized record fetched from a source. Always the same shape
regardless of origin: `{ id, source, externalId, name, universe, imageUrl,
description, stats?, tags?, externalUrl? }`. `id` is `"<source>:<externalId>"`.

**Fighter** — a Character projected into the Jev state: its description trimmed,
its stats reduced to a normalized `powerstats` block. A Battle has exactly two.

**Roster** — the browsable, cached set of Characters in the database.

## The contest

**Battle** — one pairing of two Fighters, judged once. Persisted with its full
verdict payload.

**Verdict** — the typed result of judging a Battle. Composed entirely from Jev's
answers; contains no generated prose. Shape lives in `lib/judge/verdict.ts`.

**Winner** — the fighter named by the `winner` Choice question. Can be `draw`.

**Edge** — the signed advantage one Fighter holds over the other, in `[-1, 1]`
where positive favours the first Fighter. Computed in code by weighting the
per-dimension comparative scores; see `docs/adr/0006-edge-composite-scoring.md`.

**Dimension** — one axis of comparison: power, speed, durability, skill,
abilities, intellect. Each is one comparative `Score` question.

**Coin flip** — a Noul flag marking a matchup too close to call with confidence.

**Split verdict** — the Winner Choice and the Edge disagree in sign. Surfaced as
a badge, never silently reconciled.

## The judge

**Jev** — TypeSafe AI's flagship **System One model**, `jev-latest`
(`jev-1.13.0`). A *decision* model: it evaluates a state against typed questions
and returns calibrated values. It does not write text. Docs:
https://docs.typesafe.ai.

**System One model** — a class of model built for fast, structured decisions
rather than text generation. Contrast the LLM "System Two" analogy.

**State** — the text/JSON payload a Jev request evaluates. Here: both Fighters,
in one object. Text only; Jev cannot see `imageUrl`.

**Primitives / questions** — the three typed question forms:
- **Choice** — pick one option. Returns `choice`, `probabilities`, `confidence`.
- **Score** — place the state on an ordered rubric. Returns `score`, `legend`,
  `probabilities`, `confidence`.
- **Noul** — probability a statement is true, in `[0, 1]`.

**Confidence** — how peaked a Choice/Score probability distribution is. Separate
from the answer itself; used to decide whether to trust an outcome.

**Composite scoring** — score independent dimensions separately, normalize each,
combine with weights in code. The pattern behind Edge.

**Mock mode** — `JUDGE_MODE=mock` swaps Jev for a deterministic local judge so
the app and tests run offline. The real path is never required for CI.
