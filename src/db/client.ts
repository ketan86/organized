import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import fs from "node:fs";
import path from "node:path";
import * as schema from "./schema";

const DEFAULT_DB_PATH = path.join(process.cwd(), "data", "organized.db");

function ensureDbDirectory(filePath: string): void {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function resolveLocalDbUrl(): string {
  const dbPath = process.env.DATABASE_URL ?? DEFAULT_DB_PATH;
  ensureDbDirectory(dbPath);
  return `file:${dbPath}`;
}

declare global {
  // eslint-disable-next-line no-var
  var __organizedDb: ReturnType<typeof drizzle<typeof schema>> | undefined;
}

export function getDb() {
  if (!globalThis.__organizedDb) {
    const tursoUrl = process.env.TURSO_DATABASE_URL;
    const client = createClient(
      tursoUrl
        ? {
            url: tursoUrl,
            authToken: process.env.TURSO_AUTH_TOKEN,
          }
        : { url: resolveLocalDbUrl() },
    );
    globalThis.__organizedDb = drizzle(client, { schema });
  }
  return globalThis.__organizedDb;
}
