import type { Reminder, Task } from "@/lib/mock-data";
import {
  addDays,
  occursOnDate,
  parseReminderSpec,
  reminderClockTime,
  toDateKey,
} from "@/lib/mock-data";

export { reminderClockTime };

/** How long after the reminder time we still deliver (handles throttled tabs). */
export const REMINDER_GRACE_MS = 5 * 60 * 1000;

export function shouldRemindOnDate(task: Task, dateKey: string): boolean {
  if ((task.reminder ?? "none") === "none") return false;
  if (task.status !== "open") return false;
  if (task.completedDates?.includes(dateKey)) return false;

  const spec = parseReminderSpec(task.reminder);
  if (spec.kind === "absolute") {
    return spec.dateKey === dateKey;
  }

  if (occursOnDate(task, dateKey)) return true;
  if (task.dueDate === dateKey) return true;
  return false;
}

export function getReminderFireAt(task: Task, dateKey: string): Date | null {
  if ((task.reminder ?? "none") === "none") return null;
  if (task.status !== "open") return null;
  if (task.completedDates?.includes(dateKey)) return null;

  const clock = reminderClockTime(task.reminder);
  if (!clock) return null;

  const spec = parseReminderSpec(task.reminder);
  if (spec.kind === "absolute") {
    if (spec.dateKey !== dateKey) return null;
  } else if (!occursOnDate(task, dateKey) && task.dueDate !== dateKey) {
    return null;
  }

  const fireAt = new Date(`${dateKey}T00:00:00`);
  fireAt.setHours(clock.hours, clock.minutes, clock.seconds, 0);
  return fireAt;
}

export function isReminderDue(
  task: Task,
  now: Date = new Date(),
  graceMs: number = REMINDER_GRACE_MS,
): boolean {
  const dateKey = toDateKey(now);
  const fireAt = getReminderFireAt(task, dateKey);
  if (!fireAt) return false;

  const nowMs = now.getTime();
  const fireMs = fireAt.getTime();
  return nowMs >= fireMs && nowMs < fireMs + graceMs;
}

export function reminderDedupeKey(
  taskId: string,
  dateKey: string,
  reminder: Reminder,
): string {
  return `${taskId}:${dateKey}:${reminder}`;
}

export type DueReminder = {
  task: Task;
  dedupeKey: string;
};

export function collectDueReminders(
  tasks: Task[],
  now: Date = new Date(),
  graceMs: number = REMINDER_GRACE_MS,
): DueReminder[] {
  const dateKey = toDateKey(now);
  const due: DueReminder[] = [];
  for (const task of tasks) {
    if (!isReminderDue(task, now, graceMs)) continue;
    due.push({
      task,
      dedupeKey: reminderDedupeKey(task.id, dateKey, task.reminder),
    });
  }
  return due;
}

/** Next upcoming reminder across open tasks (searches today + 7 days). */
export function getNextReminderFireAt(
  tasks: Task[],
  now: Date = new Date(),
  graceMs: number = REMINDER_GRACE_MS,
): Date | null {
  const today = toDateKey(now);
  const nowMs = now.getTime();
  let next: Date | null = null;

  for (const task of tasks) {
    if ((task.reminder ?? "none") === "none" || task.status !== "open") continue;

    for (let offset = 0; offset <= 7; offset += 1) {
      const dateKey = addDays(today, offset);
      const fireAt = getReminderFireAt(task, dateKey);
      if (!fireAt) continue;

      const fireMs = fireAt.getTime();
      const graceEndMs = fireMs + graceMs;

      if (nowMs >= fireMs && nowMs < graceEndMs) {
        const graceEnd = new Date(graceEndMs);
        if (!next || graceEnd.getTime() < next.getTime()) next = graceEnd;
        continue;
      }

      if (fireMs > nowMs) {
        if (!next || fireMs < next.getTime()) next = fireAt;
      }
    }
  }

  return next;
}

export function localReminderContext(now = new Date()) {
  const dateKey = toDateKey(now);
  return {
    dateKey,
    hours: now.getHours(),
    minutes: now.getMinutes(),
    seconds: now.getSeconds(),
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  };
}
