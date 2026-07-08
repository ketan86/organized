import { NextResponse } from "next/server";
import { jsonError } from "@/server/api/errors";
import {
  createAuthSession,
  sessionCookieOptions,
  verifyPassword,
} from "@/server/auth/session";
import { getUserByEmail } from "@/server/repositories/users";

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

    const user = await getUserByEmail(body.email);
    if (!user) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 },
      );
    }

    const valid = await verifyPassword(body.password, user.passwordHash);
    if (!valid) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 },
      );
    }

    const token = await createAuthSession(user.id);
    const response = NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        onboardingComplete: user.onboardingComplete,
      },
    });
    response.cookies.set(sessionCookieOptions(token));
    return response;
  } catch (error) {
    return jsonError(error, "Login failed");
  }
}
