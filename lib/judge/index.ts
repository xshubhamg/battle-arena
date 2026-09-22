import "server-only";

import type { Character } from "@/lib/sources/types";

import { judgeWithJev } from "./client";
import { DEFAULT_MODE } from "./config";
import { mockVerdict } from "./mock";
import type { Verdict } from "./verdict";

export type JudgeMode = "live" | "mock";

export function judgeMode(): JudgeMode {
  return (process.env.JUDGE_MODE ?? DEFAULT_MODE) === "mock" ? "mock" : "live";
}

/**
 * Judge a battle. `JUDGE_MODE=mock` swaps Jev for a deterministic local judge
 * so tests and offline development never need the network.
 */
export async function judgeBattle(
  a: Character,
  b: Character,
): Promise<Verdict> {
  return judgeMode() === "mock" ? mockVerdict(a, b) : judgeWithJev(a, b);
}

export { JUDGE_MODEL } from "./config";
export { normalizeScore } from "./composite";
export type { Verdict, DimensionVerdict, Outcome } from "./verdict";
