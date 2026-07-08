import { NextResponse } from "next/server";
import { jsonError } from "@/server/api/errors";
import { requireSessionUserId } from "@/server/auth/session";
import { stopTracking } from "@/server/repositories/tracking-sessions";

export const runtime = "nodejs";

export async function POST() {
  try {
    const userId = await requireSessionUserId();
    const sessions = await stopTracking(userId);
    return NextResponse.json({ sessions });
  } catch (error) {
    return jsonError(error, "Failed to stop tracking");
  }
}
