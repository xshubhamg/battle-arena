export const SOURCES = ["anime", "comics", "shows"] as const;

export type Source = (typeof SOURCES)[number];

export function isSource(value: unknown): value is Source {
  return (
    typeof value === "string" && (SOURCES as readonly string[]).includes(value)
  );
}

/** Normalized 0–100 attributes, mirroring the SuperHero API scale. */
export type Powerstats = {
  intelligence?: number;
  strength?: number;
  speed?: number;
  durability?: number;
  power?: number;
  combat?: number;
};

/**
 * The one shape every source returns. Sources only ever supply text and art —
 * Jev cannot see `imageUrl`, and `description` is what feeds the judge state.
 */
export type Character = {
  /** `"<source>:<externalId>"`. */
  id: string;
  source: Source;
  /** The id within the source (AniList id, SuperHero id, Wikipedia page key). */
  externalId: string;
  name: string;
  /** Series / publisher / show, used as the "from" line in the UI. */
  universe: string;
  imageUrl: string;
  description: string;
  stats?: Powerstats;
  tags?: string[];
  externalUrl?: string;
};

export type CharacterSummary = Pick<
  Character,
  "id" | "source" | "name" | "universe" | "imageUrl"
>;

export interface CharacterSource {
  source: Source;
  /** Human label for tabs and badges. */
  label: string;
  /** A default, browse-able set of characters. */
  list(limit?: number): Promise<Character[]>;
  /** Free-text search within this source. */
  search(query: string, limit?: number): Promise<Character[]>;
  get(externalId: string): Promise<Character | null>;
}

export function characterId(source: Source, externalId: string): string {
  return `${source}:${externalId}`;
}

export function parseCharacterId(
  id: string,
): { source: Source; externalId: string } | null {
  const index = id.indexOf(":");
  if (index === -1) return null;
  const source = id.slice(0, index);
  const externalId = id.slice(index + 1);
  if (!isSource(source) || externalId.length === 0) return null;
  return { source, externalId };
}
