import type { AreaDef, UsualWeekBlock } from "@/lib/mock-data";
import {
  addDays,
  formatTimeLabel,
  parseDateKey,
  parseTimeToMinutes,
  toDateKey,
} from "@/lib/mock-data";
import { REMINDER_GRACE_MS } from "@/lib/notifications/reminder-schedule";

export type AreaBoundaryKind = "start" | "stop";

export type DueAreaBoundary = {
  block: UsualWeekBlock;
  area: AreaDef;
  kind: AreaBoundaryKind;
  dedupeKey: string;
  fireAt: Date;
};

function timeOnDateKey(dateKey: string, time: string): Date {
  const [h, m] = time.split(":").map(Number);
  const fireAt = new Date(`${dateKey}T00:00:00`);
  fireAt.setHours(h, m ?? 0, 0, 0);
  return fireAt;
}

function dayOfWeekForDateKey(dateKey: string): number {
  return parseDateKey(dateKey).getDay();
}

function isOvernightBlock(block: UsualWeekBlock): boolean {
  return parseTimeToMinutes(block.end) <= parseTimeToMinutes(block.start);
}

export function boundaryDedupeKey(
  blockId: string,
  dateKey: string,
  kind: AreaBoundaryKind,
): string {
  return `area-boundary:${blockId}:${dateKey}:${kind}`;
}

/** When a block boundary fires on a calendar day. */
export function getBoundaryFireAt(
  block: UsualWeekBlock,
  dateKey: string,
  kind: AreaBoundaryKind,
): Date | null {
  const dow = dayOfWeekForDateKey(dateKey);
  const overnight = isOvernightBlock(block);

  if (kind === "start") {
    if (dow !== block.dayOfWeek) return null;
    return timeOnDateKey(dateKey, block.start);
  }

  if (overnight) {
    const prevDateKey = addDays(dateKey, -1);
    if (dayOfWeekForDateKey(prevDateKey) !== block.dayOfWeek) return null;
    return timeOnDateKey(dateKey, block.end);
  }

  if (dow !== block.dayOfWeek) return null;
  return timeOnDateKey(dateKey, block.end);
}

export function isBoundaryDue(
  block: UsualWeekBlock,
  kind: AreaBoundaryKind,
  now: Date = new Date(),
  graceMs: number = REMINDER_GRACE_MS,
): boolean {
  const dateKey = toDateKey(now);
  const fireAt = getBoundaryFireAt(block, dateKey, kind);
  if (!fireAt) return false;

  const nowMs = now.getTime();
  const fireMs = fireAt.getTime();
  return nowMs >= fireMs && nowMs < fireMs + graceMs;
}

export function boundaryTitle(
  area: AreaDef,
  kind: AreaBoundaryKind,
): string {
  return `${area.name} ${kind === "start" ? "starts" : "ends"}`;
}

export function boundaryBody(
  block: UsualWeekBlock,
  kind: AreaBoundaryKind,
): string {
  const time = kind === "start" ? block.start : block.end;
  return formatTimeLabel(time.slice(0, 5));
}

export function collectDueAreaBoundaries(
  usualWeek: UsualWeekBlock[],
  areas: AreaDef[],
  now: Date = new Date(),
  graceMs: number = REMINDER_GRACE_MS,
): DueAreaBoundary[] {
  const dateKey = toDateKey(now);
  const due: DueAreaBoundary[] = [];

  for (const block of usualWeek) {
    const area = areas.find((a) => a.id === block.areaId);
    if (!area) continue;

    for (const kind of ["start", "stop"] as const) {
      if (!isBoundaryDue(block, kind, now, graceMs)) continue;
      const fireAt = getBoundaryFireAt(block, dateKey, kind);
      if (!fireAt) continue;
      due.push({
        block,
        area,
        kind,
        fireAt,
        dedupeKey: boundaryDedupeKey(block.id, dateKey, kind),
      });
    }
  }

  return due;
}

export function getNextAreaBoundaryFireAt(
  usualWeek: UsualWeekBlock[],
  now: Date = new Date(),
  graceMs: number = REMINDER_GRACE_MS,
): Date | null {
  const today = toDateKey(now);
  const nowMs = now.getTime();
  let next: Date | null = null;

  for (const block of usualWeek) {
    for (let offset = 0; offset <= 7; offset += 1) {
      const dateKey = addDays(today, offset);
      for (const kind of ["start", "stop"] as const) {
        const fireAt = getBoundaryFireAt(block, dateKey, kind);
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
  }

  return next;
}
