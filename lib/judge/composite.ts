import type { Character } from "@/lib/sources/types";

import {
  COIN_FLIP_MIN,
  DIMENSIONS,
  EDGE_BANDS,
  EVEN_THRESHOLD,
} from "./config";
import { COIN_FLIP_ID, WINNER_ID, dimensionId } from "./questions";
import type {
  DimensionVerdict,
  Outcome,
  RawAnswer,
  Verdict,
} from "./verdict";

/**
 * Map a rubric position to a signed advantage in [-1, 1], positive toward
 * fighter_a. Level 0 (a decisively better) -> +1, top level -> -1, middle -> 0.
 */
export function normalizeScore(score: number, levels: number): number {
  if (levels <= 1) return 0;
  const top = levels - 1;
  const clamped = Math.min(top, Math.max(0, score));
  return 1 - (2 * clamped) / top;
}

function edgeLabel(magnitude: number): string {
  return EDGE_BANDS.find((band) => magnitude <= band.max)?.label ?? "Coin flip";
}

function winnerSide(choice: string): Outcome {
  if (choice === "fighter_a") return "a";
  if (choice === "fighter_b") return "b";
  return "draw";
}

export type ComposeInput = {
  answers: Record<string, RawAnswer>;
  model: string;
  usage: { inputTokens: number; outputTokens: number } | null;
  fighters: { a: Character; b: Character };
};

/**
 * Turn Jev's typed answers into a verdict. Pure and synchronous, so it is
 * unit-tested against fixtures without touching the network. All arithmetic
 * derives from constants in config.ts.
 */
export function composeVerdict({
  answers,
  model,
  usage,
  fighters,
}: ComposeInput): Verdict {
  const winnerAnswer = answers[WINNER_ID];
  if (!winnerAnswer || winnerAnswer.type !== "choice") {
    throw new Error("Judge response is missing the winner Choice answer");
  }

  const coinAnswer = answers[COIN_FLIP_ID];

  const dimensions: DimensionVerdict[] = DIMENSIONS.map((dimension) => {
    const answer = answers[dimensionId(dimension.key)];
    if (!answer || answer.type !== "score") {
      throw new Error(
        `Judge response is missing the ${dimension.key} Score answer`,
      );
    }
    const levels = dimension.criteria.length;
    return {
      key: dimension.key,
      label: dimension.label,
      weight: dimension.weight,
      score: answer.score,
      signed: normalizeScore(answer.score, levels),
      confidence: answer.confidence,
      probabilities: answer.probabilities,
      legend: answer.legend,
    };
  });

  const value = dimensions.reduce(
    (total, dimension) => total + dimension.weight * dimension.signed,
    0,
  );
  const magnitude = Math.abs(value);
  const favors = value > EVEN_THRESHOLD ? "a" : value < -EVEN_THRESHOLD ? "b" : "even";

  const outcome = winnerSide(winnerAnswer.choice);
  const winnerName =
    outcome === "a"
      ? fighters.a.name
      : outcome === "b"
        ? fighters.b.name
        : "Draw";

  const coinProbability = coinAnswer?.type === "noul" ? coinAnswer.noul : 0;
  const isCoinFlip =
    coinProbability >= COIN_FLIP_MIN || magnitude <= EDGE_BANDS[0].max;

  return {
    model,
    winner: {
      side: outcome,
      name: winnerName,
      confidence: winnerAnswer.confidence,
      probabilities: winnerAnswer.probabilities,
    },
    edge: {
      value,
      favors,
      label: favors === "even" ? EDGE_BANDS[0].label : edgeLabel(magnitude),
      magnitude,
      dimensions,
    },
    coinFlip: {
      probability: coinProbability,
      isCoinFlip,
    },
    split: outcome !== "draw" && favors !== "even" && outcome !== favors,
    usage,
  };
}
