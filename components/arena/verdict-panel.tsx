"use client";

import { AnimatedNumber } from "@/components/motion/animated-number";
import { TextReveal } from "@/components/motion/text-reveal";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import type { Verdict } from "@/lib/judge/verdict";

function percent(value: number): string {
  return `${Math.round(value * 100)}%`;
}

/** Diverging bar anchored at the centre; fills toward the favoured side. */
function EdgeBar({
  value,
  className,
}: {
  value: number;
  className?: string;
}) {
  const width = Math.min(1, Math.abs(value)) * 50;
  return (
    <div className={cn("relative h-2 overflow-hidden rounded-full bg-muted", className)}>
      <span className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-border" />
      <span
        className={cn(
          "absolute top-0 h-full rounded-full bg-foreground",
          value >= 0 ? "left-1/2" : "right-1/2",
        )}
        style={{ width: `${width}%` }}
      />
    </div>
  );
}

export function VerdictPanel({
  verdict,
  names,
}: {
  verdict: Verdict;
  names: { a: string; b: string };
}) {
  const winnerLabel =
    verdict.winner.side === "draw"
      ? "Draw"
      : verdict.winner.side === "a"
        ? "Side A"
        : "Side B";

  const probabilityRows = [
    { key: "fighter_a", label: names.a, value: verdict.winner.probabilities.fighter_a ?? 0 },
    { key: "draw", label: "Draw", value: verdict.winner.probabilities.draw ?? 0 },
    { key: "fighter_b", label: names.b, value: verdict.winner.probabilities.fighter_b ?? 0 },
  ];
  const maxProbability = Math.max(0.0001, ...probabilityRows.map((r) => r.value));

  const edgeSide =
    verdict.edge.favors === "a"
      ? names.a
      : verdict.edge.favors === "b"
        ? names.b
        : "No one";

  return (
    <Card className="[corner-shape:squircle]">
      <CardHeader>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className="font-mono">
            Jev verdict
          </Badge>
          {verdict.coinFlip.isCoinFlip && (
            <Badge variant="secondary">Coin flip</Badge>
          )}
          {verdict.split && <Badge variant="secondary">Split verdict</Badge>}
        </div>
        <CardTitle className="sr-only">Verdict</CardTitle>
      </CardHeader>

      <CardContent className="flex flex-col gap-6">
        <div className="flex flex-col gap-1">
          <span className="text-xs uppercase tracking-wide text-muted-foreground">
            {winnerLabel} wins
          </span>
          <TextReveal
            as="h2"
            text={verdict.winner.name}
            className="text-3xl font-semibold tracking-tight"
          />
          <span className="text-sm text-muted-foreground">
            confidence{" "}
            <AnimatedNumber
              value={verdict.winner.confidence}
              format={percent}
              className="font-mono text-foreground"
            />
          </span>
        </div>

        <div className="flex flex-col gap-2">
          {probabilityRows.map((row) => (
            <div key={row.key} className="flex items-center gap-3">
              <span className="w-28 shrink-0 truncate text-xs text-muted-foreground">
                {row.label}
              </span>
              <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                <span
                  className="block h-full rounded-full bg-foreground"
                  style={{ width: `${(row.value / maxProbability) * 100}%` }}
                />
              </span>
              <span className="w-10 shrink-0 text-right font-mono text-xs tabular-nums">
                {percent(row.value)}
              </span>
            </div>
          ))}
        </div>

        <Separator />

        <div className="flex flex-col gap-3">
          <div className="flex items-baseline justify-between gap-4">
            <div>
              <span className="text-xs uppercase tracking-wide text-muted-foreground">
                Edge
              </span>
              <p className="text-sm">
                {verdict.edge.favors === "even"
                  ? "Evenly matched"
                  : `${edgeSide} · ${verdict.edge.label}`}
              </p>
            </div>
            <AnimatedNumber
              value={verdict.edge.magnitude}
              format={(n) => n.toFixed(2)}
              className="text-2xl font-semibold"
            />
          </div>
          <EdgeBar value={verdict.edge.value} />
          <div className="flex justify-between text-[11px] text-muted-foreground">
            <span>{names.a}</span>
            <span>{names.b}</span>
          </div>
        </div>

        <Separator />

        <div className="flex flex-col gap-3">
          <span className="text-xs uppercase tracking-wide text-muted-foreground">
            Dimensions
          </span>
          {verdict.edge.dimensions.map((dimension) => (
            <div key={dimension.key} className="flex flex-col gap-1">
              <div className="flex items-center justify-between text-xs">
                <span>{dimension.label}</span>
                <span className="text-muted-foreground">
                  weight {Math.round(dimension.weight * 100)}% · conf{" "}
                  {dimension.confidence.toFixed(2)}
                </span>
              </div>
              <EdgeBar value={dimension.signed} className="h-1.5" />
              <div className="flex justify-between text-[11px] text-muted-foreground">
                <span>{names.a}</span>
                <span>{names.b}</span>
              </div>
            </div>
          ))}
        </div>

        <Separator />

        <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-muted-foreground">
          <span className="font-mono">model {verdict.model}</span>
          {verdict.usage && (
            <span className="font-mono">
              {verdict.usage.inputTokens} in / {verdict.usage.outputTokens} out
              tokens
            </span>
          )}
          <span className="font-mono">
            coin-flip noul {percent(verdict.coinFlip.probability)}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
