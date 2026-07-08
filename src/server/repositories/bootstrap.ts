import { and, eq, inArray } from "drizzle-orm";
import type { AreaWeight } from "@/components/screens/onboarding/WeightageScreen";
import { getDb } from "@/db/client";
import {
  areas,
  sessions,
  taskCompletedDates,
  tasks,
  userIntents,
  users,
  usualWeekBlocks,
} from "@/db/schema";
import type { BootstrapResponse } from "@/lib/app-state";
import type { IntentId, TimeWindow } from "@/lib/mock-data";
import {
  usualWeekBudgetErrorMessage,
  validateUsualWeekBudget,
} from "@/lib/mock-data";
import { ApiError } from "@/server/api/errors";
import {
  areaDefToRow,
  buildWeights,
  mapSessionRow,
  mapTaskRow,
  mapUsualWeekRow,
  rowToAreaDef,
  usualWeekBlockRowsForUser,
} from "@/server/repositories/mappers";

export async function loadBootstrap(userId: string): Promise<BootstrapResponse> {
  const db = getDb();
  const user = await db.select().from(users).where(eq(users.id, userId)).get();
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  const intentRows = await db
    .select()
    .from(userIntents)
    .where(eq(userIntents.userId, userId))
    .all();
  const areaRows = (await db
    .select()
    .from(areas)
    .where(eq(areas.userId, userId))
    .all())
    .sort((a, b) => a.sortOrder - b.sortOrder);
  const weekRows = await db
    .select()
    .from(usualWeekBlocks)
    .where(eq(usualWeekBlocks.userId, userId))
    .all();
  const taskRows = await db
    .select()
    .from(tasks)
    .where(eq(tasks.userId, userId))
    .all();
  const sessionRows = await db
    .select()
    .from(sessions)
    .where(eq(sessions.userId, userId))
    .all();

  const taskIds = taskRows.map((task) => task.id);
  const completedRows =
    taskIds.length > 0
      ? await db
          .select()
          .from(taskCompletedDates)
          .where(inArray(taskCompletedDates.taskId, taskIds))
          .all()
      : [];

  const completedByTask = new Map<string, string[]>();
  for (const row of completedRows) {
    const list = completedByTask.get(row.taskId) ?? [];
    list.push(row.dateKey);
    completedByTask.set(row.taskId, list);
  }

  return {
    userId,
    onboardingComplete: user.onboardingComplete,
    intents: intentRows.map((row) => row.intentId as IntentId),
    areas: areaRows.map(rowToAreaDef),
    selectedIds: areaRows
      .filter((row) => row.isSelected)
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((row) => row.id),
    weights: buildWeights(areaRows),
    protectedIds: areaRows
      .filter((row) => row.isProtected)
      .map((row) => row.id),
    tasks: taskRows.map((row) =>
      mapTaskRow(row, completedByTask.get(row.id) ?? []),
    ),
    usualWeek: weekRows.map(mapUsualWeekRow),
    sessions: sessionRows.map(mapSessionRow),
    timeWindow: user.timeWindow as TimeWindow,
  };
}

export type AreasSetupInput = {
  areas: BootstrapResponse["areas"];
  selectedIds: string[];
  weights: AreaWeight[];
  protectedIds: string[];
};

export async function saveAreasSetup(
  userId: string,
  input: AreasSetupInput,
): Promise<void> {
  const db = getDb();
  const selectedSet = new Set(input.selectedIds);
  const protectedSet = new Set(input.protectedIds);
  const weightMap = new Map(input.weights.map((w) => [w.id, w.hours]));

  await db.transaction(async (tx) => {
    await tx.delete(areas).where(eq(areas.userId, userId));
    if (input.areas.length > 0) {
      await tx.insert(areas).values(
        input.areas.map((area, index) =>
          areaDefToRow(area, userId, {
            isSelected: selectedSet.has(area.id),
            isProtected: protectedSet.has(area.id),
            weightHours: weightMap.get(area.id) ?? area.defaultHours,
            sortOrder: index,
          }),
        ),
      );
    }
  });
}

export type ProfilePatch = {
  intents?: IntentId[];
  timeWindow?: TimeWindow;
  onboardingComplete?: boolean;
};

export async function updateProfile(
  userId: string,
  patch: ProfilePatch,
): Promise<void> {
  const db = getDb();
  if (patch.intents) {
    await db.delete(userIntents).where(eq(userIntents.userId, userId));
    if (patch.intents.length > 0) {
      await db.insert(userIntents).values(
        patch.intents.map((intentId) => ({ userId, intentId })),
      );
    }
  }

  const userPatch: Partial<typeof users.$inferInsert> = {
    updatedAt: new Date(),
  };
  if (patch.timeWindow !== undefined) userPatch.timeWindow = patch.timeWindow;
  if (patch.onboardingComplete !== undefined) {
    userPatch.onboardingComplete = patch.onboardingComplete;
  }

  if (patch.timeWindow !== undefined || patch.onboardingComplete !== undefined) {
    await db.update(users).set(userPatch).where(eq(users.id, userId));
  }
}

export async function saveUsualWeek(
  userId: string,
  blocks: BootstrapResponse["usualWeek"],
): Promise<void> {
  const budget = validateUsualWeekBudget(blocks);
  if (!budget.ok) {
    throw new ApiError(400, usualWeekBudgetErrorMessage(budget.overDays));
  }

  const db = getDb();
  await db.transaction(async (tx) => {
    await tx.delete(usualWeekBlocks).where(eq(usualWeekBlocks.userId, userId));
    if (blocks.length > 0) {
      await tx.insert(usualWeekBlocks).values(
        usualWeekBlockRowsForUser(userId, blocks),
      );
    }
  });
}
