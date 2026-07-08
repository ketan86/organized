import { NextResponse } from "next/server";
import { jsonError } from "@/server/api/errors";
import { requireSessionUserId } from "@/server/auth/session";
import { dispatchDueReminders } from "@/server/notifications/dispatch";

export const runtime = "nodejs";

export async function POST() {
  try {
    const userId = await requireSessionUserId();
    const result = await dispatchDueReminders(userId, new Date());
    return NextResponse.json(result);
  } catch (error) {
    return jsonError(error, "Failed to dispatch reminders");
  }
}
