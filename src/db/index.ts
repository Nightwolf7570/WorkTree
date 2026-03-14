import { env } from "../config/env.js";

const isSQLite = env.DATABASE_URL.startsWith("sqlite:");

let db: any;
let schema: any;

if (isSQLite) {
  const Database = (await import("better-sqlite3")).default;
  const { drizzle } = await import("drizzle-orm/better-sqlite3");
  const sqliteSchema = await import("./schema.sqlite.js");

  const dbPath = env.DATABASE_URL.replace(/^sqlite:/, "");
  const client = new Database(dbPath);
  client.pragma("journal_mode = WAL");
  client.pragma("foreign_keys = ON");

  db = drizzle(client, { schema: sqliteSchema });
  schema = sqliteSchema;
} else {
  const { default: postgres } = await import("postgres");
  const { drizzle } = await import("drizzle-orm/postgres-js");
  const pgSchema = await import("./schema.js");

  const client = postgres(env.DATABASE_URL);
  db = drizzle(client, { schema: pgSchema });
  schema = pgSchema;
}

export { db, schema };
export type Database = typeof db;
