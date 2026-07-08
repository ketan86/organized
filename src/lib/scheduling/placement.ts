import {
  addDays,
  areaHasPlanOnDate,
  eachDayInRange,
  formatDateLabel,
  formatMinutes,
  occursOnDate,
  plannedHoursForArea,
  todayKey,
  type Task,
  type UsualWeekBlock,
} from "@/lib/mock-data";
import {
  defaultTimeInAreaWindow,
  formatAreaWindowsOnDate,
  formatTimeForDisplay,
  outsideWindowMessage,
  taskFitsInAreaWindow,
} from "@/lib/scheduling/block-time";

export const DEFAULT_HORIZON_DAYS = 30;

export type PlacementMode = "auto" | "pinned" | "backlog";

export type BlockedDay = {
  dateKey: string;
  capacityMinutes: number;
  loadMinutes: number;
  needMinutes: number;
  overByMinutes: number;
  outsideWindow?: boolean;
};

export type PlacementResult =
  | {
      status: "placed";
      scheduledDate: string;
      scheduledTime: string;
      explanation: string;
      freeMinutes: number;
    }
  | {
      status: "shifted";
      requestedDate: string;
      scheduledDate: string;
      scheduledTime: string;
      explanation: string;
      freeMinutes: number;
    }
  | {
      status: "backlog";
      scheduledDate: null;
      scheduledTime: null;
      explanation: string;
    }
  | {
      status: "unachievable";
      scheduledDate: null;
      scheduledTime: null;
      explanation: string;
      blockedDays: BlockedDay[];
    };

export function loadMinutesForAreaOnDate(
  tasks: Task[],
  areaId: string,
  dateKey: string,
  excludeTaskId?: string,
): number {
  return tasks
    .filter(
      (t) =>
        t.areaId === areaId &&
        t.status === "open" &&
        t.id !== excludeTaskId,
    )
    .filter((t) => occursOnDate(t, dateKey))
    .reduce((sum, t) => sum + t.estimateMinutes, 0);
}

export function capacityMinutesForAreaOnDate(
  usualWeek: UsualWeekBlock[],
  areaId: string,
  dateKey: string,
): number {
  return Math.round(
    plannedHoursForArea(usualWeek, areaId, "today", dateKey) * 60,
  );
}

function canPlaceOnDate(
  usualWeek: UsualWeekBlock[],
  tasks: Task[],
  areaId: string,
  dateKey: string,
  needMinutes: number,
  excludeTaskId?: string,
): { fits: boolean; capacityMinutes: number; loadMinutes: number } {
  if (!areaHasPlanOnDate(usualWeek, areaId, dateKey)) {
    return { fits: false, capacityMinutes: 0, loadMinutes: 0 };
  }

  const capacityMinutes = capacityMinutesForAreaOnDate(
    usualWeek,
    areaId,
    dateKey,
  );
  if (capacityMinutes <= 0) {
    return { fits: false, capacityMinutes: 0, loadMinutes: 0 };
  }

  const loadMinutes = loadMinutesForAreaOnDate(
    tasks,
    areaId,
    dateKey,
    excludeTaskId,
  );
  return {
    fits: loadMinutes + needMinutes <= capacityMinutes,
    capacityMinutes,
    loadMinutes,
  };
}

function resolveScheduledTime(
  usualWeek: UsualWeekBlock[],
  tasks: Task[],
  areaId: string,
  dateKey: string,
  estimateMinutes: number,
  preferredTime: string | null | undefined,
  excludeTaskId?: string,
): string | null {
  if (estimateMinutes === 0) {
    return preferredTime ?? null;
  }

  if (preferredTime) {
    return taskFitsInAreaWindow(
      usualWeek,
      areaId,
      dateKey,
      preferredTime,
      estimateMinutes,
    )
      ? preferredTime
      : null;
  }

  return defaultTimeInAreaWindow(
    usualWeek,
    areaId,
    dateKey,
    estimateMinutes,
    tasks,
    excludeTaskId,
  );
}

export type PlaceTaskInput = {
  usualWeek: UsualWeekBlock[];
  tasks: Task[];
  areaId: string;
  areaName: string;
  estimateMinutes: number;
  dueDate: string | null;
  mode: PlacementMode;
  pinnedDate?: string | null;
  preferredTime?: string | null;
  excludeTaskId?: string;
  horizonDays?: number;
  reminderDateKey?: string | null;
};

