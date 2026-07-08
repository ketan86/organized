import type { AreaDef, Reminder, Task, UsualWeekBlock } from "@/lib/mock-data";
import {
  addDays,
  formatDateLabel,
  formatTimeWithSeconds,
  reminderLabel,
  toDateKey,
} from "@/lib/mock-data";
import {
  boundaryDedupeKey,
  boundaryTitle,
  getBoundaryFireAt,
} from "@/lib/notifications/area-boundary-schedule";
import { getReminderFireAt } from "@/lib/notifications/reminder-schedule";

export type ReminderEntryKind = "task" | "area-boundary";

export type ReminderEntry = {
  id: string;
  kind: ReminderEntryKind;
  taskId: string;
  taskTitle: string;
  areaId: string;
  areaName: string;
  areaColor: string;
  fireAt: Date;
  dateKey: string;
  reminder: Reminder | null;
  reminderText: string;
  whenLabel: string;
  boundaryKind?: "start" | "stop";
};

export function listReminderEntries(
  tasks: Task[],
  areas: AreaDef[],
  now: Date = new Date(),
  daysAhead = 14,
  daysBehind = 7,
): ReminderEntry[] {
  const today = toDateKey(now);
  const entries: ReminderEntry[] = [];

  for (const task of tasks) {
    if ((task.reminder ?? "none") === "none" || task.status !== "open") continue;
    const area = areas.find((a) => a.id === task.areaId);

    for (let offset = -daysBehind; offset <= daysAhead; offset += 1) {
      const dateKey = addDays(today, offset);
      const fireAt = getReminderFireAt(task, dateKey);
      if (!fireAt) continue;

      const time = `${String(fireAt.getHours()).padStart(2, "0")}:${String(fireAt.getMinutes()).padStart(2, "0")}:${String(fireAt.getSeconds()).padStart(2, "0")}`;
      entries.push({
        id: `${task.id}:${dateKey}:${task.reminder}`,
        kind: "task",
        taskId: task.id,
        taskTitle: task.title,
        areaId: task.areaId,
        areaName: area?.name ?? "Unknown",
        areaColor: area?.color ?? "var(--fg-faint)",
        fireAt,
        dateKey,
        reminder: task.reminder,
        reminderText: reminderLabel(task.reminder),
        whenLabel: `${formatDateLabel(dateKey)} · ${formatTimeWithSeconds(time)}`,
      });
    }
  }

  return entries.sort((a, b) => a.fireAt.getTime() - b.fireAt.getTime());
}

export function listAreaBoundaryEntries(
  usualWeek: UsualWeekBlock[],
  areas: AreaDef[],
  now: Date = new Date(),
  daysAhead = 14,
  daysBehind = 7,
): ReminderEntry[] {
  const today = toDateKey(now);
  const entries: ReminderEntry[] = [];

  for (const block of usualWeek) {
    const area = areas.find((a) => a.id === block.areaId);
    if (!area) continue;

    for (let offset = -daysBehind; offset <= daysAhead; offset += 1) {
      const dateKey = addDays(today, offset);
      for (const kind of ["start", "stop"] as const) {
        const fireAt = getBoundaryFireAt(block, dateKey, kind);
        if (!fireAt) continue;

        const time = `${String(fireAt.getHours()).padStart(2, "0")}:${String(fireAt.getMinutes()).padStart(2, "0")}:00`;
        entries.push({
          id: boundaryDedupeKey(block.id, dateKey, kind),
          kind: "area-boundary",
          taskId: "",
          taskTitle: boundaryTitle(area, kind),
          areaId: area.id,
          areaName: area.name,
          areaColor: area.color,
          fireAt,
          dateKey,
          reminder: null,
          reminderText: kind === "start" ? "Starts" : "Ends",
          whenLabel: `${formatDateLabel(dateKey)} · ${formatTimeWithSeconds(time)}`,
          boundaryKind: kind,
        });
      }
    }
  }

  return entries.sort((a, b) => a.fireAt.getTime() - b.fireAt.getTime());
}

export function listAllReminderEntries(
  tasks: Task[],
  areas: AreaDef[],
  usualWeek: UsualWeekBlock[],
  now: Date = new Date(),
  options?: {
    includeAreaBoundaries?: boolean;
    daysAhead?: number;
    daysBehind?: number;
  },
): ReminderEntry[] {
  const daysAhead = options?.daysAhead ?? 14;
  const daysBehind = options?.daysBehind ?? 7;
  const taskEntries = listReminderEntries(tasks, areas, now, daysAhead, daysBehind);
  if (!options?.includeAreaBoundaries) return taskEntries;

  const boundaryEntries = listAreaBoundaryEntries(
    usualWeek,
    areas,
    now,
    daysAhead,
    daysBehind,
  );
  return [...taskEntries, ...boundaryEntries].sort(
    (a, b) => a.fireAt.getTime() - b.fireAt.getTime(),
  );
}

export function splitReminderEntries(
  entries: ReminderEntry[],
  now: Date = new Date(),
): { upcoming: ReminderEntry[]; past: ReminderEntry[] } {
  const nowMs = now.getTime();
  const upcoming: ReminderEntry[] = [];
  const past: ReminderEntry[] = [];

  for (const entry of entries) {
    if (entry.fireAt.getTime() >= nowMs) upcoming.push(entry);
    else past.push(entry);
  }

  return {
    upcoming,
    past: past.reverse(),
  };
}
