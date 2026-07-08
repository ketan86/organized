import { eq } from "drizzle-orm";
import { getDb } from "@/db/client";
import { areas, taskCompletedDates, tasks, users, usualWeekBlocks } from "@/db/schema";
import {
  boundaryBody,
  boundaryTitle,
  collectDueAreaBoundaries,
} from "@/lib/notifications/area-boundary-schedule";
import { collectDueReminders } from "@/lib/notifications/reminder-schedule";
import type { AreaDef, Task } from "@/lib/mock-data";
import { mapTaskRow, mapUsualWeekRow, rowToAreaDef } from "@/server/repositories/mappers";
import { sendPushToSubscription } from "@/server/notifications/push";
import {
  hasReminderBeenDelivered,
  markReminderDelivered,
} from "@/server/repositories/reminder-deliveries";
import { listPushSubscriptionsForUser } from "@/server/repositories/push-subscriptions";
import { isPushConfigured } from "@/server/notifications/vapid";

async function loadTasksForUser(userId: string): Promise<Task[]> {
  const db = getDb();
  const taskRows = await db
    .select()
    .from(tasks)
    .where(eq(tasks.userId, userId))
    .all();
  const result: Task[] = [];
  for (const row of taskRows) {
    const completedDates = (
      await db
        .select()
        .from(taskCompletedDates)
        .where(eq(taskCompletedDates.taskId, row.id))
        .all()
    ).map((r) => r.dateKey);
    result.push(mapTaskRow(row, completedDates));
  }
  return result;
}

async function loadAreasForUser(userId: string): Promise<AreaDef[]> {
  const db = getDb();
  const rows = await db
    .select()
    .from(areas)
    .where(eq(areas.userId, userId))
    .all();
  return rows
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map(rowToAreaDef);
}

async function loadUsualWeekForUser(userId: string) {
  const db = getDb();
  return (
    await db
      .select()
      .from(usualWeekBlocks)
      .where(eq(usualWeekBlocks.userId, userId))
      .all()
  ).map(mapUsualWeekRow);
}

export type DispatchResult = {
  dispatched: number;
  pushConfigured: boolean;
};

export async function dispatchDueReminders(
  userId: string,
  now: Date = new Date(),
): Promise<DispatchResult> {
  if (!isPushConfigured()) {
    return { dispatched: 0, pushConfigured: false };
  }

  const userTasks = await loadTasksForUser(userId);
  const dueTasks = collectDueReminders(userTasks, now);
  const userAreas = await loadAreasForUser(userId);
  const usualWeek = await loadUsualWeekForUser(userId);
  const dueBoundaries = collectDueAreaBoundaries(usualWeek, userAreas, now);

  if (dueTasks.length === 0 && dueBoundaries.length === 0) {
    return { dispatched: 0, pushConfigured: true };
  }

  const subscriptions = await listPushSubscriptionsForUser(userId);
  if (subscriptions.length === 0) {
    return { dispatched: 0, pushConfigured: true };
  }

  let dispatched = 0;

  for (const { task, dedupeKey } of dueTasks) {
    if (await hasReminderBeenDelivered(userId, dedupeKey)) continue;

    const payload = {
      title: task.title,
      body: "Reminder",
      url: "/",
      taskId: task.id,
      kind: "task" as const,
    };

    let sent = false;
    for (const subscription of subscriptions) {
      try {
        await sendPushToSubscription(subscription, payload);
        sent = true;
      } catch {
        // Expired subscriptions are cleaned up on next subscribe.
      }
    }

    if (sent) {
      await markReminderDelivered(userId, dedupeKey);
      dispatched += 1;
    }
  }

  for (const { area, block, kind, dedupeKey } of dueBoundaries) {
    if (await hasReminderBeenDelivered(userId, dedupeKey)) continue;

    const payload = {
      title: boundaryTitle(area, kind),
      body: boundaryBody(block, kind),
      url: "/",
      areaId: area.id,
      kind: "area-boundary" as const,
    };

    let sent = false;
    for (const subscription of subscriptions) {
      try {
        await sendPushToSubscription(subscription, payload);
        sent = true;
      } catch {
        // Expired subscriptions are cleaned up on next subscribe.
      }
    }

    if (sent) {
      await markReminderDelivered(userId, dedupeKey);
      dispatched += 1;
    }
  }

  return { dispatched, pushConfigured: true };
}

export async function dispatchDueRemindersForAllUsers(
  now: Date = new Date(),
): Promise<{ users: number; dispatched: number }> {
  const db = getDb();
  const allUsers = await db.select({ id: users.id }).from(users).all();
  let dispatched = 0;

  for (const user of allUsers) {
    const result = await dispatchDueReminders(user.id, now);
    dispatched += result.dispatched;
  }

  return { users: allUsers.length, dispatched };
}

export type PushTestResult = {
  ok: boolean;
  configured: boolean;
  subscriptionCount: number;
  error?: string;
};

export async function sendTestPush(userId: string): Promise<PushTestResult> {
  const configured = isPushConfigured();
  if (!configured) {
    return {
      ok: false,
      configured: false,
      subscriptionCount: 0,
      error: "VAPID keys are missing on the server. Add them to .env.local and restart npm run dev.",
    };
  }

  const subscriptions = await listPushSubscriptionsForUser(userId);
  if (subscriptions.length === 0) {
    return {
      ok: false,
      configured: true,
      subscriptionCount: 0,
      error: "This browser is not registered for push yet. Turn notifications off and enable again.",
    };
  }

  const errors: string[] = [];
  let sent = false;
  for (const subscription of subscriptions) {
    try {
      await sendPushToSubscription(subscription, {
        title: "Organized",
        body: "Notifications are working.",
        url: "/",
      });
      sent = true;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Push delivery failed";
      errors.push(message);
    }
  }

  return {
    ok: sent,
    configured: true,
    subscriptionCount: subscriptions.length,
    error: sent ? undefined : errors[0] ?? "Push delivery failed",
  };
}
