import { randomUUID } from "node:crypto";
import { and, eq, isNull } from "drizzle-orm";
import { getDb } from "@/db/client";
import { sessions } from "@/db/schema";
import type { Session } from "@/lib/mock-data";
import { ApiError } from "@/server/api/errors";
import { mapSessionRow } from "@/server/repositories/mappers";

export type StartTrackingInput = {
  targetType: "area" | "task";
  targetId: string;
  areaId: string;
};

async function stopRunningSessions(userId: string, endedAt: Date): Promise<void> {
  const db = getDb();
  await db
    .update(sessions)
    .set({ endedAt })
    .where(and(eq(sessions.userId, userId), isNull(sessions.endedAt)));
}

export async function listSessions(userId: string): Promise<Session[]> {
  const db = getDb();
  const rows = await db
    .select()
    .from(sessions)
    .where(eq(sessions.userId, userId))
    .all();
  return rows.map(mapSessionRow);
}

export async function startTracking(
  userId: string,
  input: StartTrackingInput,
): Promise<Session[]> {
  const now = new Date();
  const db = getDb();

  await db.transaction(async (tx) => {
    await tx
      .update(sessions)
      .set({ endedAt: now })
      .where(and(eq(sessions.userId, userId), isNull(sessions.endedAt)));

    await tx.insert(sessions).values({
      id: `session-${randomUUID()}`,
      userId,
      targetType: input.targetType,
      targetId: input.targetId,
      areaId: input.areaId,
      startedAt: now,
      endedAt: null,
    });
  });

  return listSessions(userId);
}

export async function stopTracking(userId: string): Promise<Session[]> {
  await stopRunningSessions(userId, new Date());
  return listSessions(userId);
}

export async function getRunningSession(userId: string): Promise<Session | null> {
  const db = getDb();
  const row = await db
    .select()
    .from(sessions)
    .where(and(eq(sessions.userId, userId), isNull(sessions.endedAt)))
    .get();
  return row ? mapSessionRow(row) : null;
}

export async function stopSessionById(
  userId: string,
  sessionId: string,
): Promise<Session> {
  const db = getDb();
  const row = await db
    .select()
    .from(sessions)
    .where(and(eq(sessions.id, sessionId), eq(sessions.userId, userId)))
    .get();
  if (!row) throw new ApiError(404, "Session not found");

  const endedAt = new Date();
  await db
    .update(sessions)
    .set({ endedAt })
    .where(and(eq(sessions.id, sessionId), eq(sessions.userId, userId)));

  return mapSessionRow({ ...row, endedAt });
}
