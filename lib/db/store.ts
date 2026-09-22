import type { Character, Source } from "@/lib/sources/types";

export type PersistedBattle = {
  id: string;
  fighterAId: string;
  fighterBId: string;
  winner: string | null;
  edge: number | null;
  model: string | null;
  verdict: unknown;
  createdAt: number;
};

/**
 * Storage seam. Two backends implement it: `bun:sqlite` when running under Bun
 * (local dev and self-host) and an in-memory store everywhere else (Vercel's
 * Node runtime has no `bun:sqlite`). Callers never know which is active. See
 * docs/adr/0001-stack-nextjs-bun-sqlite.md.
 */
export interface Store {
  saveCharacters(list: Character[]): Promise<void>;
  getCharacter(id: string): Promise<Character | null>;
  listCachedCharacters(source: Source, limit: number): Promise<Character[]>;
  saveBattle(battle: PersistedBattle): Promise<void>;
  findBattleByPairing(
    fighterAId: string,
    fighterBId: string,
  ): Promise<PersistedBattle | null>;
  listBattles(limit: number): Promise<PersistedBattle[]>;
  getBattle(id: string): Promise<PersistedBattle | null>;
}
