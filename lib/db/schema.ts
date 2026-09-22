import { integer, real, sqliteTable, text } from "drizzle-orm/sqlite-core";

/** Cached, normalized characters. JSON columns are serialized blobs. */
export const characters = sqliteTable("characters", {
  id: text("id").primaryKey(),
  source: text("source").notNull(),
  externalId: text("external_id").notNull(),
  name: text("name").notNull(),
  universe: text("universe").notNull(),
  imageUrl: text("image_url").notNull().default(""),
  description: text("description").notNull().default(""),
  stats: text("stats"),
  tags: text("tags"),
  externalUrl: text("external_url"),
  fetchedAt: integer("fetched_at").notNull(),
});

/**
 * One judged battle. `verdict` holds the full typed payload so history stays
 * complete even as the verdict shape evolves.
 */
export const battles = sqliteTable("battles", {
  id: text("id").primaryKey(),
  fighterAId: text("fighter_a_id").notNull(),
  fighterBId: text("fighter_b_id").notNull(),
  winner: text("winner"),
  edge: real("edge"),
  model: text("model"),
  verdict: text("verdict").notNull(),
  createdAt: integer("created_at").notNull(),
});
