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

function stopRunningSessions(userId: string, endedAt: Date): void {
  const db = getDb();
  db.update(sessions)
    .set({ endedAt })
    .where(and(eq(sessions.userId, userId), isNull(sessions.endedAt)))
    .run();
}

export function listSessions(userId: string): Session[] {
  const db = getDb();
  return db
    .select()
    .from(sessions)
    .where(eq(sessions.userId, userId))
    .all()
    .map(mapSessionRow);
}

export function startTracking(
  userId: string,
  input: StartTrackingInput,
): Session[] {
  const now = new Date();
  const db = getDb();

  db.transaction((tx) => {
    tx.update(sessions)
      .set({ endedAt: now })
      .where(and(eq(sessions.userId, userId), isNull(sessions.endedAt)))
      .run();

    tx.insert(sessions).values({
      id: `session-${randomUUID()}`,
      userId,
      targetType: input.targetType,
      targetId: input.targetId,
      areaId: input.areaId,
      startedAt: now,
      endedAt: null,
    }).run();
  });

  return listSessions(userId);
}

export function stopTracking(userId: string): Session[] {
  stopRunningSessions(userId, new Date());
  return listSessions(userId);
}

export function getRunningSession(userId: string): Session | null {
  const db = getDb();
  const row = db
    .select()
    .from(sessions)
    .where(and(eq(sessions.userId, userId), isNull(sessions.endedAt)))
    .get();
  return row ? mapSessionRow(row) : null;
}

export function stopSessionById(
  userId: string,
  sessionId: string,
): Session {
  const db = getDb();
  const row = db
    .select()
    .from(sessions)
    .where(and(eq(sessions.id, sessionId), eq(sessions.userId, userId)))
    .get();
  if (!row) throw new ApiError(404, "Session not found");

  const endedAt = new Date();
  db.update(sessions)
    .set({ endedAt })
    .where(and(eq(sessions.id, sessionId), eq(sessions.userId, userId)))
    .run();

  return mapSessionRow({ ...row, endedAt });
}
