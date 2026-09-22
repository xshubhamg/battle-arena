import "server-only";

import {
  getCharacter as getCachedCharacter,
  listCachedCharacters,
  saveCharacters,
} from "@/lib/db/repo";
import { getCharacterSource } from "@/lib/sources";
import {
  parseCharacterId,
  type Character,
  type Source,
} from "@/lib/sources/types";

export const DEFAULT_LIMIT = 24;

function filterCached(
  cached: Character[],
  query: string,
  limit: number,
): Character[] {
  const needle = query.trim().toLowerCase();
  const matches = needle
    ? cached.filter((c) => c.name.toLowerCase().includes(needle))
    : cached;
  return matches.slice(0, limit);
}

/**
 * Cache-through reads. Live source first (so the roster feels current); on a
 * source failure or rate limit, fall back to whatever SQLite already holds.
 * Every successful fetch is written back so history and offline use survive.
 */
export async function searchCharacters(
  source: Source,
  query: string,
  limit = DEFAULT_LIMIT,
): Promise<Character[]> {
  const adapter = getCharacterSource(source);
  try {
    const results = await adapter.search(query, limit);
    await saveCharacters(results);
    return results;
  } catch {
    return filterCached(await listCachedCharacters(source, 200), query, limit);
  }
}

export async function listCharacters(
  source: Source,
  limit = DEFAULT_LIMIT,
): Promise<Character[]> {
  return searchCharacters(source, "", limit);
}

export async function getCharacterById(
  id: string,
): Promise<Character | null> {
  const cached = await getCachedCharacter(id);
  if (cached) return cached;

  const parsed = parseCharacterId(id);
  if (!parsed) return null;

  try {
    const character = await getCharacterSource(parsed.source).get(
      parsed.externalId,
    );
    if (character) await saveCharacters([character]);
    return character;
  } catch {
    return null;
  }
}
