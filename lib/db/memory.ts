import "server-only";

import type { Character, Source } from "@/lib/sources/types";

import type { PersistedBattle, Store } from "./store";

/**
 * Non-durable fallback used when `bun:sqlite` is unavailable (Vercel's Node
 * runtime). Everything lives for the lifetime of one serverless instance, so
 * repeated requests to the same instance reuse cached characters and verdicts,
 * but history does not survive a cold start. The app stays fully usable; only
 * persistence degrades. Plug in Turso/Postgres behind `Store` for durable
 * history in production.
 */
export function createMemoryStore(): Store {
  const characters = new Map<string, Character>();
  const battles = new Map<string, PersistedBattle>();

  return {
    async saveCharacters(list) {
      for (const character of list) characters.set(character.id, character);
    },

    async getCharacter(id) {
      return characters.get(id) ?? null;
    },

    async listCachedCharacters(source: Source, limit) {
      return [...characters.values()]
        .filter((character) => character.source === source)
        .sort((a, b) => a.name.localeCompare(b.name))
        .slice(0, limit);
    },

    async saveBattle(battle) {
      if (!battles.has(battle.id)) battles.set(battle.id, battle);
    },

    async findBattleByPairing(fighterAId, fighterBId) {
      return (
        [...battles.values()]
          .filter(
            (battle) =>
              battle.fighterAId === fighterAId &&
              battle.fighterBId === fighterBId,
          )
          .sort((a, b) => b.createdAt - a.createdAt)[0] ?? null
      );
    },

    async listBattles(limit) {
      return [...battles.values()]
        .sort((a, b) => b.createdAt - a.createdAt)
        .slice(0, limit);
    },

    async getBattle(id) {
      return battles.get(id) ?? null;
    },
  };
}