export function placeTask(input: PlaceTaskInput): PlacementResult {
  const {
    usualWeek,
    tasks,
    areaId,
    areaName,
    estimateMinutes,
    dueDate,
    mode,
    pinnedDate,
    preferredTime,
    excludeTaskId,
    horizonDays = DEFAULT_HORIZON_DAYS,
    reminderDateKey,
  } = input;

  if (estimateMinutes === 0 && reminderDateKey) {
    const time =
      preferredTime ??
      resolveScheduledTime(
        usualWeek,
        tasks,
        areaId,
        reminderDateKey,
        estimateMinutes,
        preferredTime,
        excludeTaskId,
      );
    return {
      status: "placed",
      scheduledDate: reminderDateKey,
      scheduledTime: time ?? "09:00:00",
      explanation: `Reminder on ${formatDateLabel(reminderDateKey)}${
        time ? ` at ${formatTimeForDisplay(time)}` : ""
      }.`,
      freeMinutes: 0,
    };
  }

  if (mode === "backlog") {
    return {
      status: "backlog",
      scheduledDate: null,
      scheduledTime: null,
      explanation: "Saved to someday — not on a specific day.",
    };
  }

  const today = todayKey();
  const searchEnd =
    dueDate && dueDate >= today ? dueDate : addDays(today, horizonDays);

  const tryDate = (dateKey: string) => {
    const check = canPlaceOnDate(
      usualWeek,
      tasks,
      areaId,
      dateKey,
      estimateMinutes,
      excludeTaskId,
    );
    if (!check.fits) return null;

    const scheduledTime = resolveScheduledTime(
      usualWeek,
      tasks,
      areaId,
      dateKey,
      estimateMinutes,
      preferredTime,
      excludeTaskId,
    );
    if (!scheduledTime) return null;

    return {
      dateKey,
      scheduledTime,
      freeMinutes:
        check.capacityMinutes - check.loadMinutes - estimateMinutes,
    };
  };

  const collectBlockedDays = (from: string, to: string): BlockedDay[] => {
    const blocked: BlockedDay[] = [];
    for (const dateKey of eachDayInRange(from, to)) {
      if (!areaHasPlanOnDate(usualWeek, areaId, dateKey)) continue;
      const capacityMinutes = capacityMinutesForAreaOnDate(
        usualWeek,
        areaId,
        dateKey,
      );
      if (capacityMinutes <= 0) continue;
      const loadMinutes = loadMinutesForAreaOnDate(
        tasks,
        areaId,
        dateKey,
        excludeTaskId,
      );
      const total = loadMinutes + estimateMinutes;
      const hasCapacity = total <= capacityMinutes;
      const hasWindow =
        estimateMinutes === 0 ||
        resolveScheduledTime(
          usualWeek,
          tasks,
          areaId,
          dateKey,
          estimateMinutes,
          preferredTime,
          excludeTaskId,
        ) != null;

      if (!hasCapacity) {
        blocked.push({
          dateKey,
          capacityMinutes,
          loadMinutes,
          needMinutes: estimateMinutes,
          overByMinutes: total - capacityMinutes,
        });
      } else if (!hasWindow) {
        blocked.push({
          dateKey,
          capacityMinutes,
          loadMinutes,
          needMinutes: estimateMinutes,
          overByMinutes: 0,
          outsideWindow: true,
        });
      }
    }
    return blocked;
  };

  const formatPlacementExplanation = (
    dateKey: string,
    scheduledTime: string,
    freeMinutes: number,
  ) => {
    const dayLabel =
      dateKey === today
        ? "today"
        : dateKey === addDays(today, 1)
          ? "tomorrow"
          : formatDateLabel(dateKey);
    const windows = formatAreaWindowsOnDate(usualWeek, areaId, dateKey);
    return `${areaName} · ${formatMinutes(estimateMinutes)} at ${formatTimeForDisplay(scheduledTime)} ${dayLabel} (${windows}). ${formatMinutes(freeMinutes)} free in that window.`;
  };

  if (mode === "pinned" && pinnedDate) {
    const pinned = pinnedDate >= today ? pinnedDate : today;
    const direct = tryDate(pinned);
    if (direct) {
      return {
        status: "placed",
        scheduledDate: direct.dateKey,
        scheduledTime: direct.scheduledTime,
        explanation: formatPlacementExplanation(
          direct.dateKey,
          direct.scheduledTime,
          direct.freeMinutes,
        ),
        freeMinutes: direct.freeMinutes,
      };
    }

    if (preferredTime && estimateMinutes > 0) {
      for (const dateKey of eachDayInRange(addDays(pinned, 1), searchEnd)) {
        const hit = tryDate(dateKey);
        if (hit) {
          return {
            status: "shifted",
            requestedDate: pinned,
            scheduledDate: hit.dateKey,
            scheduledTime: hit.scheduledTime,
            explanation: `${outsideWindowMessage(areaName, preferredTime, usualWeek, areaId, pinned)} Next open slot: ${formatDateLabel(hit.dateKey)} at ${formatTimeForDisplay(hit.scheduledTime)}.`,
            freeMinutes: hit.freeMinutes,
          };
        }
      }
    } else {
      for (const dateKey of eachDayInRange(addDays(pinned, 1), searchEnd)) {
        const hit = tryDate(dateKey);
        if (hit) {
          return {
            status: "shifted",
            requestedDate: pinned,
            scheduledDate: hit.dateKey,
            scheduledTime: hit.scheduledTime,
            explanation: `${formatDateLabel(pinned)} is full in ${areaName}. Next open slot: ${formatDateLabel(hit.dateKey)} at ${formatTimeForDisplay(hit.scheduledTime)}.`,
            freeMinutes: hit.freeMinutes,
          };
        }
      }
    }

    return {
      status: "unachievable",
      scheduledDate: null,
      scheduledTime: null,
      explanation: buildUnachievableMessage(
        areaName,
        estimateMinutes,
        dueDate,
        searchEnd,
        preferredTime,
        usualWeek,
        areaId,
        pinned,
      ),
      blockedDays: collectBlockedDays(pinned, searchEnd),
    };
  }

  for (const dateKey of eachDayInRange(today, searchEnd)) {
    const hit = tryDate(dateKey);
    if (hit) {
      return {
        status: "placed",
        scheduledDate: hit.dateKey,
        scheduledTime: hit.scheduledTime,
        explanation: formatPlacementExplanation(
          hit.dateKey,
          hit.scheduledTime,
          hit.freeMinutes,
        ),
        freeMinutes: hit.freeMinutes,
      };
    }
  }

  return {
    status: "unachievable",
    scheduledDate: null,
    scheduledTime: null,
    explanation: buildUnachievableMessage(
      areaName,
      estimateMinutes,
      dueDate,
      searchEnd,
      preferredTime,
      usualWeek,
      areaId,
      today,
    ),
    blockedDays: collectBlockedDays(today, searchEnd),
  };
}

