import type { Powerstats, Character } from "@/lib/sources/types";

import { composeVerdict, normalizeScore } from "./composite";
import { DIMENSIONS, type DimensionKey } from "./config";
import { COIN_FLIP_ID, WINNER_ID, dimensionId } from "./questions";
import type { RawAnswer, Verdict } from "./verdict";

/** Which normalized stat stands in for each dimension. */
const STAT_FOR_DIMENSION: Record<DimensionKey, keyof Powerstats> = {
  power: "strength",
  speed: "speed",
  durability: "durability",
  skill: "combat",
  abilities: "power",
  intellect: "intelligence",
};

function hash(input: string): number {
  let value = 2166136261;
  for (let index = 0; index < input.length; index += 1) {
    value ^= input.charCodeAt(index);
    value = Math.imul(value, 16777619);
  }
  return Math.abs(value);
}

function attribute(character: Character, key: DimensionKey): number {
  const stat = character.stats?.[STAT_FOR_DIMENSION[key]];
  return typeof stat === "number" ? stat : hash(`${character.id}:${key}`) % 101;
}

function legendFor(criteria: readonly string[]): Record<string, string> {
  return Object.fromEntries(criteria.map((level, index) => [String(index), level]));
}

/**
 * Deterministic stand-in for Jev: derives a full verdict from the stat blocks
 * (or a stable hash when a fighter has none). Used by tests and when
 * `JUDGE_MODE=mock`, so the app never needs the network to be usable.
 */
export function mockVerdict(a: Character, b: Character): Verdict {
  const answers: Record<string, RawAnswer> = {};
  let composite = 0;

  for (const dimension of DIMENSIONS) {
    const diff = (attribute(a, dimension.key) - attribute(b, dimension.key)) / 100;
    const score = Math.min(6, Math.max(0, 3 - diff * 3));
    composite += dimension.weight * normalizeScore(score, dimension.criteria.length);

    const level = Math.round(score);
    const probabilities: Record<string, number> = {};
    for (let index = 0; index < dimension.criteria.length; index += 1) {
      probabilities[String(index)] = index === level ? 1 : 0;
    }

    answers[dimensionId(dimension.key)] = {
      type: "score",
      score,
      confidence: 0.6,
      legend: legendFor(dimension.criteria),
      probabilities,
    };
  }

  const magnitude = Math.abs(composite);
  const outcome = magnitude < 0.05 ? "draw" : composite > 0 ? "a" : "b";

  answers[WINNER_ID] = {
    type: "choice",
    choice:
      outcome === "a" ? "fighter_a" : outcome === "b" ? "fighter_b" : "draw",
    confidence: Math.min(1, 0.5 + magnitude),
    probabilities: {
      fighter_a: outcome === "a" ? Math.min(1, 0.5 + magnitude) : 1 - magnitude,
      fighter_b: outcome === "b" ? Math.min(1, 0.5 + magnitude) : 1 - magnitude,
      draw: magnitude < 0.05 ? 0.5 : 0,
    },
  };

  answers[COIN_FLIP_ID] = {
    type: "noul",
    noul: magnitude < 0.15 ? 0.8 : 0.1,
  };

  return composeVerdict({
    answers,
    model: "mock",
    usage: null,
    fighters: { a, b },
  });
}
