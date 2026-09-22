import Image from "next/image";
import type { ReactNode } from "react";

import { Badge } from "@/components/ui/badge";
import { Squircle } from "@/components/squircle";
import { cn } from "@/lib/utils";
import type { Character } from "@/lib/sources/types";

/**
 * Compact horizontal fighter card for the left rail. Small portrait, name,
 * universe and badges — the full stat blocks live in the verdict's
 * head-to-head comparison on the right.
 */
function FighterCompact({
  character,
  side,
}: {
  character: Character;
  side: "a" | "b";
}) {
  return (
    <div className="flex gap-3 rounded-3xl border border-border bg-card p-3 [corner-shape:squircle]">
      <Squircle className="relative h-20 w-20 shrink-0 overflow-hidden border border-border bg-muted">
        {character.imageUrl ? (
          <Image
            src={character.imageUrl}
            alt={character.name}
            fill
            sizes="80px"
            className="object-cover grayscale"
            priority
          />
        ) : (
          <span className="grid h-full w-full place-items-center text-lg font-medium text-muted-foreground">
            {character.name.slice(0, 2).toUpperCase()}
          </span>
        )}
      </Squircle>

      <div className="flex min-w-0 flex-1 flex-col gap-1.5 py-0.5">
        <div className="flex flex-wrap items-center gap-1.5">
          <Badge variant="outline" className="font-mono text-[10px]">
            {side.toUpperCase()}
          </Badge>
          <Badge variant="secondary" className="text-[10px]">
            {character.source}
          </Badge>
        </div>
        <h2 className="truncate text-base font-semibold tracking-tight">
          {character.name}
        </h2>
        <p className="truncate text-xs text-muted-foreground">
          {character.universe}
        </p>
      </div>
    </div>
  );
}

function VsDivider() {
  return (
    <div className="flex items-center gap-3 px-1" aria-hidden="true">
      <span className="h-px flex-1 bg-border" />
      <span className="grid size-9 shrink-0 place-items-center rounded-full border border-border bg-muted font-mono text-[11px] font-semibold tracking-widest text-muted-foreground [corner-shape:squircle]">
        VS
      </span>
      <span className="h-px flex-1 bg-border" />
    </div>
  );
}

export function VsStage({
  a,
  b,
  children,
}: {
  a: Character;
  b: Character;
  children?: ReactNode;
}) {
  return (
    <div className="mx-auto grid w-full max-w-6xl items-start gap-6 px-6 py-12 lg:grid-cols-[320px_minmax(0,1fr)]">
      {/* Left rail: fighters stacked, compact, with VS between. */}
      <div className="flex flex-col gap-3 lg:sticky lg:top-6">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Fighters
        </p>
        <FighterCompact character={a} side="a" />
        <VsDivider />
        <FighterCompact character={b} side="b" />
        <p
          className={cn(
            "line-clamp-6 text-xs leading-relaxed text-muted-foreground",
          )}
        >
          Jev judges from descriptions and stats only — it never sees the
          portraits.
        </p>
      </div>

      {/* Right column: verdict + all metrics. */}
      <div className="flex min-w-0 flex-col gap-3">{children}</div>
    </div>
  );
}
