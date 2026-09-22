# ADR 0003 — Monochrome design tokens

- Status: Accepted
- Date: 2026-09-22

## Context

The requested aesthetic is "monochrome, Vercel-like". Color would compete with
the portraits and the verdict data.

## Decision

Use **only grayscale semantic tokens** from the shadcn neutral theme:

- Surfaces: `bg-background`, `bg-card`, `bg-muted`, `bg-popover`.
- Text: `text-foreground`, `text-muted-foreground`.
- Lines: `border-border`, `ring-ring`.
- The `--chart-*` ramp is already grayscale (`oklch(L 0 0)`), so charts stay
  monochrome without extra work.

Dark is the default surface (`<html class="dark">`). No raw Tailwind colors
(`text-emerald-500`, `bg-blue-600`) and no accent color anywhere.

## Consequences

- Emphasis is carried by weight, contrast, borders, and motion — not hue.
- Meaning that would normally use color (winner vs loser, edge direction) must
  use position, fill, inversion, and labels instead. The Edge meter uses a
  diverging grayscale bar anchored at zero.
- If a semantic accent is ever truly needed, add a token to `app/globals.css`
  under `:root`/`.dark` and expose it via `@theme inline`; never inline raw
  colors.
