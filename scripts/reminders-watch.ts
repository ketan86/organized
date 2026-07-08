/**
 * Local background reminder dispatcher (for when the app tab is fully closed).
 * Run alongside `npm run dev` in a second terminal.
 */
import { eq } from "drizzle-orm";
import { getDb } from "../src/db/client";
import { users } from "../src/db/schema";
import { dispatchDueReminders } from "../src/server/notifications/dispatch";

async function tick() {
  const db = getDb();
  const allUsers = db.select({ id: users.id }).from(users).all();
  const now = new Date();
  let total = 0;

  for (const user of allUsers) {
    const result = await dispatchDueReminders(user.id, now);
    total += result.dispatched;
  }

  if (total > 0) {
    console.log(
      `[reminders] dispatched ${total} at ${now.toLocaleString()}`,
    );
  }
}

console.log("Reminder watch running (checks every 30s)…");
void tick();
setInterval(() => {
  void tick();
}, 30_000);
