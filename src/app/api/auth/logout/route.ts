import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { jsonError } from "@/server/api/errors";
import {
  SESSION_COOKIE,
  clearSessionCookieOptions,
  deleteAuthSession,
} from "@/server/auth/session";

export const runtime = "nodejs";

export async function POST() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE)?.value;
    if (token) {
      await deleteAuthSession(token);
    }
    const response = NextResponse.json({ ok: true });
    response.cookies.set(clearSessionCookieOptions());
    return response;
  } catch (error) {
    return jsonError(error, "Logout failed");
  }
}
