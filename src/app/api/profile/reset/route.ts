import { NextResponse } from "next/server";
import { jsonError } from "@/server/api/errors";
import { requireSessionUserId } from "@/server/auth/session";
import { resetUserWorkspace } from "@/server/repositories/workspace";

export const runtime = "nodejs";

export async function POST() {
  try {
    const userId = await requireSessionUserId();
    resetUserWorkspace(userId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return jsonError(error, "Failed to reset workspace");
  }
}
