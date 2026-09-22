import Image from "next/image";
import type { ReactNode } from "react";

import { Badge } from "@/components/ui/badge";
import { Squircle } from "@/components/squircle";
import { cn } from "@/lib/utils";
import type { Character, Powerstats } from "@/lib/sources/types";

const STAT_LABELS: Array<{ key: keyof Powerstats; label: string }> = [
  { key: "intelligence", label: "Intelligence" },
  { key: "strength", label: "Strength" },
  { key: "speed", label: "Speed" },
  { key: "durability", label: "Durability" },
  { key: "power", label: "Power" },
  { key: "combat", label: "Combat" },
];

function StatBars({ stats }: { stats?: Powerstats }) {
  if (!stats) {
    return (
      <p className="text-xs text-muted-foreground">
        No stat block. Jev judges this fighter from the description.
      </p>
    );
  }

  return (
    <dl className="flex flex-col gap-2">
      {STAT_LABELS.map(({ key, label }) => {
        const value = stats[key];
        return (
          <div key={key} className="flex items-center gap-3">
            <dt className="w-24 shrink-0 text-[11px] uppercase tracking-wide text-muted-foreground">
              {label}
            </dt>
            <dd className="flex flex-1 items-center gap-2">
              <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                <span
                  className="block h-full rounded-full bg-foreground"
                  style={{ width: `${Math.min(100, Math.max(0, value ?? 0))}%` }}
                />
              </span>
              <span className="w-7 shrink-0 text-right font-mono text-[11px] tabular-nums">
                {value ?? "–"}
              </span>
            </dd>
          </div>
        );
      })}
    </dl>
  );
}

function FighterPanel({
  character,
  side,
}: {
  character: Character;
  side: "a" | "b";
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-5 rounded-3xl border border-border bg-card p-5 [corner-shape:squircle]",
        side === "b" && "sm:text-right",
      )}
    >
      <Squircle className="relative aspect-[4/5] w-full overflow-hidden border border-border bg-muted">
        {character.imageUrl ? (
          <Image
            src={character.imageUrl}
            alt={character.name}
            fill
            sizes="(max-width: 640px) 90vw, 420px"
            className="object-cover grayscale"
            priority
          />
        ) : (
          <span className="grid h-full w-full place-items-center text-3xl font-medium text-muted-foreground">
            {character.name.slice(0, 2).toUpperCase()}
          </span>
        )}
      </Squircle>

      <div
        className={cn(
          "flex flex-wrap items-center gap-2",
          side === "b" && "sm:justify-end",
        )}
      >
        <Badge variant="outline" className="font-mono">
          {side.toUpperCase()}
        </Badge>
        <Badge variant="secondary">{character.source}</Badge>
      </div>

      <div className={cn("flex flex-col gap-1", side === "b" && "sm:items-end")}>
        <h2 className="text-2xl font-semibold tracking-tight">
          {character.name}
        </h2>
        <p className="text-sm text-muted-foreground">{character.universe}</p>
      </div>

      <StatBars stats={character.stats} />

      <p className="line-clamp-6 text-xs leading-relaxed text-muted-foreground">
        {character.description || "No description available."}
      </p>
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
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-6 py-12">
      <div className="flex items-center justify-center gap-4 text-sm font-semibold tracking-widest text-muted-foreground">
        <span className="h-px w-12 bg-border" />
        VS
        <span className="h-px w-12 bg-border" />
      </div>

      <div className="grid items-start gap-6 sm:grid-cols-[1fr_auto_1fr]">
        <FighterPanel character={a} side="a" />
        <div className="hidden self-stretch sm:flex sm:items-center">
          <span className="h-full w-px bg-border" />
        </div>
        <FighterPanel character={b} side="b" />
      </div>

      {children}
    </div>
  );
}
