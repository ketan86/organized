import { randomUUID } from "node:crypto";
import { and, eq } from "drizzle-orm";
import { getDb } from "@/db/client";
import { pushSubscriptions } from "@/db/schema";

export type PushSubscriptionInput = {
  endpoint: string;
  keys: { p256dh: string; auth: string };
  userAgent?: string;
};

export function upsertPushSubscription(
  userId: string,
  input: PushSubscriptionInput,
): void {
  const db = getDb();
  const existing = db
    .select()
    .from(pushSubscriptions)
    .where(eq(pushSubscriptions.endpoint, input.endpoint))
    .get();

  if (existing) {
    db.update(pushSubscriptions)
      .set({
        userId,
        p256dh: input.keys.p256dh,
        auth: input.keys.auth,
        userAgent: input.userAgent ?? null,
      })
      .where(eq(pushSubscriptions.endpoint, input.endpoint))
      .run();
    return;
  }

  db.insert(pushSubscriptions)
    .values({
      id: randomUUID(),
      userId,
      endpoint: input.endpoint,
      p256dh: input.keys.p256dh,
      auth: input.keys.auth,
      userAgent: input.userAgent ?? null,
    })
    .run();
}

export function deletePushSubscription(userId: string, endpoint: string): void {
  const db = getDb();
  db.delete(pushSubscriptions)
    .where(
      and(
        eq(pushSubscriptions.userId, userId),
        eq(pushSubscriptions.endpoint, endpoint),
      ),
    )
    .run();
}

export function listPushSubscriptionsForUser(userId: string) {
  const db = getDb();
  return db
    .select()
    .from(pushSubscriptions)
    .where(eq(pushSubscriptions.userId, userId))
    .all();
}
