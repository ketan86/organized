import { migrate } from "drizzle-orm/libsql/migrator";
import path from "node:path";
import { assertDatabaseConfig, getDb } from "./client";

async function main() {
  console.log("Running database migrations…");
  assertDatabaseConfig();
  const db = getDb();
  const migrationsFolder = path.join(process.cwd(), "drizzle");
  await migrate(db, { migrationsFolder });
  console.log("Migrations applied.");
}

main().catch((error) => {
  console.error("Database migration failed:");
  console.error(error);
  process.exit(1);
});
