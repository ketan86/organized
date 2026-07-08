import { NextResponse } from "next/server";
import { jsonError } from "@/server/api/errors";
import { requireSessionUserId } from "@/server/auth/session";
import {
  deleteTask,
  updateTask,
  type UpdateTaskInput,
} from "@/server/repositories/tasks";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const userId = await requireSessionUserId();
    const { id } = await context.params;
    const body = (await request.json()) as UpdateTaskInput;
    const task = await updateTask(userId, id, body);
    return NextResponse.json({ task });
  } catch (error) {
    return jsonError(error, "Failed to update task");
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const userId = await requireSessionUserId();
    const { id } = await context.params;
    await deleteTask(userId, id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return jsonError(error, "Failed to delete task");
  }
}
