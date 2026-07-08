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

export async function seedUserWorkspace(userId: string): Promise<void> {
  const catalog = createInitialAreas();
  const selectedIds = catalog.filter((a) => a.defaultSelected).map((a) => a.id);
  const protectedIds = catalog
    .filter((a) => a.defaultProtected && a.defaultSelected)
    .map((a) => a.id);
  const selectedSet = new Set(selectedIds);
  const protectedSet = new Set(protectedIds);
  const usualWeek = createDefaultUsualWeek();

  const db = getDb();

  await db.insert(userIntents).values([
    { userId, intentId: "family" },
    { userId, intentId: "rest" },
  ]);

  await db.insert(areas).values(
    catalog.map((area, index) =>
      areaDefToRow(area, userId, {
        isSelected: selectedSet.has(area.id),
        isProtected: protectedSet.has(area.id),
        weightHours: area.defaultHours,
        sortOrder: index,
      }),
    ),
  );

  if (usualWeek.length > 0) {
    await db.insert(usualWeekBlocks).values(
      usualWeekBlockRowsForUser(userId, usualWeek),
    );
  }
}

export async function replaceUserIntents(
  userId: string,
  intents: IntentId[],
): Promise<void> {
  const db = getDb();
  await db.delete(userIntents).where(eq(userIntents.userId, userId));
  if (intents.length > 0) {
    await db.insert(userIntents).values(
      intents.map((intentId) => ({ userId, intentId })),
    );
  }
}

export async function resetUserWorkspace(userId: string): Promise<void> {
  const db = getDb();

  await db.transaction(async (tx) => {
    await tx.delete(tasks).where(eq(tasks.userId, userId));
    await tx.delete(sessions).where(eq(sessions.userId, userId));
    await tx.delete(usualWeekBlocks).where(eq(usualWeekBlocks.userId, userId));
    await tx.delete(areas).where(eq(areas.userId, userId));
    await tx.delete(userIntents).where(eq(userIntents.userId, userId));
    await tx
      .update(users)
      .set({
        onboardingComplete: false,
        timeWindow: "today",
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));
  });

  await seedUserWorkspace(userId);
}
