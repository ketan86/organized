import { and, eq } from "drizzle-orm";
import { getDb } from "@/db/client";
import { reminderDeliveries } from "@/db/schema";

export function hasReminderBeenDelivered(
  userId: string,
  dedupeKey: string,
): boolean {
  const db = getDb();
  const row = db
    .select()
    .from(reminderDeliveries)
    .where(
      and(
        eq(reminderDeliveries.userId, userId),
        eq(reminderDeliveries.dedupeKey, dedupeKey),
      ),
    )
    .get();
  return Boolean(row);
}

export function markReminderDelivered(
  userId: string,
  dedupeKey: string,
): void {
  const db = getDb();
  db.insert(reminderDeliveries)
    .values({ userId, dedupeKey })
    .onConflictDoNothing()
    .run();
}
