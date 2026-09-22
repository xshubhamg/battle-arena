import "server-only";

import { mkdirSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname } from "node:path";

import { and, desc, eq, sql, type InferSelectModel } from "drizzle-orm";
import type { BunSQLiteDatabase } from "drizzle-orm/bun-sqlite";

import type { Character, Source } from "@/lib/sources/types";

import * as schema from "./schema";
import type { PersistedBattle, Store } from "./store";

type CharacterRow = InferSelectModel<typeof schema.characters>;
type BattleRowDb = InferSelectModel<typeof schema.battles>;
type Db = BunSQLiteDatabase<typeof schema>;

// Names are assembled at runtime so no bundler tries to resolve these
// Bun-only modules into the Vercel/Node build. `bun:sqlite` does not exist on
// Node; loading it is guarded by the `typeof Bun` check below.
const SQLITE_SPECIFIER = ["bun", "sqlite"].join(":");
const DRIZZLE_SPECIFIER = ["drizzle-orm", "bun-sqlite"].join("/");

function runtimeRequire(specifier: string): unknown {
  const require = createRequire(import.meta.url);
  return require(specifier);
}

type BunDrivers = {
  Database: typeof import("bun:sqlite").Database;
  drizzle: typeof import("drizzle-orm/bun-sqlite").drizzle;
};

function loadBunDrivers(): BunDrivers | null {
  if (typeof Bun === "undefined") return null;
  try {
    const sqlite = runtimeRequire(SQLITE_SPECIFIER) as typeof import("bun:sqlite");
    const drizzleModule = runtimeRequire(
      DRIZZLE_SPECIFIER,
    ) as typeof import("drizzle-orm/bun-sqlite");
    return { Database: sqlite.Database, drizzle: drizzleModule.drizzle };
  } catch {
    return null;
  }
}

/** Idempotent schema, run on first connection. */
const MIGRATIONS = [
  `CREATE TABLE IF NOT EXISTS characters (
     id TEXT PRIMARY KEY,
     source TEXT NOT NULL,
     external_id TEXT NOT NULL,
     name TEXT NOT NULL,
     universe TEXT NOT NULL,
     image_url TEXT NOT NULL DEFAULT '',
     description TEXT NOT NULL DEFAULT '',
     stats TEXT,
     tags TEXT,
     external_url TEXT,
     fetched_at INTEGER NOT NULL
   )`,
  `CREATE INDEX IF NOT EXISTS characters_source_name_idx
     ON characters (source, name)`,
  `CREATE TABLE IF NOT EXISTS battles (
     id TEXT PRIMARY KEY,
     fighter_a_id TEXT NOT NULL,
     fighter_b_id TEXT NOT NULL,
     winner TEXT,
     edge REAL,
     model TEXT,
     verdict TEXT NOT NULL,
     created_at INTEGER NOT NULL
   )`,
  `CREATE INDEX IF NOT EXISTS battles_created_at_idx
     ON battles (created_at DESC)`,
];

function parseJson<T>(value: string | null): T | undefined {
  if (!value) return undefined;
  try {
    return JSON.parse(value) as T;
  } catch {
    return undefined;
  }
}

function toCharacter(row: CharacterRow): Character {
  return {
    id: row.id,
    source: row.source as Source,
    externalId: row.externalId,
    name: row.name,
    universe: row.universe,
    imageUrl: row.imageUrl,
    description: row.description,
    stats: parseJson<Character["stats"]>(row.stats),
    tags: parseJson<string[]>(row.tags),
    externalUrl: row.externalUrl ?? undefined,
  };
}

function toRow(character: Character): CharacterRow {
  return {
    id: character.id,
    source: character.source,
    externalId: character.externalId,
    name: character.name,
    universe: character.universe,
    imageUrl: character.imageUrl,
    description: character.description,
    stats: character.stats ? JSON.stringify(character.stats) : null,
    tags: character.tags?.length ? JSON.stringify(character.tags) : null,
    externalUrl: character.externalUrl ?? null,
    fetchedAt: Date.now(),
  };
}

function toBattle(row: BattleRowDb): PersistedBattle {
  return {
    id: row.id,
    fighterAId: row.fighterAId,
    fighterBId: row.fighterBId,
    winner: row.winner,
    edge: row.edge,
    model: row.model,
    verdict: parseJson<unknown>(row.verdict),
    createdAt: row.createdAt,
  };
}

/**
 * The `bun:sqlite` backend. Returns `null` when Bun's sqlite is unavailable so
 * the caller can fall back to the in-memory store.
 */
export function createSqliteStore(): Store | null {
  const drivers = loadBunDrivers();
  if (!drivers) return null;

  const path = process.env.DATABASE_PATH ?? "./data/battle-arena.db";
  try {
    if (path !== ":memory:") mkdirSync(dirname(path), { recursive: true });

    const sqlite = new drivers.Database(path, { create: true });
    sqlite.run("PRAGMA journal_mode = WAL;");
    sqlite.run("PRAGMA foreign_keys = ON;");
    for (const statement of MIGRATIONS) sqlite.run(statement);

    const db: Db = drivers.drizzle(sqlite, { schema });

    return {
      async saveCharacters(list) {
        if (list.length === 0) return;
        db.insert(schema.characters)
          .values(list.map(toRow))
          .onConflictDoUpdate({
            target: schema.characters.id,
            set: {
              name: sql`excluded.name`,
              universe: sql`excluded.universe`,
              imageUrl: sql`excluded.image_url`,
              description: sql`excluded.description`,
              stats: sql`excluded.stats`,
              tags: sql`excluded.tags`,
              externalUrl: sql`excluded.external_url`,
              fetchedAt: sql`excluded.fetched_at`,
            },
          })
          .run();
      },

      async getCharacter(id) {
        const row = db
          .select()
          .from(schema.characters)
          .where(eq(schema.characters.id, id))
          .get();
        return row ? toCharacter(row) : null;
      },

      async listCachedCharacters(source, limit) {
        const rows = db
          .select()
          .from(schema.characters)
          .where(eq(schema.characters.source, source))
          .orderBy(schema.characters.name)
          .limit(limit)
          .all();
        return rows.map(toCharacter);
      },

      async saveBattle(battle) {
        db.insert(schema.battles)
          .values({
            id: battle.id,
            fighterAId: battle.fighterAId,
            fighterBId: battle.fighterBId,
            winner: battle.winner,
            edge: battle.edge,
            model: battle.model,
            verdict: JSON.stringify(battle.verdict),
            createdAt: battle.createdAt,
          })
          .onConflictDoNothing()
          .run();
      },

      async findBattleByPairing(fighterAId, fighterBId) {
        const row = db
          .select()
          .from(schema.battles)
          .where(
            and(
              eq(schema.battles.fighterAId, fighterAId),
              eq(schema.battles.fighterBId, fighterBId),
            ),
          )
          .orderBy(desc(schema.battles.createdAt))
          .get();
        return row ? toBattle(row) : null;
      },

      async listBattles(limit) {
        const rows = db
          .select()
          .from(schema.battles)
          .orderBy(desc(schema.battles.createdAt))
          .limit(limit)
          .all();
        return rows.map(toBattle);
      },

      async getBattle(id) {
        const row = db
          .select()
          .from(schema.battles)
          .where(eq(schema.battles.id, id))
          .get();
        return row ? toBattle(row) : null;
      },
    };
  } catch (error) {
    console.warn("SQLite store unavailable, falling back to memory:", error);
    return null;
  }
}
