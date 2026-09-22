"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Search, Swords } from "lucide-react";

import { CharacterCard } from "@/components/arena/character-card";
import { Button } from "@/components/ui/button";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import type { Character, Source } from "@/lib/sources/types";

const SOURCE_TABS: Array<{ value: Source; label: string }> = [
  { value: "anime", label: "Anime" },
  { value: "comics", label: "Comics" },
  { value: "shows", label: "Shows" },
];

const PAGE_SIZE = 12;

type Result = { key: string; characters: Character[] };
type Failure = { key: string; message: string };

export function Roster() {
  const router = useRouter();
  const [source, setSource] = useState<Source>("anime");
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const [result, setResult] = useState<Result | null>(null);
  const [failure, setFailure] = useState<Failure | null>(null);
  const [selected, setSelected] = useState<Character[]>([]);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(query.trim()), 300);
    return () => clearTimeout(timer);
  }, [query]);

  // The request that the current (source, query) pair *wants*. Loading and
  // error are derived from whether a result/failure exists for this key, so the
  // effect never has to set state synchronously.
  const requestKey = `${source}|${debounced}`;
  const characters = result?.key === requestKey ? result.characters : [];
  const error = failure?.key === requestKey ? failure.message : null;
  const loading = result?.key !== requestKey && error === null;

  useEffect(() => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    const key = `${source}|${debounced}`;

    const params = new URLSearchParams({ source, limit: String(PAGE_SIZE) });
    if (debounced) params.set("q", debounced);

    fetch(`/api/characters?${params.toString()}`, { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error(`Request failed: ${response.status}`);
        return (await response.json()) as { characters: Character[] };
      })
      .then((data) => {
        setFailure(null);
        setResult({ key, characters: data.characters });
      })
      .catch((cause: unknown) => {
        if (cause instanceof DOMException && cause.name === "AbortError") return;
        setFailure({ key, message: "Could not load fighters from this source." });
      });

    return () => controller.abort();
  }, [source, debounced]);

  const selectedIds = useMemo(
    () => new Set(selected.map((character) => character.id)),
    [selected],
  );

  function toggle(character: Character) {
    setSelected((prev) => {
      if (prev.some((entry) => entry.id === character.id)) {
        return prev.filter((entry) => entry.id !== character.id);
      }
      if (prev.length >= 2) return prev;
      return [...prev, character];
    });
  }

  const [fighterA, fighterB] = selected;
  const canFight = Boolean(fighterA && fighterB);

  function startBattle() {
    if (!fighterA || !fighterB) return;
    router.push(
      `/battle/${encodeURIComponent(fighterA.id)}/${encodeURIComponent(fighterB.id)}`,
    );
  }

  return (
    <section id="roster" className="mx-auto w-full max-w-6xl px-6 py-16">
      <div className="mb-6 flex flex-col gap-2">
        <h2 className="text-2xl font-semibold tracking-tight">
          Choose two fighters
        </h2>
        <p className="max-w-2xl text-sm text-muted-foreground">
          Mix any sources — an anime fighter can face a comic or a TV character.
          Selection order sets side A and side B.
        </p>
      </div>

      {/*
        suppressHydrationWarning: password-manager extensions (e.g. Proton Pass)
        inject attributes like `data-protonpass-form` into form containers before
        React hydrates, which otherwise trips a hydration mismatch. It does not
        affect users without such an extension.
      */}
      <div
        suppressHydrationWarning
        className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
      >
        <Tabs
          value={source}
          onValueChange={(value) => setSource(value as Source)}
        >
          <TabsList>
            {SOURCE_TABS.map((tab) => (
              <TabsTrigger key={tab.value} value={tab.value}>
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        <InputGroup className="sm:max-w-xs">
          <InputGroupAddon align="inline-start">
            <Search />
          </InputGroupAddon>
          <InputGroupInput
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search characters…"
            aria-label="Search characters"
          />
        </InputGroup>
      </div>

      {error ? (
        <div className="rounded-2xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground [corner-shape:squircle]">
          {error} Try another source or search term.
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {loading
            ? Array.from({ length: PAGE_SIZE }).map((_, index) => (
                <Skeleton
                  key={index}
                  className="aspect-[3/4.55] w-full rounded-2xl"
                />
              ))
            : characters.map((character) => (
                <CharacterCard
                  key={character.id}
                  character={character}
                  selected={selectedIds.has(character.id)}
                  side={
                    fighterA?.id === character.id
                      ? "a"
                      : fighterB?.id === character.id
                        ? "b"
                        : undefined
                  }
                  disabled={
                    selected.length >= 2 && !selectedIds.has(character.id)
                  }
                  onToggle={toggle}
                />
              ))}
        </div>
      )}

      {!loading && !error && characters.length === 0 && (
        <div className="rounded-2xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground [corner-shape:squircle]">
          No fighters matched “{debounced}”.
        </div>
      )}

      {selected.length > 0 && (
        <div className="pointer-events-none fixed inset-x-0 bottom-4 z-40 flex justify-center px-4">
          <div className="pointer-events-auto flex w-full max-w-3xl items-center gap-3 rounded-2xl border border-border bg-popover/95 p-2.5 shadow-lg backdrop-blur [corner-shape:squircle]">
            <MatchSlot label="A" character={fighterA} />
            <span className="text-[11px] font-semibold tracking-widest text-muted-foreground">
              VS
            </span>
            <MatchSlot label="B" character={fighterB} />
            <div className="ml-auto flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={() => setSelected([])}>
                Clear
              </Button>
              <Button size="sm" disabled={!canFight} onClick={startBattle}>
                <Swords data-icon="inline-start" />
                Fight
              </Button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

function MatchSlot({
  label,
  character,
}: {
  label: string;
  character?: Character;
}) {
  return (
    <div
      className={cn(
        "flex min-w-0 items-center gap-2 rounded-xl border px-2 py-1.5 [corner-shape:squircle]",
        character ? "border-border" : "border-dashed border-border/70",
      )}
    >
      <span className="grid size-9 shrink-0 place-items-center overflow-hidden rounded-lg bg-muted [corner-shape:squircle]">
        {character?.imageUrl ? (
          <Image
            src={character.imageUrl}
            alt={character.name}
            width={36}
            height={36}
            className="size-9 object-cover grayscale"
          />
        ) : (
          <span className="text-[11px] font-semibold text-muted-foreground">
            {label}
          </span>
        )}
      </span>
      <span className="min-w-0">
        <span className="block truncate text-xs font-medium">
          {character?.name ?? `Pick fighter ${label}`}
        </span>
        <span className="block truncate text-[11px] text-muted-foreground">
          {character?.universe ?? "—"}
        </span>
      </span>
    </div>
  );
}
