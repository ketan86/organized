import { NextResponse } from "next/server";
import { z } from "zod";
import { jsonError } from "@/server/api/errors";
import { requireSessionUserId } from "@/server/auth/session";
import { deletePushSubscription } from "@/server/repositories/push-subscriptions";

export const runtime = "nodejs";

const bodySchema = z.object({
  endpoint: z.string().min(1),
});

export async function DELETE(request: Request) {
  try {
    const userId = await requireSessionUserId();
    const body = bodySchema.parse(await request.json());
    deletePushSubscription(userId, body.endpoint);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return jsonError(error, "Failed to remove push subscription");
  }
}
