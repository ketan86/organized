/**
 * Local background reminder dispatcher (for when the app tab is fully closed).
 * Run alongside `npm run dev` in a second terminal.
 */
import { dispatchDueRemindersForAllUsers } from "../src/server/notifications/dispatch";

async function tick() {
  const now = new Date();
  const result = await dispatchDueRemindersForAllUsers(now);

  if (result.dispatched > 0) {
    console.log(
      `[reminders] dispatched ${result.dispatched} at ${now.toLocaleString()}`,
    );
  }
}

console.log("Reminder watch running (checks every 30s)…");
void tick();
setInterval(() => {
  void tick();
}, 30_000);
