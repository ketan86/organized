import {
  blocksOnDate,
  formatBlockLabel,
  formatTimeLabel,
  parseTimeToMinutes,
  type Reminder,
  type Recurrence,
  type Task,
  type UsualWeekBlock,
} from "@/lib/mock-data";

export function blockEndMinutes(block: { start: string; end: string }): number {
  let start = parseTimeToMinutes(block.start);
  let end = parseTimeToMinutes(block.end);
  if (end <= start) end += 24 * 60;
  return end;
}

export function taskStartMinutesForBlock(
  block: { start: string; end: string },
  time: string,
): number {
  const blockStart = parseTimeToMinutes(block.start);
  const blockEnd = parseTimeToMinutes(block.end);
  const overnight = blockEnd <= blockStart;
  let minutes = parseTimeToMinutes(time.slice(0, 5));
  if (overnight && minutes < blockEnd) {
    minutes += 24 * 60;
  }
  return minutes;
}

export function taskFitsInBlock(
  block: { start: string; end: string },
  time: string,
  durationMinutes: number,
): boolean {
  const start = taskStartMinutesForBlock(block, time);
  const end = blockEndMinutes(block);
  return start >= parseTimeToMinutes(block.start) && start + durationMinutes <= end;
}

export function taskFitsInAreaWindow(
  usualWeek: UsualWeekBlock[],
  areaId: string,
  dateKey: string,
  time: string,
  durationMinutes: number,
): boolean {
  const blocks = blocksOnDate(usualWeek, dateKey, areaId);
  return blocks.some((block) => taskFitsInBlock(block, time, durationMinutes));
}

export function formatAreaWindowsOnDate(
  usualWeek: UsualWeekBlock[],
  areaId: string,
  dateKey: string,
): string {
  const blocks = blocksOnDate(usualWeek, dateKey, areaId);
  if (blocks.length === 0) return "no hours set";
  return blocks.map((b) => formatBlockLabel(b)).join(", ");
}

export function formatTimeForDisplay(time: string): string {
  return formatTimeLabel(time.slice(0, 5));
}

type OccupiedSlot = { start: number; end: number };

function occupiedSlotsOnDate(
  tasks: Task[],
  areaId: string,
  dateKey: string,
  excludeTaskId?: string,
): OccupiedSlot[] {
  return tasks
    .filter(
      (t) =>
        t.areaId === areaId &&
        t.scheduledDate === dateKey &&
        t.scheduledTime &&
        t.status === "open" &&
        t.id !== excludeTaskId,
    )
    .map((t) => {
      const start = parseTimeToMinutes(t.scheduledTime!.slice(0, 5));
      return { start, end: start + t.estimateMinutes };
    })
    .sort((a, b) => a.start - b.start);
}

function slotIsFree(
  start: number,
  durationMinutes: number,
  occupied: OccupiedSlot[],
): boolean {
  const end = start + durationMinutes;
  return !occupied.some((o) => end > o.start && start < o.end);
}

/** First open slot inside this area's blocks on dateKey. */
export function defaultTimeInAreaWindow(
  usualWeek: UsualWeekBlock[],
  areaId: string,
  dateKey: string,
  durationMinutes: number,
  tasks: Task[],
  excludeTaskId?: string,
): string | null {
  const blocks = blocksOnDate(usualWeek, dateKey, areaId).sort((a, b) =>
    a.start.localeCompare(b.start),
  );
  const occupied = occupiedSlotsOnDate(tasks, areaId, dateKey, excludeTaskId);

  for (const block of blocks) {
    const blockStart = parseTimeToMinutes(block.start);
    const blockEnd = blockEndMinutes(block);
    let cursor = blockStart;

    while (cursor + durationMinutes <= blockEnd) {
      const fitsBlock = taskFitsInBlock(block, minutesToClock(cursor), durationMinutes);
      if (fitsBlock && slotIsFree(cursor, durationMinutes, occupied)) {
        return minutesToClock(cursor);
      }
      const blocker = occupied.find(
        (o) => cursor + durationMinutes > o.start && cursor < o.end,
      );
      cursor = blocker ? blocker.end : cursor + 15;
    }
  }

  return null;
}

function minutesToClock(totalMinutes: number): string {
  const normalized = ((totalMinutes % (24 * 60)) + 24 * 60) % (24 * 60);
  const h = Math.floor(normalized / 60);
  const m = normalized % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:00`;
}

export function outsideWindowMessage(
  areaName: string,
  time: string,
  usualWeek: UsualWeekBlock[],
  areaId: string,
  dateKey: string,
): string {
  const windows = formatAreaWindowsOnDate(usualWeek, areaId, dateKey);
  return `${formatTimeForDisplay(time)} is outside ${areaName} (${windows}) on ${dateKey}.`;
}
