import { createHash, randomBytes, randomUUID } from "node:crypto";
import bcrypt from "bcryptjs";
import { and, eq, gt } from "drizzle-orm";
import { cookies } from "next/headers";
import { getDb } from "@/db/client";
import { authSessions, users } from "@/db/schema";
import { ApiError } from "@/server/api/errors";

export const SESSION_COOKIE = "organized_session";
const SESSION_MS = 1000 * 60 * 60 * 24 * 30;

export type PublicUser = {
  id: string;
  email: string;
  onboardingComplete: boolean;
};

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(
  password: string,
  passwordHash: string,
): Promise<boolean> {
  return bcrypt.compare(password, passwordHash);
}

export function createSessionToken(): string {
  return randomBytes(32).toString("base64url");
}

export function createUserId(): string {
  return randomUUID();
}

export function createAuthSessionId(): string {
  return randomUUID();
}

export async function createAuthSession(userId: string): Promise<string> {
  const db = getDb();
  const token = createSessionToken();
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + SESSION_MS);

  db.insert(authSessions).values({
    id: createAuthSessionId(),
    userId,
    tokenHash,
    expiresAt,
  }).run();

  return token;
}

export async function deleteAuthSession(token: string): Promise<void> {
  const db = getDb();
  db.delete(authSessions)
    .where(eq(authSessions.tokenHash, hashToken(token)))
    .run();
}

export async function getUserIdFromToken(
  token: string | undefined,
): Promise<string | null> {
  if (!token) return null;
  const db = getDb();
  const row = db
    .select()
    .from(authSessions)
    .where(
      and(
        eq(authSessions.tokenHash, hashToken(token)),
        gt(authSessions.expiresAt, new Date()),
      ),
    )
    .get();
  return row?.userId ?? null;
}

export async function getSessionUserId(): Promise<string | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  return getUserIdFromToken(token);
}

export async function requireSessionUserId(): Promise<string> {
  const userId = await getSessionUserId();
  if (!userId) {
    throw new ApiError(401, "Authentication required");
  }
  return userId;
}

export function toPublicUser(row: typeof users.$inferSelect): PublicUser {
  return {
    id: row.id,
    email: row.email,
    onboardingComplete: row.onboardingComplete,
  };
}

export function sessionCookieOptions(token: string) {
  return {
    name: SESSION_COOKIE,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: SESSION_MS / 1000,
  };
}

export function clearSessionCookieOptions() {
  return {
    name: SESSION_COOKIE,
    value: "",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: 0,
  };
}
