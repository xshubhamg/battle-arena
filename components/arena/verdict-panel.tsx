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

function signed(value: number): string {
  return `${value >= 0 ? "+" : "−"}${Math.abs(value).toFixed(2)}`;
}

function SectionHeading({ title, hint }: { title: string; hint: string }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {title}
      </span>
      <p className="text-xs leading-relaxed text-muted-foreground">{hint}</p>
    </div>
  );
}

/**
 * Diverging bar anchored at the centre. `value` runs -1 (full advantage to the
 * left/fighter a) to +1 (full advantage to the right/fighter b). The fill always
 * grows from the centre line toward whichever side is favoured, so direction
 * and magnitude are both readable.
 */
function DivergingBar({
  value,
  className,
}: {
  value: number;
  className?: string;
}) {
  const width = Math.min(1, Math.abs(value)) * 50;
  const positive = value >= 0;
  return (
    <div
      className={cn(
        "relative h-2 w-full overflow-hidden rounded-full bg-muted",
        className,
      )}
    >
      <span className="absolute left-1/2 top-0 z-10 h-full w-px -translate-x-1/2 bg-border" />
      <span
        className={cn(
          "absolute top-0 h-full rounded-full bg-foreground",
          positive ? "left-1/2" : "right-1/2",
        )}
        style={{ width: width === 0 ? 0 : `${Math.max(width, 1.5)}%` }}
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
  const probA = verdict.winner.probabilities.fighter_a ?? 0;
  const probDraw = verdict.winner.probabilities.draw ?? 0;
  const probB = verdict.winner.probabilities.fighter_b ?? 0;

  const winnerProb =
    verdict.winner.side === "a"
      ? probA
      : verdict.winner.side === "b"
        ? probB
        : probDraw;

  const summary =
    verdict.winner.side === "draw"
      ? `Jev calls it a draw — ${percent(probDraw)} likelihood.`
      : `Jev gives ${verdict.winner.name} a ${percent(winnerProb)} chance to win.`;

  const probabilityRows = [
    { key: "a", label: names.a, value: probA, winner: verdict.winner.side === "a" },
    { key: "draw", label: "Draw", value: probDraw, winner: verdict.winner.side === "draw" },
    { key: "b", label: names.b, value: probB, winner: verdict.winner.side === "b" },
  ];

  const favorsName =
    verdict.edge.favors === "a"
      ? names.a
      : verdict.edge.favors === "b"
        ? names.b
        : "Neither";

  return (
    <Card className="[corner-shape:squircle]">
      <CardHeader>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className="font-mono">
            Jev verdict
          </Badge>
          {verdict.coinFlip.isCoinFlip && (
            <Badge variant="secondary">Too close to call</Badge>
          )}
          {verdict.split && <Badge variant="secondary">Split verdict</Badge>}
        </div>
        <CardTitle className="sr-only">Verdict</CardTitle>
      </CardHeader>

      <CardContent className="flex flex-col gap-6">
        {/* Winner */}
        <div className="flex flex-col gap-1">
          <span className="text-xs uppercase tracking-wide text-muted-foreground">
            {verdict.winner.side === "draw" ? "Result" : "Winner"}
          </span>
          <TextReveal
            as="h2"
            text={verdict.winner.name}
            className="text-3xl font-semibold tracking-tight"
          />
          <p className="text-sm text-muted-foreground">{summary}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Confidence{" "}
            <AnimatedNumber
              value={verdict.winner.confidence}
              format={percent}
              className="font-mono text-foreground"
            />{" "}
            — how sure Jev is about this outcome.
          </p>
          {verdict.split && (
            <p className="mt-1 text-xs text-muted-foreground">
              The winner pick and the weighted edge below disagree; read this as
              a close call.
            </p>
          )}
        </div>

        <Separator />

        {/* Win share */}
        <div className="flex flex-col gap-3">
          <SectionHeading
            title="Win share"
            hint="Jev's probability for each outcome, from 0% to 100%. Longer bar wins."
          />
          <div className="flex flex-col gap-2">
            {probabilityRows.map((row) => (
              <div key={row.key} className="flex items-center gap-3">
                <span
                  className={cn(
                    "w-28 shrink-0 truncate text-xs",
                    row.winner
                      ? "font-medium text-foreground"
                      : "text-muted-foreground",
                  )}
                >
                  {row.label}
                </span>
                <span className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                  <span
                    className={cn(
                      "block h-full rounded-full",
                      row.winner ? "bg-foreground" : "bg-foreground/25",
                    )}
                    style={{ width: `${Math.min(100, row.value * 100)}%` }}
                  />
                </span>
                <span
                  className={cn(
                    "w-10 shrink-0 text-right font-mono text-xs tabular-nums",
                    row.winner ? "text-foreground" : "text-muted-foreground",
                  )}
                >
                  {percent(row.value)}
                </span>
              </div>
            ))}
          </div>
        </div>

        <Separator />

        {/* Edge */}
        <div className="flex flex-col gap-3">
          <div className="flex items-start justify-between gap-4">
            <SectionHeading
              title="Edge"
              hint="Weighted advantage across the six dimensions below."
            />
            <div className="shrink-0 text-right">
              <span className="text-3xl font-semibold tabular-nums">
                <span className="text-muted-foreground">
                  {verdict.edge.value >= 0 ? "+" : "−"}
                </span>
                <AnimatedNumber
                  value={Math.abs(verdict.edge.value)}
                  format={(n) => n.toFixed(2)}
                />
              </span>
              <p className="text-xs text-muted-foreground">
                {verdict.edge.favors === "even"
                  ? "Evenly matched"
                  : `${verdict.edge.label} to ${favorsName}`}
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between text-[11px]">
              <span
                className={cn(
                  verdict.edge.favors === "a"
                    ? "font-medium text-foreground"
                    : "text-muted-foreground",
                )}
              >
                ← {names.a}
              </span>
              <span
                className={cn(
                  verdict.edge.favors === "b"
                    ? "font-medium text-foreground"
                    : "text-muted-foreground",
                )}
              >
                {names.b} →
              </span>
            </div>
            <DivergingBar value={verdict.edge.value} />
            <div className="flex justify-between text-[10px] uppercase tracking-wide text-muted-foreground/70">
              <span>−1 total loss</span>
              <span>0 even</span>
              <span>+1 total win</span>
            </div>
          </div>

          <p className="text-xs leading-relaxed text-muted-foreground">
            Bands: <span className="text-foreground">coin flip</span> under 0.12
            · slight under 0.35 · clear under 0.65 · dominant above. Current:{" "}
            <span className="text-foreground">{verdict.edge.label}</span>.
          </p>
        </div>

        <Separator />

        {/* Dimensions */}
        <div className="flex flex-col gap-3">
          <SectionHeading
            title="Dimensions"
            hint="Six Jev scores that feed the edge. Each bar points to whoever was judged stronger on that axis. Weight is how much it counts; confidence is how sure Jev was."
          />

          <div className="flex justify-between text-[11px] text-muted-foreground">
            <span>← {names.a}</span>
            <span>{names.b} →</span>
          </div>

          <div className="flex flex-col gap-3">
            {verdict.edge.dimensions.map((dimension) => {
              const even = Math.abs(dimension.signed) < 0.1;
              const side = dimension.signed > 0 ? names.a : names.b;
              return (
                <div key={dimension.key} className="flex flex-col gap-1">
                  <div className="flex items-center justify-between gap-3 text-xs">
                    <span className="font-medium">{dimension.label}</span>
                    <span className="flex items-center gap-2 text-muted-foreground">
                      <span className={even ? "" : "text-foreground"}>
                        {even ? "Even" : `${side} ${signed(dimension.signed)}`}
                      </span>
                      <span className="text-muted-foreground/70">
                        weight {Math.round(dimension.weight * 100)}% · conf{" "}
                        {dimension.confidence.toFixed(2)}
                      </span>
                    </span>
                  </div>
                  <DivergingBar value={dimension.signed} className="h-1.5" />
                </div>
              );
            })}
          </div>
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
          <span>
            Too close to call:{" "}
            <span className="font-mono text-foreground">
              {percent(verdict.coinFlip.probability)}
            </span>
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
