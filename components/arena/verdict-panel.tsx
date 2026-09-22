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
import type { Character, Powerstats } from "@/lib/sources/types";

const STAT_LABELS: Array<{ key: keyof Powerstats; label: string }> = [
  { key: "intelligence", label: "Intelligence" },
  { key: "strength", label: "Strength" },
  { key: "speed", label: "Speed" },
  { key: "durability", label: "Durability" },
  { key: "power", label: "Power" },
  { key: "combat", label: "Combat" },
];

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
 * Diverging bar anchored at the centre. `value` runs +1 (full advantage to
 * fighter a, shown on the left) to -1 (full advantage to fighter b, shown on
 * the right) — matching `normalizeScore` in `lib/judge/composite.ts`. The fill
 * always grows from the centre line toward whichever side is favoured, so
 * direction and magnitude are both readable.
 */
function DivergingBar({
  value,
  className,
}: {
  value: number;
  className?: string;
}) {
  const width = Math.min(1, Math.abs(value)) * 50;
  const favorsA = value >= 0;
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
          favorsA ? "right-1/2" : "left-1/2",
        )}
        style={{ width: width === 0 ? 0 : `${Math.max(width, 1.5)}%` }}
      />
    </div>
  );
}

/**
 * Circular win-share chart. Three monochrome ring segments (fighter A solid,
 * fighter B muted, draw faint) with the winner's probability in the centre.
 * Pure SVG so no chart dependency is needed.
 */
function WinDonut({
  probA,
  probB,
  probDraw,
  winnerProb,
  winnerCaption,
}: {
  probA: number;
  probB: number;
  probDraw: number;
  winnerProb: number;
  winnerCaption: string;
}) {
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const total = Math.max(probA + probB + probDraw, 0.0001);
  const segments = [
    { key: "a", fraction: probA / total, className: "stroke-foreground" },
    {
      key: "b",
      fraction: probB / total,
      className: "stroke-muted-foreground",
    },
    {
      key: "draw",
      fraction: probDraw / total,
      className: "stroke-foreground/25",
    },
  ];
  let offset = 0;
  return (
    <div className="relative mx-auto size-44 shrink-0">
      <svg viewBox="0 0 128 128" className="size-full -rotate-90">
        <circle
          cx="64"
          cy="64"
          r={radius}
          fill="none"
          className="stroke-muted"
          strokeWidth="12"
        />
        {segments.map((segment) => {
          const length = segment.fraction * circumference;
          const element = (
            <circle
              key={segment.key}
              cx="64"
              cy="64"
              r={radius}
              fill="none"
              strokeWidth="12"
              strokeLinecap="butt"
              className={segment.className}
              strokeDasharray={`${Math.max(length - 1.5, 0.5)} ${circumference}`}
              strokeDashoffset={-offset * circumference}
              opacity={segment.fraction <= 0 ? 0 : 1}
            />
          );
          offset += segment.fraction;
          return element;
        })}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-0.5 text-center">
        <span className="text-3xl font-semibold tabular-nums">
          <AnimatedNumber value={winnerProb} format={percent} />
        </span>
        <span className="max-w-28 truncate text-[11px] font-medium">
          {winnerCaption}
        </span>
        <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
          to win
        </span>
      </div>
    </div>
  );
}

/** 0–100% meter used for confidence and coin-flip probability. */
function Meter({ value, className }: { value: number; className?: string }) {
  return (
    <span
      className={cn(
        "h-1.5 flex-1 overflow-hidden rounded-full bg-muted",
        className,
      )}
    >
      <span
        className="block h-full rounded-full bg-foreground"
        style={{ width: `${Math.min(100, Math.max(0, value * 100))}%` }}
      />
    </span>
  );
}

