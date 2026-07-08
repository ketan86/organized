import { NextResponse } from "next/server";
import { z } from "zod";
import { jsonError } from "@/server/api/errors";
import { requireSessionUserId } from "@/server/auth/session";
import { upsertPushSubscription } from "@/server/repositories/push-subscriptions";

export const runtime = "nodejs";

const bodySchema = z.object({
  endpoint: z.string().min(1),
  keys: z.object({
    p256dh: z.string().min(1),
    auth: z.string().min(1),
  }),
});

export async function POST(request: Request) {
  try {
    const userId = await requireSessionUserId();
    const body = bodySchema.parse(await request.json());
    await upsertPushSubscription(userId, {
      endpoint: body.endpoint,
      keys: body.keys,
      userAgent: request.headers.get("user-agent") ?? undefined,
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return jsonError(error, "Failed to save push subscription");
  }
}
