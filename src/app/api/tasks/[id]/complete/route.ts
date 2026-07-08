import { NextResponse } from "next/server";
import { jsonError } from "@/server/api/errors";
import { requireSessionUserId } from "@/server/auth/session";
import { completeTask } from "@/server/repositories/tasks";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: RouteContext) {
  try {
    const userId = await requireSessionUserId();
    const { id } = await context.params;
    const body = (await request.json().catch(() => ({}))) as {
      occurrenceDate?: string;
    };
    const task = await completeTask(userId, id, body.occurrenceDate);
    return NextResponse.json({ task });
  } catch (error) {
    return jsonError(error, "Failed to complete task");
  }
}
