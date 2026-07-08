import { eq } from "drizzle-orm";
import { getDb } from "@/db/client";
import { users } from "@/db/schema";
import { ApiError } from "@/server/api/errors";
import {
  createUserId,
  hashPassword,
  toPublicUser,
  type PublicUser,
} from "@/server/auth/session";
import { seedUserWorkspace } from "@/server/repositories/workspace";

export function getUserByEmail(email: string) {
  const db = getDb();
  return db
    .select()
    .from(users)
    .where(eq(users.email, email.toLowerCase().trim()))
    .get();
}

export function getUserById(userId: string) {
  const db = getDb();
  return db.select().from(users).where(eq(users.id, userId)).get();
}

export async function registerUser(
  email: string,
  password: string,
): Promise<PublicUser> {
  const normalized = email.toLowerCase().trim();
  if (!normalized.includes("@")) {
    throw new ApiError(400, "Valid email is required");
  }
  if (password.length < 8) {
    throw new ApiError(400, "Password must be at least 8 characters");
  }

  const existing = getUserByEmail(normalized);
  if (existing) {
    throw new ApiError(409, "An account with this email already exists");
  }

  const userId = createUserId();
  const passwordHash = await hashPassword(password);
  const db = getDb();

  db.insert(users).values({
    id: userId,
    email: normalized,
    passwordHash,
    onboardingComplete: false,
    timeWindow: "today",
  }).run();

  seedUserWorkspace(userId);

  const user = getUserById(userId);
  if (!user) {
    throw new ApiError(500, "Failed to create user");
  }
  return toPublicUser(user);
}