function buildUnachievableMessage(
  areaName: string,
  estimateMinutes: number,
  dueDate: string | null,
  searchEnd: string,
  preferredTime: string | null | undefined,
  usualWeek: UsualWeekBlock[],
  areaId: string,
  dateKey: string,
): string {
  const window = dueDate
    ? `before ${formatDateLabel(dueDate)}`
    : `in the next ${DEFAULT_HORIZON_DAYS} days`;

  if (preferredTime && estimateMinutes > 0) {
    return `${outsideWindowMessage(areaName, preferredTime, usualWeek, areaId, dateKey)} Can't fit ${formatMinutes(estimateMinutes)} ${window}. Pick another time or life area.`;
  }

  return `Can't fit ${formatMinutes(estimateMinutes)} in ${areaName} ${window}. Move or defer something to make room.`;
}

export function scheduledDateFromPlacement(
  placement: PlacementResult,
): string | null {
  if (placement.status === "placed" || placement.status === "shifted") {
    return placement.scheduledDate;
  }
  if (placement.status === "backlog") return null;
  return null;
}

export function scheduledTimeFromPlacement(
  placement: PlacementResult,
): string | null {
  if (placement.status === "placed" || placement.status === "shifted") {
    return placement.scheduledTime;
  }
  return null;
}

export function canConfirmPlacement(
  placement: PlacementResult,
  explicitBacklog: boolean,
): boolean {
  if (explicitBacklog) return true;
  return placement.status !== "unachievable";
}
