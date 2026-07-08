import { eq } from "drizzle-orm";
import { getDb } from "@/db/client";
import { areas, taskCompletedDates, tasks, usualWeekBlocks } from "@/db/schema";
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

function loadTasksForUser(userId: string): Task[] {
  const db = getDb();
  const taskRows = db.select().from(tasks).where(eq(tasks.userId, userId)).all();
  return taskRows.map((row) => {
    const completedDates = db
      .select()
      .from(taskCompletedDates)
      .where(eq(taskCompletedDates.taskId, row.id))
      .all()
      .map((r) => r.dateKey);
    return mapTaskRow(row, completedDates);
  });
}

function loadAreasForUser(userId: string): AreaDef[] {
  const db = getDb();
  return db
    .select()
    .from(areas)
    .where(eq(areas.userId, userId))
    .all()
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map(rowToAreaDef);
}

function loadUsualWeekForUser(userId: string) {
  const db = getDb();
  return db
    .select()
    .from(usualWeekBlocks)
    .where(eq(usualWeekBlocks.userId, userId))
    .all()
    .map(mapUsualWeekRow);
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

  const userTasks = loadTasksForUser(userId);
  const dueTasks = collectDueReminders(userTasks, now);
  const userAreas = loadAreasForUser(userId);
  const usualWeek = loadUsualWeekForUser(userId);
  const dueBoundaries = collectDueAreaBoundaries(usualWeek, userAreas, now);

  if (dueTasks.length === 0 && dueBoundaries.length === 0) {
    return { dispatched: 0, pushConfigured: true };
  }

  const subscriptions = listPushSubscriptionsForUser(userId);
  if (subscriptions.length === 0) {
    return { dispatched: 0, pushConfigured: true };
  }

  let dispatched = 0;

  for (const { task, dedupeKey } of dueTasks) {
    if (hasReminderBeenDelivered(userId, dedupeKey)) continue;

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
      markReminderDelivered(userId, dedupeKey);
      dispatched += 1;
    }
  }

  for (const { area, block, kind, dedupeKey } of dueBoundaries) {
    if (hasReminderBeenDelivered(userId, dedupeKey)) continue;

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
      markReminderDelivered(userId, dedupeKey);
      dispatched += 1;
    }
  }

  return { dispatched, pushConfigured: true };
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

  const subscriptions = listPushSubscriptionsForUser(userId);
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
