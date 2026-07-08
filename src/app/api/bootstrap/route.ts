import { NextResponse } from "next/server";
import { jsonError } from "@/server/api/errors";
import { requireSessionUserId } from "@/server/auth/session";
import { loadBootstrap } from "@/server/repositories/bootstrap";

export const runtime = "nodejs";

export async function GET() {
  try {
    const userId = await requireSessionUserId();
    const data = await loadBootstrap(userId);
    return NextResponse.json(data);
  } catch (error) {
    return jsonError(error, "Failed to load application state");
  }
}
