import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema";
import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";

const globalForDb = globalThis as typeof globalThis & { __demoSqlite?: Database.Database; __demoDrizzle?: ReturnType<typeof drizzle<typeof schema>> };

function openDatabase() {
  if (globalForDb.__demoSqlite && globalForDb.__demoDrizzle) return { sqlite: globalForDb.__demoSqlite, db: globalForDb.__demoDrizzle };
  const filename = process.env.DATABASE_PATH ?? "/data/demo.sqlite";
  if (filename !== ":memory:") mkdirSync(dirname(resolve(filename)), { recursive: true });
  const sqlite = new Database(filename, { timeout: 5000 });
  sqlite.pragma("journal_mode = WAL");
  sqlite.pragma("busy_timeout = 5000");
  sqlite.exec(`CREATE TABLE IF NOT EXISTS demo_states (
    user_id TEXT PRIMARY KEY NOT NULL,
    state TEXT NOT NULL,
    version INTEGER NOT NULL DEFAULT 1,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`);
  const db = drizzle({ client: sqlite, schema });
  globalForDb.__demoSqlite = sqlite;
  globalForDb.__demoDrizzle = db;
  return { sqlite, db };
}

export function getDb() { return openDatabase().db; }
