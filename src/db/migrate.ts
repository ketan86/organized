import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import path from "node:path";
import { getDb } from "./client";

const db = getDb();
const migrationsFolder = path.join(process.cwd(), "drizzle");

migrate(db, { migrationsFolder });

console.log("Migrations applied.");
