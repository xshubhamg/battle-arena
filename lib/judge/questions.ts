import { choice, noul, score, type Question } from "@typesafe-ai/sdk";

import type { Character } from "@/lib/sources/types";

import {
  DIMENSIONS,
  coinFlipQuestion,
  winnerCriteria,
  winnerQuestion,
  type DimensionKey,
} from "./config";

export const WINNER_ID = "winner";
export const COIN_FLIP_ID = "coin_flip";

export function dimensionId(key: DimensionKey): string {
  return `dim_${key}`;
}

/**
 * Every question for a battle, in one object. They are sent in a single
 * `systemOne` call and evaluated in parallel — adding questions barely changes
 * latency. See docs/adr/0005-jev-as-judge.md.
 */
export function buildQuestions(
  a: Character,
  b: Character,
): Record<string, Question> {
  const questions: Record<string, Question> = {
    [WINNER_ID]: choice(winnerQuestion(), winnerCriteria(a.name, b.name)),
    [COIN_FLIP_ID]: noul(coinFlipQuestion()),
  };

  for (const dimension of DIMENSIONS) {
    questions[dimensionId(dimension.key)] = score(
      dimension.question,
      dimension.criteria,
    );
  }

  return questions;
}
