import { fetchJson } from "./http";
import { characterId, type Character, type CharacterSource } from "./types";

const WIKI_SUMMARY = "https://en.wikipedia.org/api/rest_v1/page/summary/";
const WIKI_SEARCH = "https://en.wikipedia.org/w/rest.php/v1/search/page";
const TVMAZE_SHOWS = "https://api.tvmaze.com/search/shows";
const TVMAZE_CAST = (id: number) => `https://api.tvmaze.com/shows/${id}/cast`;

const DEFAULT_LIMIT = 24;
const MAX_LIMIT = 50;
const MAX_DESCRIPTION = 1800;

const USER_AGENT = "Battle-Arena/0.1 (non-commercial demo)";

/**
 * A curated set of well-known TV characters. TVMaze reliably lists shows and
 * cast, but its cast images are actor photos; Wikipedia carries actual character
 * art and an extract, so the seed points at Wikipedia pages directly.
 */
const SEED: Array<{ name: string; page: string; universe: string }> = [
  { name: "Walter White", page: "Walter_White_(Breaking_Bad)", universe: "Breaking Bad" },
  { name: "Jesse Pinkman", page: "Jesse_Pinkman", universe: "Breaking Bad" },
  { name: "Geralt of Rivia", page: "Geralt_of_Rivia", universe: "The Witcher" },
  { name: "Eleven", page: "Eleven_(Stranger_Things)", universe: "Stranger Things" },
  { name: "Jim Hopper", page: "Jim_Hopper", universe: "Stranger Things" },
  { name: "Vecna", page: "Vecna_(Stranger_Things)", universe: "Stranger Things" },
  { name: "Jon Snow", page: "Jon_Snow_(character)", universe: "Game of Thrones" },
  { name: "Daenerys Targaryen", page: "Daenerys_Targaryen", universe: "Game of Thrones" },
  { name: "Tyrion Lannister", page: "Tyrion_Lannister", universe: "Game of Thrones" },
  { name: "Arya Stark", page: "Arya_Stark", universe: "Game of Thrones" },
  { name: "Tony Soprano", page: "Tony_Soprano", universe: "The Sopranos" },
  { name: "Dexter Morgan", page: "Dexter_Morgan", universe: "Dexter" },
  { name: "Sherlock Holmes", page: "Sherlock_Holmes", universe: "Sherlock" },
  { name: "Michael Scott", page: "Michael_Scott_(The_Office)", universe: "The Office" },
  { name: "Wednesday Addams", page: "Wednesday_Addams", universe: "Wednesday" },
  { name: "Homelander", page: "Homelander", universe: "The Boys" },
  { name: "Billy Butcher", page: "Billy_Butcher", universe: "The Boys" },
  { name: "Rick Sanchez", page: "Rick_Sanchez", universe: "Rick and Morty" },
  { name: "Daryl Dixon", page: "Daryl_Dixon", universe: "The Walking Dead" },
  { name: "Tommy Shelby", page: "Tommy_Shelby", universe: "Peaky Blinders" },
  { name: "Saul Goodman", page: "Saul_Goodman", universe: "Better Call Saul" },
  { name: "Spock", page: "Spock", universe: "Star Trek" },
];

type WikiSummary = {
  title: string;
  description: string | null;
  extract: string | null;
  thumbnail: { source: string } | null;
  originalimage: { source: string } | null;
  content_urls: { desktop?: { page?: string } } | null;
};

type WikiSearchResponse = {
  pages: Array<{
    id: number;
    key: string;
    title: string;
    description: string | null;
    excerpt: string | null;
    thumbnail: { url?: string } | null;
  }>;
};

type TvMazeShowSearch = Array<{
  score: number;
  show: { id: number; name: string; url: string };
}>;

type TvMazeCast = Array<{
  person: { id: number; name: string; image: { medium: string } | null };
  character: { id: number; name: string; image: { medium: string } | null };
}>;

const wikiHeaders = { "User-Agent": USER_AGENT, Accept: "application/json" };

function cap(text: string): string {
  return text.length > MAX_DESCRIPTION
    ? `${text.slice(0, MAX_DESCRIPTION).trimEnd()}…`
    : text;
}

/** "Breaking Bad character" -> "Breaking Bad"; "Fictional character" -> "". */
function universeFromDescription(description: string | null): string | null {
  if (!description) return null;
  const stripped = description.replace(/\s*character$/i, "").trim();
  if (!stripped || /^fictional$/i.test(stripped)) return null;
  return stripped;
}

function displayName(title: string): string {
  return title.replace(/\s*\([^)]*\)\s*$/, "").trim() || title.trim();
}

async function fetchSummary(page: string): Promise<WikiSummary | null> {
  try {
    return await fetchJson<WikiSummary>(
      `${WIKI_SUMMARY}${encodeURIComponent(page)}`,
      { headers: wikiHeaders, timeoutMs: 8000, retries: 1 },
    );
  } catch {
    return null;
  }
}

