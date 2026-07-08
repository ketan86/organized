import { and, eq } from "drizzle-orm";
import { getDb } from "@/db/client";
import { reminderDeliveries } from "@/db/schema";

export async function hasReminderBeenDelivered(
  userId: string,
  dedupeKey: string,
): Promise<boolean> {
  const db = getDb();
  const row = await db
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

export async function markReminderDelivered(
  userId: string,
  dedupeKey: string,
): Promise<void> {
  const db = getDb();
  await db
    .insert(reminderDeliveries)
    .values({ userId, dedupeKey })
    .onConflictDoNothing();
}
