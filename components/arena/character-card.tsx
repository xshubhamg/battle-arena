"use client";

import Image from "next/image";

import { cn } from "@/lib/utils";
import type { Character } from "@/lib/sources/types";

type CharacterCardProps = {
  character: Character;
  selected?: boolean;
  side?: "a" | "b";
  disabled?: boolean;
  onToggle: (character: Character) => void;
};

function initials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function CharacterCard({
  character,
  selected = false,
  side,
  disabled = false,
  onToggle,
}: CharacterCardProps) {
  return (
    <button
      type="button"
      onClick={() => onToggle(character)}
      disabled={disabled}
      aria-pressed={selected}
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-2xl border bg-card text-left transition-all [corner-shape:squircle]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        selected
          ? "border-foreground ring-1 ring-foreground"
          : "border-border hover:border-foreground/40",
        disabled && !selected && "cursor-not-allowed opacity-40",
      )}
    >
      <div className="relative aspect-[3/4] w-full overflow-hidden bg-muted">
        {character.imageUrl ? (
          <Image
            src={character.imageUrl}
            alt={character.name}
            fill
            sizes="(max-width: 768px) 33vw, 200px"
            className="object-cover grayscale transition-transform duration-500 will-change-transform group-hover:scale-[1.03]"
          />
        ) : (
          <span className="grid h-full w-full place-items-center text-2xl font-medium text-muted-foreground">
            {initials(character.name)}
          </span>
        )}

        {selected && side && (
          <span className="absolute left-2 top-2 grid size-6 place-items-center rounded-md bg-foreground text-[11px] font-semibold text-background [corner-shape:squircle]">
            {side.toUpperCase()}
          </span>
        )}
      </div>

      <div className="flex min-w-0 flex-col gap-0.5 p-3">
        <span className="truncate text-sm font-medium tracking-tight">
          {character.name}
        </span>
        <span className="truncate text-xs text-muted-foreground">
          {character.universe}
        </span>
      </div>
    </button>
  );
}
