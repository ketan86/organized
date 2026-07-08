import type { BootstrapResponse } from "@/lib/app-state";
import {
  getAreaPressure,
  todayKey,
  type AreaDef,
  type Task,
} from "@/lib/mock-data";

export type CaptureContextPayload = {
  today: string;
  intents: BootstrapResponse["intents"];
  protectedAreaIds: string[];
  areas: {
    id: string;
    name: string;
    isProtected: boolean;
    todayLoadHours: number;
    todayCapacityHours: number;
    weekLoadHours: number;
    weekCapacityHours: number;
  }[];
  openTasks: {
    id: string;
    title: string;
    areaId: string;
    areaName: string;
    estimateMinutes: number;
    scheduledDate: string | null;
    dueDate: string | null;
    recurrence: string;
    reminder: string;
  }[];
};

export function buildCaptureContext(
  bootstrap: BootstrapResponse,
): CaptureContextPayload {
  const today = todayKey();
  const selectedAreas = bootstrap.areas.filter((a) =>
    bootstrap.selectedIds.includes(a.id),
  );
  const areaById = new Map(selectedAreas.map((a) => [a.id, a]));

  const openTasks = bootstrap.tasks
    .filter((t) => t.status === "open")
    .sort((a, b) => scoreTaskForContext(a, today) - scoreTaskForContext(b, today))
    .slice(0, 40)
    .map((task) => ({
      id: task.id,
      title: task.title,
      areaId: task.areaId,
      areaName: areaById.get(task.areaId)?.name ?? task.areaId,
      estimateMinutes: task.estimateMinutes,
      scheduledDate: task.scheduledDate,
      dueDate: task.dueDate,
      recurrence: task.recurrence,
      reminder: task.reminder,
    }));

  return {
    today,
    intents: bootstrap.intents,
    protectedAreaIds: bootstrap.protectedIds,
    areas: selectedAreas.map((area) => contextForArea(area, bootstrap)),
    openTasks,
  };
}

function scoreTaskForContext(task: Task, today: string): number {
  if (task.scheduledDate === today) return 0;
  if (task.scheduledDate) return 1;
  if (task.dueDate) return 2;
  return 3;
}

function contextForArea(
  area: AreaDef,
  bootstrap: BootstrapResponse,
): CaptureContextPayload["areas"][number] {
  const todayPressure = getAreaPressure(
    area,
    bootstrap.usualWeek,
    bootstrap.tasks,
    "today",
  );
  const weekPressure = getAreaPressure(
    area,
    bootstrap.usualWeek,
    bootstrap.tasks,
    "week",
  );

  return {
    id: area.id,
    name: area.name,
    isProtected: bootstrap.protectedIds.includes(area.id),
    todayLoadHours: round2(todayPressure.load),
    todayCapacityHours: round2(todayPressure.capacity),
    weekLoadHours: round2(weekPressure.load),
    weekCapacityHours: round2(weekPressure.capacity),
  };
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
