import { migrate } from "drizzle-orm/libsql/migrator";
import path from "node:path";
import { getDb } from "./client";

async function main() {
  const db = getDb();
  const migrationsFolder = path.join(process.cwd(), "drizzle");
  await migrate(db, { migrationsFolder });
  console.log("Migrations applied.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
