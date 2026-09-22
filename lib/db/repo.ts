import "server-only";

import { createMemoryStore } from "./memory";
import { createSqliteStore } from "./sqlite";
import type { Store } from "./store";

export type { PersistedBattle } from "./store";

/**
 * Picks the backend once per process: SQLite under Bun, memory otherwise. The
 * rest of the app only sees `Store`, so callers are runtime-agnostic.
 */
let store: Store | null = null;

function getStore(): Store {
  if (!store) store = createSqliteStore() ?? createMemoryStore();
  return store;
}

export const saveCharacters: Store["saveCharacters"] = (list) =>
  getStore().saveCharacters(list);

export const getCharacter: Store["getCharacter"] = (id) =>
  getStore().getCharacter(id);

export const listCachedCharacters: Store["listCachedCharacters"] = (
  source,
  limit,
) => getStore().listCachedCharacters(source, limit);

export const saveBattle: Store["saveBattle"] = (battle) =>
  getStore().saveBattle(battle);

export const findBattleByPairing: Store["findBattleByPairing"] = (a, b) =>
  getStore().findBattleByPairing(a, b);

export const listBattles: Store["listBattles"] = (limit) =>
  getStore().listBattles(limit);

export const getBattle: Store["getBattle"] = (id) => getStore().getBattle(id);
