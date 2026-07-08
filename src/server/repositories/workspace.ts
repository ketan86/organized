import { eq } from "drizzle-orm";
import { getDb } from "@/db/client";
import {
  areas,
  sessions,
  tasks,
  userIntents,
  users,
  usualWeekBlocks,
} from "@/db/schema";
import {
  createDefaultUsualWeek,
  createInitialAreas,
  type IntentId,
} from "@/lib/mock-data";
import { areaDefToRow, usualWeekBlockRowsForUser } from "@/server/repositories/mappers";

export function seedUserWorkspace(userId: string): void {
  const catalog = createInitialAreas();
  const selectedIds = catalog.filter((a) => a.defaultSelected).map((a) => a.id);
  const protectedIds = catalog
    .filter((a) => a.defaultProtected && a.defaultSelected)
    .map((a) => a.id);
  const selectedSet = new Set(selectedIds);
  const protectedSet = new Set(protectedIds);
  const usualWeek = createDefaultUsualWeek();

  const db = getDb();

  db.insert(userIntents).values([
    { userId, intentId: "family" },
    { userId, intentId: "rest" },
  ]).run();

  db.insert(areas).values(
    catalog.map((area, index) =>
      areaDefToRow(area, userId, {
        isSelected: selectedSet.has(area.id),
        isProtected: protectedSet.has(area.id),
        weightHours: area.defaultHours,
        sortOrder: index,
      }),
    ),
  ).run();

  if (usualWeek.length > 0) {
    db.insert(usualWeekBlocks).values(
      usualWeekBlockRowsForUser(userId, usualWeek),
    ).run();
  }
}

export function replaceUserIntents(userId: string, intents: IntentId[]): void {
  const db = getDb();
  db.delete(userIntents).where(eq(userIntents.userId, userId)).run();
  if (intents.length > 0) {
    db.insert(userIntents).values(
      intents.map((intentId) => ({ userId, intentId })),
    ).run();
  }
}

export function resetUserWorkspace(userId: string): void {
  const db = getDb();

  db.transaction((tx) => {
    tx.delete(tasks).where(eq(tasks.userId, userId)).run();
    tx.delete(sessions).where(eq(sessions.userId, userId)).run();
    tx.delete(usualWeekBlocks).where(eq(usualWeekBlocks.userId, userId)).run();
    tx.delete(areas).where(eq(areas.userId, userId)).run();
    tx.delete(userIntents).where(eq(userIntents.userId, userId)).run();
    tx.update(users)
      .set({
        onboardingComplete: false,
        timeWindow: "today",
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .run();
  });

  seedUserWorkspace(userId);
}
