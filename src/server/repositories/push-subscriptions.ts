import { randomUUID } from "node:crypto";
import { and, eq } from "drizzle-orm";
import { getDb } from "@/db/client";
import { pushSubscriptions } from "@/db/schema";

export type PushSubscriptionInput = {
  endpoint: string;
  keys: { p256dh: string; auth: string };
  userAgent?: string;
};

export async function upsertPushSubscription(
  userId: string,
  input: PushSubscriptionInput,
): Promise<void> {
  const db = getDb();
  const existing = await db
    .select()
    .from(pushSubscriptions)
    .where(eq(pushSubscriptions.endpoint, input.endpoint))
    .get();

  if (existing) {
    await db
      .update(pushSubscriptions)
      .set({
        userId,
        p256dh: input.keys.p256dh,
        auth: input.keys.auth,
        userAgent: input.userAgent ?? null,
      })
      .where(eq(pushSubscriptions.endpoint, input.endpoint));
    return;
  }

  await db.insert(pushSubscriptions).values({
    id: randomUUID(),
    userId,
    endpoint: input.endpoint,
    p256dh: input.keys.p256dh,
    auth: input.keys.auth,
    userAgent: input.userAgent ?? null,
  });
}

export async function deletePushSubscription(
  userId: string,
  endpoint: string,
): Promise<void> {
  const db = getDb();
  await db
    .delete(pushSubscriptions)
    .where(
      and(
        eq(pushSubscriptions.userId, userId),
        eq(pushSubscriptions.endpoint, endpoint),
      ),
    );
}

export async function listPushSubscriptionsForUser(userId: string) {
  const db = getDb();
  return db
    .select()
    .from(pushSubscriptions)
    .where(eq(pushSubscriptions.userId, userId))
    .all();
}
