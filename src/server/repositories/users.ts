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

export async function getUserByEmail(email: string) {
  const db = getDb();
  return db
    .select()
    .from(users)
    .where(eq(users.email, email.toLowerCase().trim()))
    .get();
}

export async function getUserById(userId: string) {
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

  const existing = await getUserByEmail(normalized);
  if (existing) {
    throw new ApiError(409, "An account with this email already exists");
  }

  const userId = createUserId();
  const passwordHash = await hashPassword(password);
  const db = getDb();

  await db.insert(users).values({
    id: userId,
    email: normalized,
    passwordHash,
    onboardingComplete: false,
    timeWindow: "today",
  });

  await seedUserWorkspace(userId);

  const user = await getUserById(userId);
  if (!user) {
    throw new ApiError(500, "Failed to create user");
  }
  return toPublicUser(user);
}
