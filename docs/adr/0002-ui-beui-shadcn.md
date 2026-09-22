# ADR 0002 — UI from shadcn/ui (Base UI) and beUI

- Status: Accepted
- Date: 2026-09-22

## Context

The arena wants a clean, Vercel-like monochrome surface with a few high-quality
motion moments (VS reveal, animated numbers, tilt portraits) without hand-rolling
animation primitives.

## Decision

Compose UI from two copy-in registries, both on Tailwind v4:

- **shadcn/ui**, initialized with the `base-nova` preset on the **Base UI** base
  (`@base-ui/react`). Components land in `components/ui/` as source.
- **beUI** animated components, installed through the shadcn registry
  (`bunx --bun shadcn add @beui/<name>`). They land in `components/motion/`, are
  built on `motion` (Motion for React), and bring their own helpers under `lib/`.

Prefer existing components over custom markup (Button, Badge, Card, Tabs,
Dialog, Command, Table, Skeleton, ScrollArea, Avatar, Tooltip, Separator).

## Consequences

- `components/ui/` and `components/motion/` are generated. Edit only when a
  real need appears, and prefer upstream updates via `shadcn add --diff`.
- Two `cn` helpers coexist by convention: shadcn's UI files import `cn` from the
  `cn` package; beUI and app code import it from `@/lib/utils` (clsx + twMerge).
  Both are compatible; do not "unify" them casually — it churns generated files.
- Base UI uses `render={...}` where Radix used `asChild`. Check the base before
  composing triggers.
