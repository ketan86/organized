import { NextResponse } from "next/server";
import { jsonError } from "@/server/api/errors";
import { requireSessionUserId } from "@/server/auth/session";
import { getVapidPublicKey } from "@/server/notifications/vapid";

export const runtime = "nodejs";

export async function GET() {
  try {
    await requireSessionUserId();
    const publicKey = getVapidPublicKey();
    return NextResponse.json({
      configured: Boolean(publicKey),
      publicKey,
    });
  } catch (error) {
    return jsonError(error, "Failed to load push configuration");
  }
}
