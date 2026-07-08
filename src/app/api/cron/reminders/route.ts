import { NextResponse } from "next/server";
import { jsonError } from "@/server/api/errors";
import { dispatchDueRemindersForAllUsers } from "@/server/notifications/dispatch";

export const runtime = "nodejs";

function isAuthorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;

  const auth = request.headers.get("authorization");
  if (auth === `Bearer ${secret}`) return true;

  return request.headers.get("x-cron-secret") === secret;
}

export async function GET(request: Request) {
  try {
    if (!isAuthorized(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const result = await dispatchDueRemindersForAllUsers(new Date());
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    return jsonError(error, "Cron reminder dispatch failed");
  }
}

export async function POST(request: Request) {
  return GET(request);
}
