import { NextResponse } from "next/server";
import type { UsualWeekBlock } from "@/lib/mock-data";
import { jsonError } from "@/server/api/errors";
import { requireSessionUserId } from "@/server/auth/session";
import { saveUsualWeek } from "@/server/repositories/bootstrap";

export const runtime = "nodejs";

export async function PUT(request: Request) {
  try {
    const userId = await requireSessionUserId();
    const body = (await request.json()) as { blocks: UsualWeekBlock[] };
    await saveUsualWeek(userId, body.blocks ?? []);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return jsonError(error, "Failed to save schedule");
  }
}
