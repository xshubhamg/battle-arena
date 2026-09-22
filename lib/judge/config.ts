/**
 * The one reviewable file for the judge.
 *
 * Every question, weight, and threshold lives here. Nothing about the judgment
 * is hidden in a component or spread across modules. Change priorities by
 * editing weights here, not by rewriting prompts. See
 * docs/adr/0006-edge-composite-scoring.md and AGENTS.md ("Code owns the
 * judgment math").
 */

export const JUDGE_MODEL = process.env.TYPESAFE_MODEL?.trim() || "jev-latest";

export const DEFAULT_MODE = "live" as const;

export type DimensionKey =
  | "power"
  | "speed"
  | "durability"
  | "skill"
  | "abilities"
  | "intellect";

/** Seven symmetric levels: index 3 is dead even, 0 favours fighter_a, 6 favours fighter_b. */
export type Rubric = readonly [
  string,
  string,
  string,
  string,
  string,
  string,
  string,
];

export type DimensionConfig = {
  key: DimensionKey;
  label: string;
  weight: number;
  question: string;
  criteria: Rubric;
};

/**
 * Six comparative dimensions. Weights must sum to 1 so the composite edge stays
 * in [-1, 1]. The middle rubric level is shared so the scale is symmetric.
 */
export const DIMENSIONS: readonly DimensionConfig[] = [
  {
    key: "power",
    label: "Power",
    weight: 0.2,
    question:
      "On raw physical strength and destructive force, who holds the advantage between `fighter_a` and `fighter_b`?",
    criteria: [
      "`fighter_a` holds a decisive advantage in raw power",
      "`fighter_a` holds a clear advantage in raw power",
      "`fighter_a` holds a slight advantage in raw power",
      "Neither fighter holds an advantage in raw power",
      "`fighter_b` holds a slight advantage in raw power",
      "`fighter_b` holds a clear advantage in raw power",
      "`fighter_b` holds a decisive advantage in raw power",
    ],
  },
  {
    key: "speed",
    label: "Speed",
    weight: 0.15,
    question:
      "On movement speed, reflexes, and reaction time, who holds the advantage between `fighter_a` and `fighter_b`?",
    criteria: [
      "`fighter_a` holds a decisive advantage in speed and reflexes",
      "`fighter_a` holds a clear advantage in speed and reflexes",
      "`fighter_a` holds a slight advantage in speed and reflexes",
      "Neither fighter holds an advantage in speed and reflexes",
      "`fighter_b` holds a slight advantage in speed and reflexes",
      "`fighter_b` holds a clear advantage in speed and reflexes",
      "`fighter_b` holds a decisive advantage in speed and reflexes",
    ],
  },
  {
    key: "durability",
    label: "Durability",
    weight: 0.15,
    question:
      "On resilience — how much punishment each can absorb and keep fighting — who holds the advantage between `fighter_a` and `fighter_b`?",
    criteria: [
      "`fighter_a` holds a decisive advantage in resilience",
      "`fighter_a` holds a clear advantage in resilience",
      "`fighter_a` holds a slight advantage in resilience",
      "Neither fighter holds an advantage in resilience",
      "`fighter_b` holds a slight advantage in resilience",
      "`fighter_b` holds a clear advantage in resilience",
      "`fighter_b` holds a decisive advantage in resilience",
    ],
  },
  {
    key: "skill",
    label: "Combat skill",
    weight: 0.2,
    question:
      "On fighting skill — technique, tactics, and experience in combat — who holds the advantage between `fighter_a` and `fighter_b`?",
    criteria: [
      "`fighter_a` holds a decisive advantage in combat skill",
      "`fighter_a` holds a clear advantage in combat skill",
      "`fighter_a` holds a slight advantage in combat skill",
      "Neither fighter holds an advantage in combat skill",
      "`fighter_b` holds a slight advantage in combat skill",
      "`fighter_b` holds a clear advantage in combat skill",
      "`fighter_b` holds a decisive advantage in combat skill",
    ],
  },
  {
    key: "abilities",
    label: "Abilities",
    weight: 0.2,
    question:
      "On special abilities, powers, and hax — the toolkit each brings beyond physicality — who holds the advantage between `fighter_a` and `fighter_b`?",
    criteria: [
      "`fighter_a` holds a decisive advantage in abilities and powers",
      "`fighter_a` holds a clear advantage in abilities and powers",
      "`fighter_a` holds a slight advantage in abilities and powers",
      "Neither fighter holds an advantage in abilities and powers",
      "`fighter_b` holds a slight advantage in abilities and powers",
      "`fighter_b` holds a clear advantage in abilities and powers",
      "`fighter_b` holds a decisive advantage in abilities and powers",
    ],
  },
  {
    key: "intellect",
    label: "Intellect",
    weight: 0.1,
    question:
      "On intelligence, planning, and resourcefulness — who holds the advantage between `fighter_a` and `fighter_b`?",
    criteria: [
      "`fighter_a` holds a decisive advantage in intellect and planning",
      "`fighter_a` holds a clear advantage in intellect and planning",
      "`fighter_a` holds a slight advantage in intellect and planning",
      "Neither fighter holds an advantage in intellect and planning",
      "`fighter_b` holds a slight advantage in intellect and planning",
      "`fighter_b` holds a clear advantage in intellect and planning",
      "`fighter_b` holds a decisive advantage in intellect and planning",
    ],
  },
];

/** Headline verdict. Labels are stable keys; descriptions carry the names. */
export function winnerQuestion() {
  return "Given `fighter_a` and `fighter_b`, who wins this fight?";
}

export function winnerCriteria(aName: string, bName: string) {
  return {
    fighter_a: `${aName} wins the fight`,
    fighter_b: `${bName} wins the fight`,
    draw: "Neither can put the other down; the fight is a draw",
  } as const;
}

export function coinFlipQuestion() {
  return "Is the outcome of a fight between `fighter_a` and `fighter_b` genuinely uncertain — could either plausibly win?";
}

/** Bands over |edge|. The first band is the "too close" zone. */
export const EDGE_BANDS = [
  { max: 0.12, label: "Coin flip" },
  { max: 0.35, label: "Slight edge" },
  { max: 0.65, label: "Clear edge" },
  { max: Number.POSITIVE_INFINITY, label: "Dominant" },
] as const;

/** Below this |edge| the composite is treated as no advantage. */
export const EVEN_THRESHOLD = 0.02;

/** A coin-flip Noul at or above this probability flags the matchup as uncertain. */
export const COIN_FLIP_MIN = 0.5;

/** State budget guard: each fighter's description is trimmed to this length. */
export const MAX_STATE_DESCRIPTION = 1200;
