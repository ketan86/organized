import { NextResponse } from "next/server";
import { jsonError } from "@/server/api/errors";
import { requireSessionUserId } from "@/server/auth/session";
import {
  listSessions,
  startTracking,
  type StartTrackingInput,
} from "@/server/repositories/tracking-sessions";

export const runtime = "nodejs";

export async function GET() {
  try {
    const userId = await requireSessionUserId();
    const sessions = await listSessions(userId);
    return NextResponse.json({ sessions });
  } catch (error) {
    return jsonError(error, "Failed to list sessions");
  }
}

export async function POST(request: Request) {
  try {
    const userId = await requireSessionUserId();
    const body = (await request.json()) as StartTrackingInput;
    const sessions = await startTracking(userId, body);
    return NextResponse.json({ sessions }, { status: 201 });
  } catch (error) {
    return jsonError(error, "Failed to start tracking");
  }
}
