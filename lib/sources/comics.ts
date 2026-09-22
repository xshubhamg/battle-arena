import { fetchJson } from "./http";
import {
  characterId,
  type Character,
  type CharacterSource,
  type Powerstats,
} from "./types";

const ALL_URL = "https://akabab.github.io/superhero-api/api/all.json";
const DEFAULT_LIMIT = 24;
const MAX_LIMIT = 50;
const MAX_DESCRIPTION = 1800;
const CACHE_TTL_MS = 6 * 60 * 60 * 1000;

type SuperheroRaw = {
  id: number;
  name: string;
  powerstats: Record<string, number | string | null> | null;
  appearance: {
    gender: string | null;
    race: string | null;
    height: string[] | null;
    weight: string[] | null;
  } | null;
  biography: {
    fullName: string | null;
    aliases: string[] | null;
    placeOfBirth: string | null;
    firstAppearance: string | null;
    publisher: string | null;
    alignment: string | null;
  } | null;
  work: { occupation: string | null; base: string | null } | null;
  connections: {
    groupAffiliation: string | null;
    relatives: string | null;
  } | null;
  images: {
    xs: string | null;
    sm: string | null;
    md: string | null;
    lg: string | null;
  } | null;
};

let cache: { at: number; data: SuperheroRaw[] } | null = null;

async function loadAll(): Promise<SuperheroRaw[]> {
  if (cache && Date.now() - cache.at < CACHE_TTL_MS) return cache.data;
  const data = await fetchJson<SuperheroRaw[]>(ALL_URL, { timeoutMs: 15000 });
  cache = { at: Date.now(), data };
  return data;
}

function num(value: number | string | null | undefined): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return undefined;
}

function mapStats(raw: SuperheroRaw): Powerstats | undefined {
  if (!raw.powerstats) return undefined;
  const statKeys = [
    "intelligence",
    "strength",
    "speed",
    "durability",
    "power",
    "combat",
  ] as const;
  const stats: Powerstats = {};
  let any = false;
  for (const key of statKeys) {
    const value = num(raw.powerstats[key]);
    if (value !== undefined) {
      stats[key] = value;
      any = true;
    }
  }
  return any ? stats : undefined;
}

function clean(value: string | null | undefined): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed || trimmed === "-") return null;
  return trimmed;
}

function buildDescription(raw: SuperheroRaw): string {
  const bio = raw.biography;
  const parts: string[] = [];

  if (clean(bio?.fullName) && bio?.fullName !== raw.name) {
    parts.push(`Full name: ${clean(bio?.fullName)}.`);
  }
  const aliases = (bio?.aliases ?? []).map((a) => a.trim()).filter(Boolean);
  if (aliases.length) parts.push(`Also known as ${aliases.join(", ")}.`);

  const appearance = [clean(raw.appearance?.race), clean(raw.appearance?.gender)]
    .filter(Boolean)
    .join(" ");
  if (appearance) parts.push(`Appearance: ${appearance}.`);

  if (clean(bio?.placeOfBirth)) {
    parts.push(`Born in ${clean(bio?.placeOfBirth)}.`);
  }
  if (clean(bio?.firstAppearance)) {
    parts.push(`First appeared in ${clean(bio?.firstAppearance)}.`);
  }
  if (clean(raw.work?.occupation)) {
    parts.push(`Occupation: ${clean(raw.work?.occupation)}.`);
  }
  if (clean(raw.connections?.groupAffiliation)) {
    parts.push(`Affiliation: ${clean(raw.connections?.groupAffiliation)}.`);
  }
  if (clean(bio?.alignment)) {
    parts.push(`Alignment: ${clean(bio?.alignment)}.`);
  }

  const text = parts.join(" ");
  return text.length > MAX_DESCRIPTION
    ? `${text.slice(0, MAX_DESCRIPTION).trimEnd()}…`
    : text;
}

function mapCharacter(raw: SuperheroRaw): Character {
  const publisher = clean(raw.biography?.publisher) ?? "Comics";
  const tags = [clean(raw.biography?.alignment), clean(raw.appearance?.race)]
    .filter(Boolean)
    .map((t) => t as string);

  return {
    id: characterId("comics", String(raw.id)),
    source: "comics",
    externalId: String(raw.id),
    name: raw.name,
    universe: publisher,
    imageUrl: raw.images?.md ?? raw.images?.lg ?? raw.images?.sm ?? "",
    description: buildDescription(raw),
    stats: mapStats(raw),
    tags,
  };
}

function clampLimit(limit?: number): number {
  if (!limit || limit <= 0) return DEFAULT_LIMIT;
  return Math.min(limit, MAX_LIMIT);
}

export const comicsSource: CharacterSource = {
  source: "comics",
  label: "Comics",

  async list(limit) {
    const perPage = clampLimit(limit);
    const all = await loadAll();
    return all
      .map(mapCharacter)
      .sort((a, b) => a.name.localeCompare(b.name))
      .slice(0, perPage);
  },

  async search(query, limit) {
    const perPage = clampLimit(limit);
    const trimmed = query.trim().toLowerCase();
    if (!trimmed) return this.list(perPage);

    const all = await loadAll();
    const matches = all
      .filter((raw) => {
        if (raw.name.toLowerCase().includes(trimmed)) return true;
        const aliases = raw.biography?.aliases ?? [];
        return aliases.some((alias) => alias.toLowerCase().includes(trimmed));
      })
      .map(mapCharacter)
      .sort((a, b) => {
        const aStarts = a.name.toLowerCase().startsWith(trimmed) ? 0 : 1;
        const bStarts = b.name.toLowerCase().startsWith(trimmed) ? 0 : 1;
        return aStarts - bStarts || a.name.localeCompare(b.name);
      });

    return matches.slice(0, perPage);
  },

  async get(externalId) {
    const id = Number.parseInt(externalId, 10);
    if (!Number.isFinite(id)) return null;
    const all = await loadAll();
    const raw = all.find((entry) => entry.id === id);
    return raw ? mapCharacter(raw) : null;
  },
};