function mapSummary(
  summary: WikiSummary,
  overrides: { name?: string; universe?: string; page?: string } = {},
): Character {
  const page =
    overrides.page ??
    summary.content_urls?.desktop?.page?.split("/wiki/")[1] ??
    summary.title.replace(/\s/g, "_");

  return {
    id: characterId("shows", page),
    source: "shows",
    externalId: page,
    name: overrides.name ?? displayName(summary.title),
    universe:
      overrides.universe ??
      universeFromDescription(summary.description) ??
      "Television",
    imageUrl: summary.originalimage?.source ?? summary.thumbnail?.source ?? "",
    description: cap(summary.extract ?? ""),
    tags: ["TV"],
    externalUrl: summary.content_urls?.desktop?.page,
  };
}

async function seedToCharacter(entry: {
  name: string;
  page: string;
  universe: string;
}): Promise<Character | null> {
  const summary = await fetchSummary(entry.page);
  if (!summary) return null;
  return mapSummary(summary, {
    name: entry.name,
    universe: entry.universe,
    page: entry.page,
  });
}

async function tvMazeCharacters(
  query: string,
  limit: number,
): Promise<Character[]> {
  try {
    const results = await fetchJson<TvMazeShowSearch>(
      `${TVMAZE_SHOWS}?q=${encodeURIComponent(query)}`,
      { timeoutMs: 8000, retries: 1 },
    );
    const show = results[0]?.show;
    if (!show) return [];

    const cast = await fetchJson<TvMazeCast>(TVMAZE_CAST(show.id), {
      timeoutMs: 8000,
      retries: 1,
    });

    return cast.slice(0, limit).map((entry) => ({
      id: characterId("shows", `tvmaze:${show.id}:${entry.character.id}`),
      source: "shows" as const,
      externalId: `tvmaze:${show.id}:${entry.character.id}`,
      name: entry.character.name,
      universe: show.name,
      imageUrl:
        entry.character.image?.medium ?? entry.person.image?.medium ?? "",
      description: `${entry.character.name} is a character in ${show.name}, portrayed by ${entry.person.name}.`,
      tags: ["TV"],
      externalUrl: show.url,
    }));
  } catch {
    return [];
  }
}

async function wikiSearch(query: string, limit: number): Promise<Character[]> {
  try {
    const json = await fetchJson<WikiSearchResponse>(
      `${WIKI_SEARCH}?q=${encodeURIComponent(query)}&limit=${limit}`,
      { headers: wikiHeaders, timeoutMs: 8000, retries: 1 },
    );
    const summaries = await Promise.all(
      json.pages.slice(0, limit).map((page) => fetchSummary(page.key)),
    );
    return summaries
      .filter((summary): summary is WikiSummary => summary !== null)
      .map((summary) => mapSummary(summary));
  } catch {
    return [];
  }
}

function clampLimit(limit?: number): number {
  if (!limit || limit <= 0) return DEFAULT_LIMIT;
  return Math.min(limit, MAX_LIMIT);
}

function dedupe(characters: Character[], limit: number): Character[] {
  const seen = new Set<string>();
  const out: Character[] = [];
  for (const character of characters) {
    const key = character.name.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(character);
    if (out.length >= limit) break;
  }
  return out;
}

export const showsSource: CharacterSource = {
  source: "shows",
  label: "Shows",

  async list(limit) {
    const count = clampLimit(limit);
    const settled = await Promise.all(
      SEED.slice(0, count).map((entry) => seedToCharacter(entry)),
    );
    return settled.filter((c): c is Character => c !== null);
  },

  async search(query, limit) {
    const count = clampLimit(limit);
    const trimmed = query.trim();
    if (!trimmed) return this.list(count);

    const needle = trimmed.toLowerCase();
    const seeded = SEED.filter((entry) =>
      entry.name.toLowerCase().includes(needle),
    );

    // A curated hit is a strong signal; only reach for the (noisier, slower)
    // Wikipedia + TVMaze discovery when the seed knows nothing.
    if (seeded.length > 0) {
      const results = await Promise.all(
        seeded.slice(0, count).map((entry) => seedToCharacter(entry)),
      );
      return results.filter((c): c is Character => c !== null);
    }

    const [fromWiki, fromTvMaze] = await Promise.all([
      wikiSearch(trimmed, count),
      tvMazeCharacters(trimmed, count),
    ]);

    return dedupe([...fromWiki, ...fromTvMaze], count);
  },

  async get(externalId) {
    // TVMaze-only cast entries are not addressable; the DB cache covers them.
    if (externalId.startsWith("tvmaze:")) return null;
    const summary = await fetchSummary(externalId);
    return summary ? mapSummary(summary, { page: externalId }) : null;
  },
};
