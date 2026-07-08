import type { AreaWeight } from "@/components/screens/onboarding/WeightageScreen";
import type { areas } from "@/db/schema";
import type {
  AreaDef,
  DaysPattern,
  Recurrence,
  Reminder,
  Session,
  Task,
  TaskStatus,
  TimeBlock,
  UsualWeekBlock,
} from "@/lib/mock-data";

export function parseBlocks(json: string): TimeBlock[] {
  try {
    const parsed = JSON.parse(json) as TimeBlock[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function rowToAreaDef(row: typeof areas.$inferSelect): AreaDef {
  return {
    id: row.id,
    name: row.name,
    color: row.color,
    defaultHours: row.defaultHours,
    defaultSelected: row.defaultSelected,
    defaultProtected: row.defaultProtected,
    daysPattern: row.daysPattern as DaysPattern,
    blocks: parseBlocks(row.blocksJson),
    isCustom: row.isCustom,
  };
}

export function areaDefToRow(
  area: AreaDef,
  userId: string,
  meta: {
    isSelected: boolean;
    isProtected: boolean;
    weightHours: number;
    sortOrder: number;
  },
): typeof areas.$inferInsert {
  return {
    id: area.id,
    userId,
    name: area.name,
    color: area.color,
    defaultHours: area.defaultHours,
    defaultSelected: area.defaultSelected,
    defaultProtected: area.defaultProtected,
    daysPattern: area.daysPattern,
    blocksJson: JSON.stringify(area.blocks ?? []),
    isCustom: area.isCustom ?? false,
    isSelected: meta.isSelected,
    isProtected: meta.isProtected,
    weightHours: meta.weightHours,
    sortOrder: meta.sortOrder,
  };
}

export function buildWeights(
  areaRows: (typeof areas.$inferSelect)[],
): AreaWeight[] {
  return areaRows
    .filter((row) => row.isSelected)
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((row) => ({ id: row.id, hours: row.weightHours }));
}

export function mapTaskRow(
  row: {
    id: string;
    areaId: string;
    title: string;
    notes: string | null;
    estimateMinutes: number;
    status: string;
    scheduledDate: string | null;
    scheduledTime: string | null;
    dueDate: string | null;
    recurrence: string;
    reminder: string;
  },
  completedDates: string[],
): Task {
  return {
    id: row.id,
    areaId: row.areaId,
    title: row.title,
    notes: row.notes ?? undefined,
    estimateMinutes: row.estimateMinutes,
    status: row.status as TaskStatus,
    scheduledDate: row.scheduledDate,
    scheduledTime: row.scheduledTime,
    dueDate: row.dueDate,
    recurrence: row.recurrence as Recurrence,
    reminder: row.reminder as Reminder,
    completedDates,
  };
}

export function mapSessionRow(row: {
  id: string;
  targetType: string;
  targetId: string;
  areaId: string;
  startedAt: Date;
  endedAt: Date | null;
}): Session {
  return {
    id: row.id,
    targetType: row.targetType as Session["targetType"],
    targetId: row.targetId,
    areaId: row.areaId,
    startedAt: row.startedAt.getTime(),
    endedAt: row.endedAt ? row.endedAt.getTime() : null,
  };
}

export function scopedUsualWeekBlockId(userId: string, blockId: string): string {
  const prefix = `${userId}-`;
  return blockId.startsWith(prefix) ? blockId : `${prefix}${blockId}`;
}

export function usualWeekBlockRowsForUser(
  userId: string,
  blocks: UsualWeekBlock[],
) {
  return blocks.map((block) => ({
    id: scopedUsualWeekBlockId(userId, block.id),
    userId,
    areaId: block.areaId,
    dayOfWeek: block.dayOfWeek,
    start: block.start,
    end: block.end,
  }));
}

export function mapUsualWeekRow(row: {
  id: string;
  areaId: string;
  dayOfWeek: number;
  start: string;
  end: string;
}): UsualWeekBlock {
  return {
    id: row.id,
    areaId: row.areaId,
    dayOfWeek: row.dayOfWeek,
    start: row.start,
    end: row.end,
  };
}
