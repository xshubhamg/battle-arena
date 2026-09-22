import { describe, expect, test } from "bun:test";

import type { Character } from "@/lib/sources/types";

import { composeVerdict, normalizeScore } from "./composite";
import { DIMENSIONS } from "./config";
import { mockVerdict } from "./mock";
import { COIN_FLIP_ID, WINNER_ID, dimensionId } from "./questions";
import type { RawAnswer } from "./verdict";

function makeCharacter(
  overrides: Partial<Character> & { id: string },
): Character {
  return {
    id: overrides.id,
    source: overrides.source ?? "comics",
    externalId: overrides.externalId ?? overrides.id,
    name: overrides.name ?? overrides.id,
    universe: overrides.universe ?? "Test",
    imageUrl: "",
    description: overrides.description ?? "",
    stats: overrides.stats,
    tags: overrides.tags,
  };
}

const score = (value: number): RawAnswer => ({
  type: "score",
  score: value,
  confidence: 0.9,
  legend: {},
  probabilities: {},
});

const winner = (choice: string): RawAnswer => ({
  type: "choice",
  choice,
  confidence: 0.8,
  probabilities: {},
});

const noul = (value: number): RawAnswer => ({ type: "noul", noul: value });

function answersWith(
  dimensionScore: number,
  choice: string,
  coin = 0.1,
): Record<string, RawAnswer> {
  const answers: Record<string, RawAnswer> = {
    [WINNER_ID]: winner(choice),
    [COIN_FLIP_ID]: noul(coin),
  };
  for (const dimension of DIMENSIONS) {
    answers[dimensionId(dimension.key)] = score(dimensionScore);
  }
  return answers;
}

const fighters = {
  a: makeCharacter({ id: "comics:1", name: "Alpha" }),
  b: makeCharacter({ id: "comics:2", name: "Beta" }),
};

describe("normalizeScore", () => {
  test("maps the ends and middle of a seven-level rubric", () => {
    expect(normalizeScore(0, 7)).toBe(1);
    expect(normalizeScore(3, 7)).toBe(0);
    expect(normalizeScore(6, 7)).toBe(-1);
  });

  test("clamps out-of-range scores", () => {
    expect(normalizeScore(-5, 7)).toBe(1);
    expect(normalizeScore(99, 7)).toBe(-1);
  });
});

describe("composeVerdict", () => {
  test("total domination produces a decisive edge and no split", () => {
    const verdict = composeVerdict({
      answers: answersWith(0, "fighter_a"),
      model: "test",
      usage: null,
      fighters,
    });

    expect(verdict.edge.favors).toBe("a");
    expect(verdict.edge.value).toBeCloseTo(1, 5);
    expect(verdict.edge.label).toBe("Dominant");
    expect(verdict.winner.side).toBe("a");
    expect(verdict.split).toBe(false);
    expect(verdict.edge.dimensions).toHaveLength(DIMENSIONS.length);
  });

  test("flags a split when the winner Choice fights the composite", () => {
    const verdict = composeVerdict({
      answers: answersWith(0, "fighter_b"),
      model: "test",
      usage: null,
      fighters,
    });

    expect(verdict.edge.favors).toBe("a");
    expect(verdict.winner.side).toBe("b");
    expect(verdict.split).toBe(true);
  });

  test("a dead-even rubric and uncertain Noul is a coin flip", () => {
    const verdict = composeVerdict({
      answers: answersWith(3, "draw", 0.9),
      model: "test",
      usage: null,
      fighters,
    });

    expect(verdict.edge.favors).toBe("even");
    expect(verdict.coinFlip.isCoinFlip).toBe(true);
    expect(verdict.split).toBe(false);
  });
});

describe("mockVerdict", () => {
  test("is deterministic and keeps the edge in range", () => {
    const first = mockVerdict(fighters.a, fighters.b);
    const second = mockVerdict(fighters.a, fighters.b);

    expect(first.edge.value).toBe(second.edge.value);
    expect(Math.abs(first.edge.value)).toBeLessThanOrEqual(1);
    expect(first.model).toBe("mock");
  });

  test("favours the stronger stat block", () => {
    const strong = makeCharacter({
      id: "comics:strong",
      name: "Strong",
      stats: {
        intelligence: 90,
        strength: 100,
        speed: 90,
        durability: 100,
        power: 100,
        combat: 90,
      },
    });
    const weak = makeCharacter({
      id: "comics:weak",
      name: "Weak",
      stats: {
        intelligence: 10,
        strength: 10,
        speed: 10,
        durability: 10,
        power: 10,
        combat: 10,
      },
    });

    const verdict = mockVerdict(strong, weak);
    expect(verdict.edge.favors).toBe("a");
    expect(verdict.winner.side).toBe("a");
  });
});
