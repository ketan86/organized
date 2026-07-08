import { NextResponse } from "next/server";
import { jsonError } from "@/server/api/errors";
import {
  createAuthSession,
  sessionCookieOptions,
} from "@/server/auth/session";
import { registerUser } from "@/server/repositories/users";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      email?: string;
      password?: string;
    };
    if (!body.email || !body.password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 },
      );
    }

    const user = await registerUser(body.email, body.password);
    const token = await createAuthSession(user.id);
    const response = NextResponse.json({ user });
    response.cookies.set(sessionCookieOptions(token));
    return response;
  } catch (error) {
    return jsonError(error, "Registration failed");
  }
}