function HeadToHeadStats({
  a,
  b,
}: {
  a: Character;
  b: Character;
}) {
  if (!a.stats && !b.stats) return null;
  return (
    <div className="flex flex-col gap-3">
      <SectionHeading
        title="Powerstats head-to-head"
        hint="Source stat blocks (0–100), not Jev scores. Bold value takes the stat; bars mirror from the centre."
      />
      <div className="flex flex-col gap-2.5">
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 text-[11px] font-medium text-muted-foreground">
          <span className="truncate text-right">{a.name}</span>
          <span className="w-24 text-center uppercase tracking-wide">Stat</span>
          <span className="truncate">{b.name}</span>
        </div>
        {STAT_LABELS.map(({ key, label }) => {
          const aVal = a.stats?.[key];
          const bVal = b.stats?.[key];
          if (aVal == null && bVal == null) return null;
          const aWins = (aVal ?? -1) > (bVal ?? -1);
          const bWins = (bVal ?? -1) > (aVal ?? -1);
          return (
            <div
              key={key}
              className="grid grid-cols-[1fr_auto_1fr] items-center gap-2"
            >
              <div className="flex items-center justify-end gap-2">
                <span
                  className={cn(
                    "h-1.5 w-full max-w-28 overflow-hidden rounded-full bg-muted",
                  )}
                >
                  <span
                    className={cn(
                      "ml-auto block h-full rounded-full",
                      aWins ? "bg-foreground" : "bg-foreground/25",
                    )}
                    style={{ width: `${Math.min(100, Math.max(0, aVal ?? 0))}%` }}
                  />
                </span>
                <span
                  className={cn(
                    "w-7 shrink-0 text-right font-mono text-[11px] tabular-nums",
                    aWins ? "font-semibold text-foreground" : "text-muted-foreground",
                  )}
                >
                  {aVal ?? "–"}
                </span>
              </div>
              <span className="w-24 shrink-0 text-center text-[11px] uppercase tracking-wide text-muted-foreground">
                {label}
              </span>
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    "w-7 shrink-0 font-mono text-[11px] tabular-nums",
                    bWins ? "font-semibold text-foreground" : "text-muted-foreground",
                  )}
                >
                  {bVal ?? "–"}
                </span>
                <span className="h-1.5 w-full max-w-28 overflow-hidden rounded-full bg-muted">
                  <span
                    className={cn(
                      "block h-full rounded-full",
                      bWins ? "bg-foreground" : "bg-foreground/25",
                    )}
                    style={{ width: `${Math.min(100, Math.max(0, bVal ?? 0))}%` }}
                  />
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function VerdictPanel({
  verdict,
  names,
  fighters,
}: {
  verdict: Verdict;
  names: { a: string; b: string };
  fighters?: { a: Character; b: Character };
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

  const winnerCaption =
    verdict.winner.side === "draw" ? "Draw" : verdict.winner.name;

  const summary =
    verdict.winner.side === "draw"
      ? `Jev calls it a draw — ${percent(probDraw)} likelihood.`
      : `Jev gives ${verdict.winner.name} a ${percent(winnerProb)} chance to win.`;

  const probabilityRows = [
    { key: "a", label: names.a, value: probA, winner: verdict.winner.side === "a", dot: "bg-foreground" },
    { key: "draw", label: "Draw", value: probDraw, winner: verdict.winner.side === "draw", dot: "bg-foreground/25" },
    { key: "b", label: names.b, value: probB, winner: verdict.winner.side === "b", dot: "bg-muted-foreground" },
  ];

  const favorsName =
    verdict.edge.favors === "a"
      ? names.a
      : verdict.edge.favors === "b"
        ? names.b
        : "Neither";

  return (
    <div className="flex flex-col gap-3">
      {/* Winner hero with circular chart */}
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

        <CardContent className="flex flex-col gap-6 sm:flex-row sm:items-center">
          <WinDonut
            probA={probA}
            probB={probB}
            probDraw={probDraw}
            winnerProb={winnerProb}
            winnerCaption={winnerCaption}
          />
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <span className="text-xs uppercase tracking-wide text-muted-foreground">
              {verdict.winner.side === "draw" ? "Result" : "Winner"}
            </span>
            <TextReveal
              as="h2"
              text={verdict.winner.name}
              className="text-3xl font-semibold tracking-tight"
            />
            <p className="text-sm text-muted-foreground">{summary}</p>
            <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
              <span className="shrink-0">
                Confidence{" "}
                <AnimatedNumber
                  value={verdict.winner.confidence}
                  format={percent}
                  className="font-mono text-foreground"
                />
              </span>
              <Meter value={verdict.winner.confidence} className="max-w-40" />
            </div>
            <p className="text-[11px] text-muted-foreground/80">
              How peaked Jev&apos;s distribution was — not the win chance itself.
            </p>
            {verdict.split && (
              <p className="mt-1 text-xs text-muted-foreground">
                The winner pick and the weighted edge below disagree; read this
                as a close call.
              </p>
            )}
            {/* Donut legend */}
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-foreground" />
                {names.a} {percent(probA)}
              </span>
              <span className="flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-muted-foreground" />
                {names.b} {percent(probB)}
              </span>
              <span className="flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-foreground/25" />
                Draw {percent(probDraw)}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Win share: segmented bar + rows (second chart format) */}
      <Card className="[corner-shape:squircle]">
        <CardContent className="flex flex-col gap-3 pt-6">
          <SectionHeading
            title="Win share"
            hint="Jev's probability for each outcome, from 0% to 100%. Longer bar wins."
          />
          <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-muted">
            <span
              className="h-full bg-foreground"
              style={{ width: `${Math.min(100, probA * 100)}%` }}
            />
            <span
              className="h-full bg-muted-foreground"
              style={{ width: `${Math.min(100, probB * 100)}%` }}
            />
          </div>
          <div className="flex flex-col gap-2">
            {probabilityRows.map((row) => (
              <div key={row.key} className="flex items-center gap-3">
                <span className={cn("size-2 shrink-0 rounded-full", row.dot)} />
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
        </CardContent>
      </Card>

      {/* Edge gauge */}
      <Card className="[corner-shape:squircle]">
        <CardContent className="flex flex-col gap-3 pt-6">
          <div className="flex items-start justify-between gap-4">
            <SectionHeading
              title="Edge"
              hint={`Signed advantage across the six dimensions below. Positive leans left toward ${names.a}; negative leans right toward ${names.b}.`}
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
            <div className="flex justify-between gap-2 text-[10px] uppercase tracking-wide text-muted-foreground/70">
              <span className="max-w-32 truncate">+1 {names.a}</span>
              <span className="shrink-0">0 even</span>
              <span className="max-w-32 truncate text-right">−1 {names.b}</span>
            </div>
          </div>

          <p className="text-xs leading-relaxed text-muted-foreground">
            Bands: <span className="text-foreground">coin flip</span> under 0.12
            · slight under 0.35 · clear under 0.65 · dominant above. Current:{" "}
            <span className="text-foreground">{verdict.edge.label}</span>.
          </p>
        </CardContent>
      </Card>

      {/* Dimensions: metric cards grid (third format) */}
      <Card className="[corner-shape:squircle]">
        <CardContent className="flex flex-col gap-3 pt-6">
          <SectionHeading
            title="Dimensions"
            hint="Six Jev scores that feed the edge. Arrow shows who Jev favoured; weight is how much it counts, confidence how sure Jev was."
          />
          <div className="grid gap-2 sm:grid-cols-2">
            {verdict.edge.dimensions.map((dimension) => {
              const even = Math.abs(dimension.signed) < 0.1;
              const leader =
                dimension.signed > 0 ? names.a : names.b;
              return (
                <div
                  key={dimension.key}
                  className="flex flex-col gap-2 rounded-2xl border border-border bg-muted/30 p-3 [corner-shape:squircle]"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-medium">{dimension.label}</span>
                    <span
                      className={cn(
                        "font-mono text-xs tabular-nums",
                        even ? "text-muted-foreground" : "text-foreground",
                      )}
                    >
                      {even
                        ? "＝ Even"
                        : dimension.signed > 0
                          ? `← ${signed(dimension.signed)}`
                          : `${signed(dimension.signed)} →`}
                    </span>
                  </div>
                  <DivergingBar value={dimension.signed} className="h-1.5" />
                  <div className="flex items-center justify-between gap-2 text-[11px] text-muted-foreground">
                    <span
                      className={cn(
                        !even && "text-foreground",
                        "max-w-28 truncate",
                      )}
                    >
                      {even ? "No advantage" : leader}
                    </span>
                    <span className="shrink-0 font-mono tabular-nums">
                      wt {Math.round(dimension.weight * 100)}% · conf{" "}
                      {dimension.confidence.toFixed(2)}
                    </span>
                  </div>
                  <Meter value={dimension.confidence} className="h-1" />
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Powerstats head-to-head (fourth format, mirrored bars) */}
      {fighters && (
        <Card className="[corner-shape:squircle]">
          <CardContent className="flex flex-col gap-3 pt-6">
            <HeadToHeadStats a={fighters.a} b={fighters.b} />
          </CardContent>
        </Card>
      )}

      {/* Meta footer */}
      <Card className="[corner-shape:squircle]">
        <CardContent className="flex flex-col gap-2 pt-6 text-[11px] text-muted-foreground">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="font-mono">model {verdict.model}</span>
            {verdict.usage && (
              <span className="font-mono">
                {verdict.usage.inputTokens} in / {verdict.usage.outputTokens} out
                tokens
              </span>
            )}
          </div>
          <Separator />
          <div className="flex items-center gap-2">
            <span className="shrink-0">
              Too close to call:{" "}
              <span className="font-mono text-foreground">
                {percent(verdict.coinFlip.probability)}
              </span>
            </span>
            <Meter value={verdict.coinFlip.probability} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
