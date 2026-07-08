import { NextResponse } from "next/server";
import type { IntentId, TimeWindow } from "@/lib/mock-data";
import { jsonError } from "@/server/api/errors";
import { requireSessionUserId } from "@/server/auth/session";
import { updateProfile } from "@/server/repositories/bootstrap";

export const runtime = "nodejs";

export async function PATCH(request: Request) {
  try {
    const userId = await requireSessionUserId();
    const body = (await request.json()) as {
      intents?: IntentId[];
      timeWindow?: TimeWindow;
      onboardingComplete?: boolean;
    };
    updateProfile(userId, body);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return jsonError(error, "Failed to update profile");
  }
}
