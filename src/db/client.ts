import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import fs from "node:fs";
import path from "node:path";
import * as schema from "./schema";

const DEFAULT_DB_PATH = path.join(process.cwd(), "data", "organized.db");

function resolveDbPath(): string {
  return process.env.DATABASE_URL ?? DEFAULT_DB_PATH;
}

function ensureDbDirectory(filePath: string): void {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

declare global {
  // eslint-disable-next-line no-var
  var __organizedSqlite: Database.Database | undefined;
  // eslint-disable-next-line no-var
  var __organizedDb: ReturnType<typeof drizzle<typeof schema>> | undefined;
}

export function getDb() {
  if (!globalThis.__organizedDb) {
    const dbPath = resolveDbPath();
    ensureDbDirectory(dbPath);
    const sqlite = new Database(dbPath);
    sqlite.pragma("journal_mode = WAL");
    sqlite.pragma("foreign_keys = ON");
    globalThis.__organizedSqlite = sqlite;
    globalThis.__organizedDb = drizzle(sqlite, { schema });
  }
  return globalThis.__organizedDb;
}

export function getSqlite(): Database.Database {
  getDb();
  return globalThis.__organizedSqlite!;
}
