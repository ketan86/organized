import webpush from "web-push";
import { ensureWebPushConfigured } from "@/server/notifications/vapid";
import type { pushSubscriptions } from "@/db/schema";

export type PushPayload = {
  title: string;
  body: string;
  url?: string;
  taskId?: string;
  areaId?: string;
  kind?: "task" | "area-boundary";
};

export async function sendPushToSubscription(
  subscription: typeof pushSubscriptions.$inferSelect,
  payload: PushPayload,
): Promise<void> {
  ensureWebPushConfigured();
  await webpush.sendNotification(
    {
      endpoint: subscription.endpoint,
      keys: {
        p256dh: subscription.p256dh,
        auth: subscription.auth,
      },
    },
    JSON.stringify(payload),
  );
}
