# ADR 0004 — Squircle rounding via `corner-shape`

- Status: Accepted
- Date: 2026-09-22

## Context

The design calls for squircle (superellipse) corners rather than plain
circular arcs. CSS `corner-shape: squircle` ships in Chromium 139+, but not in
all current browsers.

## Decision

Apply squircles as a **progressive enhancement** on top of the shadcn radius
scale:

- `app/globals.css` adds, inside `@layer base`:
  `@supports (corner-shape: squircle) { *, ::before, ::after { corner-shape: squircle; } }`
- Radius still comes from `rounded-*` utilities / shadcn `--radius`. Elements
  with zero radius are unaffected.
- `components/squircle.tsx` exposes a `<Squircle>` wrapper that sets
  `rounded-3xl [corner-shape:squircle]` for surfaces that want the shape named
  explicitly (portraits, tiles).

## Consequences

- Browsers without `corner-shape` fall back to ordinary rounded corners — the
  layout never depends on the feature.
- Never hard-code pixel radii; keep everything on the `--radius` scale so the
  shape stays consistent when the base radius changes.
- If exact squircles become required in all browsers, add an SVG-mask fallback
  behind the same `<Squircle>` component rather than changing call sites.
