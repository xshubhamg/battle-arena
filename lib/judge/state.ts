import type { EntryType } from "@typesafe-ai/sdk";

import type { Character } from "@/lib/sources/types";

import { MAX_STATE_DESCRIPTION } from "./config";

/**
 * A fighter as it appears in the Jev state. Text only — Jev cannot see images,
 * and every field is either a string or a number.
 */
export type FighterState = {
  name: string;
  source: string;
  universe: string;
  description: string;
  powerstats?: Record<string, number>;
};

function clampDescription(text: string): string {
  const trimmed = text.trim();
  if (trimmed.length <= MAX_STATE_DESCRIPTION) return trimmed;
  return `${trimmed.slice(0, MAX_STATE_DESCRIPTION).trimEnd()}…`;
}

export function toFighterState(character: Character): FighterState {
  const powerstats = character.stats
    ? Object.fromEntries(
        Object.entries(character.stats).filter(
          (entry): entry is [string, number] => typeof entry[1] === "number",
        ),
      )
    : undefined;

  return {
    name: character.name,
    source: character.source,
    universe: character.universe,
    description: clampDescription(character.description),
    ...(powerstats && Object.keys(powerstats).length > 0 ? { powerstats } : {}),
  };
}

/**
 * Both fighters in one state object. Jev evaluates every question against this
 * same payload in a single parallel pass.
 */
export function buildState(a: Character, b: Character): EntryType {
  return {
    matchup: `${a.name} (fighter_a) vs ${b.name} (fighter_b)`,
    fighter_a: toFighterState(a),
    fighter_b: toFighterState(b),
  };
}
