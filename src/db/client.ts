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

export function assertDatabaseConfig(): void {
  if (!process.env.VERCEL) return;

  const url = process.env.TURSO_DATABASE_URL?.trim();
  const token = process.env.TURSO_AUTH_TOKEN?.trim();

  if (!url || !token) {
    throw new Error(
      "On Vercel, set TURSO_DATABASE_URL and TURSO_AUTH_TOKEN under Project Settings → Environment Variables (enable Production + Build), then redeploy.",
    );
  }

  if (!url.startsWith("libsql://")) {
    throw new Error(
      `TURSO_DATABASE_URL must start with libsql:// (not https://). Run: turso db show organized --url`,
    );
  }
}

declare global {
  // eslint-disable-next-line no-var
  var __organizedDb: ReturnType<typeof drizzle<typeof schema>> | undefined;
}

export function getDb() {
  if (!globalThis.__organizedDb) {
    assertDatabaseConfig();
    const tursoUrl = process.env.TURSO_DATABASE_URL?.trim();
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
