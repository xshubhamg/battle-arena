"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { VerdictPanel } from "@/components/arena/verdict-panel";
import { Loader } from "@/components/motion/loader";
import { Squircle } from "@/components/squircle";
import { Button } from "@/components/ui/button";
import type { Verdict } from "@/lib/judge/verdict";
import type { Character } from "@/lib/sources/types";

type BattleResponse = {
  battle: { id: string; verdict: Verdict; createdAt: number };
  cached: boolean;
};

export function BattleView({
  fighterA,
  fighterB,
}: {
  fighterA: Character;
  fighterB: Character;
}) {
  const [verdict, setVerdict] = useState<Verdict | null>(null);
  const [cached, setCached] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const startedRef = useRef(false);

  const judge = useCallback(
    async (force: boolean) => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch("/api/battle", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ a: fighterA.id, b: fighterB.id, force }),
        });
        const data = (await response.json()) as
          | BattleResponse
          | { error: string };
        if (!response.ok || "error" in data) {
          throw new Error("error" in data ? data.error : "Judging failed");
        }
        setVerdict(data.battle.verdict);
        setCached(data.cached);
      } catch (cause) {
        setError(
          cause instanceof Error ? cause.message : "Jev could not judge",
        );
      } finally {
        setLoading(false);
      }
    },
    [fighterA.id, fighterB.id],
  );

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    void judge(false);
  }, [judge]);

  if (loading) {
    return (
      <Squircle className="flex flex-col items-center gap-4 border border-border bg-card p-12 text-center">
        <Loader variant="dots" />
        <div className="flex flex-col gap-1">
          <p className="text-sm font-medium">Jev is deliberating</p>
          <p className="text-xs text-muted-foreground">
            Weighing six dimensions and asking for a winner.
          </p>
        </div>
      </Squircle>
    );
  }

  if (error || !verdict) {
    return (
      <Squircle className="flex flex-col items-center gap-4 border border-dashed border-border p-12 text-center">
        <p className="text-sm text-muted-foreground">
          {error ?? "No verdict was returned."}
        </p>
        <Button variant="outline" size="sm" onClick={() => void judge(true)}>
          Try again
        </Button>
      </Squircle>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <VerdictPanel
        verdict={verdict}
        names={{ a: fighterA.name, b: fighterB.name }}
        fighters={{ a: fighterA, b: fighterB }}
      />
      <div className="flex items-center justify-between text-[11px] text-muted-foreground">
        <span>{cached ? "Cached verdict" : "Freshly judged"}</span>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => void judge(true)}
        >
          Re-judge
        </Button>
      </div>
    </div>
  );
}
