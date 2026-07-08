import { NextResponse } from "next/server";
import { jsonError } from "@/server/api/errors";
import { requireSessionUserId } from "@/server/auth/session";
import {
  createTask,
  type CreateTaskInput,
} from "@/server/repositories/tasks";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const userId = await requireSessionUserId();
    const body = (await request.json()) as CreateTaskInput;
    const task = createTask(userId, body);
    return NextResponse.json({ task }, { status: 201 });
  } catch (error) {
    return jsonError(error, "Failed to create task");
  }
}
