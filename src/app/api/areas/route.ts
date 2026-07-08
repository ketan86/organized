import { NextResponse } from "next/server";
import type { AreasSetupInput } from "@/server/repositories/bootstrap";
import { jsonError } from "@/server/api/errors";
import { requireSessionUserId } from "@/server/auth/session";
import { saveAreasSetup } from "@/server/repositories/bootstrap";

export const runtime = "nodejs";

export async function PUT(request: Request) {
  try {
    const userId = await requireSessionUserId();
    const body = (await request.json()) as AreasSetupInput;
    saveAreasSetup(userId, body);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return jsonError(error, "Failed to save areas");
  }
}
