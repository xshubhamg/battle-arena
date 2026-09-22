import { fetchJson } from "./http";
import {
  characterId,
  type Character,
  type CharacterSource,
} from "./types";

const ENDPOINT = "https://graphql.anilist.co";
const DEFAULT_LIMIT = 24;
const MAX_LIMIT = 50;
const MAX_DESCRIPTION = 1800;

const CHARACTER_FIELDS = `
  id
  name { full }
  image { large }
  description(asHtml: false)
  favourites
  media(perPage: 1, sort: POPULARITY_DESC) {
    nodes { title { romaji english } }
  }
`;

type AniListCharacter = {
  id: number;
  name: { full: string | null };
  image: { large: string | null };
  description: string | null;
  favourites: number | null;
  media: {
    nodes: Array<{ title: { romaji: string | null; english: string | null } }>;
  } | null;
};

type AniListResponse = {
  data: {
    Page?: { characters: AniListCharacter[] };
    Character?: AniListCharacter | null;
  };
  errors?: Array<{ message: string }>;
};

async function graphql(
  query: string,
  variables: Record<string, unknown>,
): Promise<AniListResponse["data"]> {
  const json = await fetchJson<AniListResponse>(ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({ query, variables }),
  });

  if (json.errors?.length) {
    throw new Error(`AniList: ${json.errors[0].message}`);
  }
  return json.data;
}

/** AniList descriptions carry HTML and light markdown; flatten to plain text. */
function cleanDescription(input: string | null): string {
  if (!input) return "";
  const text = input
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/~~.*?~~/g, "")
    .replace(/~!(.*?)!~/g, "$1")
    .replace(/__([^_]+)__/g, "$1")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  return text.length > MAX_DESCRIPTION
    ? `${text.slice(0, MAX_DESCRIPTION).trimEnd()}…`
    : text;
}

function universeOf(raw: AniListCharacter): string {
  const title = raw.media?.nodes?.[0]?.title;
  // Romaji first: AniList's English titles are often ALL CAPS.
  return title?.romaji?.trim() || title?.english?.trim() || "Anime";
}

function mapCharacter(raw: AniListCharacter): Character | null {
  const name = raw.name.full?.trim() || `AniList #${raw.id}`;
  return {
    id: characterId("anime", String(raw.id)),
    source: "anime",
    externalId: String(raw.id),
    name,
    universe: universeOf(raw),
    imageUrl: raw.image.large ?? "",
    description: cleanDescription(raw.description),
    tags: raw.favourites ? [`${raw.favourites.toLocaleString()} favourites`] : [],
    externalUrl: `https://anilist.co/character/${raw.id}`,
  };
}

function clampLimit(limit?: number): number {
  if (!limit || limit <= 0) return DEFAULT_LIMIT;
  return Math.min(limit, MAX_LIMIT);
}

export const anilistSource: CharacterSource = {
  source: "anime",
  label: "Anime",

  async list(limit) {
    const perPage = clampLimit(limit);
    const data = await graphql(
      `query ($perPage: Int) {
        Page(perPage: $perPage) {
          characters(sort: FAVOURITES_DESC) { ${CHARACTER_FIELDS} }
        }
      }`,
      { perPage },
    );
    return (data.Page?.characters ?? [])
      .map(mapCharacter)
      .filter((c): c is Character => c !== null);
  },

  async search(query, limit) {
    const perPage = clampLimit(limit);
    const trimmed = query.trim();
    if (!trimmed) return this.list(perPage);

    const data = await graphql(
      `query ($search: String, $perPage: Int) {
        Page(perPage: $perPage) {
          characters(search: $search, sort: FAVOURITES_DESC) { ${CHARACTER_FIELDS} }
        }
      }`,
      { search: trimmed, perPage },
    );
    return (data.Page?.characters ?? [])
      .map(mapCharacter)
      .filter((c): c is Character => c !== null);
  },

  async get(externalId) {
    const id = Number.parseInt(externalId, 10);
    if (!Number.isFinite(id)) return null;
    const data = await graphql(
      `query ($id: Int) {
        Character(id: $id) { ${CHARACTER_FIELDS} }
      }`,
      { id },
    );
    return data.Character ? mapCharacter(data.Character) : null;
  },
};
