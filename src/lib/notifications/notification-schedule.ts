import type { AreaDef, Task, UsualWeekBlock } from "@/lib/mock-data";
import {
  getNextAreaBoundaryFireAt,
} from "@/lib/notifications/area-boundary-schedule";
import {
  getNextReminderFireAt,
  REMINDER_GRACE_MS,
} from "@/lib/notifications/reminder-schedule";

export function getNextNotificationFireAt(
  tasks: Task[],
  usualWeek: UsualWeekBlock[],
  options?: {
    areaBoundariesEnabled?: boolean;
    now?: Date;
    graceMs?: number;
  },
): Date | null {
  const now = options?.now ?? new Date();
  const graceMs = options?.graceMs ?? REMINDER_GRACE_MS;
  const taskNext = getNextReminderFireAt(tasks, now, graceMs);
  const boundaryNext = options?.areaBoundariesEnabled
    ? getNextAreaBoundaryFireAt(usualWeek, now, graceMs)
    : null;

  if (!taskNext) return boundaryNext;
  if (!boundaryNext) return taskNext;
  return taskNext.getTime() <= boundaryNext.getTime() ? taskNext : boundaryNext;
}
