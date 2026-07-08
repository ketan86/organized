import { NextResponse } from "next/server";
import { jsonError } from "@/server/api/errors";
import {
  getSessionUserId,
  toPublicUser,
} from "@/server/auth/session";
import { getUserById } from "@/server/repositories/users";

export const runtime = "nodejs";

export async function GET() {
  try {
    const userId = await getSessionUserId();
    if (!userId) {
      return NextResponse.json({ user: null });
    }
    const user = getUserById(userId);
    if (!user) {
      return NextResponse.json({ user: null });
    }
    return NextResponse.json({ user: toPublicUser(user) });
  } catch (error) {
    return jsonError(error, "Failed to read session");
  }
}
