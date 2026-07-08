import { randomUUID } from "node:crypto";
import { and, eq } from "drizzle-orm";
import { getDb } from "@/db/client";
import { taskCompletedDates, tasks } from "@/db/schema";
import type { Recurrence, Reminder, Task, TaskStatus } from "@/lib/mock-data";
import { isRecurring } from "@/lib/mock-data";
import { ApiError } from "@/server/api/errors";
import { mapTaskRow } from "@/server/repositories/mappers";

export type CreateTaskInput = {
  areaId: string;
  title: string;
  notes?: string;
  estimateMinutes: number;
  scheduledDate: string | null;
  scheduledTime?: string | null;
  dueDate?: string | null;
  recurrence?: Recurrence;
  reminder?: Reminder;
};

export type UpdateTaskInput = Partial<{
  areaId: string;
  title: string;
  notes: string | null;
  estimateMinutes: number;
  status: TaskStatus;
  scheduledDate: string | null;
  scheduledTime: string | null;
  dueDate: string | null;
  recurrence: Recurrence;
  reminder: Reminder;
}>;

function getTaskForUser(userId: string, taskId: string) {
  const db = getDb();
  const row = db
    .select()
    .from(tasks)
    .where(and(eq(tasks.id, taskId), eq(tasks.userId, userId)))
    .get();
  if (!row) throw new ApiError(404, "Task not found");
  return row;
}

function completedDatesForTask(taskId: string): string[] {
  const db = getDb();
  return db
    .select()
    .from(taskCompletedDates)
    .where(eq(taskCompletedDates.taskId, taskId))
    .all()
    .map((row) => row.dateKey);
}

function toTask(row: typeof tasks.$inferSelect): Task {
  return mapTaskRow(row, completedDatesForTask(row.id));
}

export function createTask(userId: string, input: CreateTaskInput): Task {
  const db = getDb();
  const id = `task-${randomUUID()}`;
  db.insert(tasks).values({
    id,
    userId,
    areaId: input.areaId,
    title: input.title,
    notes: input.notes ?? null,
    estimateMinutes: input.estimateMinutes,
    status: "open",
    scheduledDate: input.scheduledDate,
    scheduledTime: input.scheduledTime ?? null,
    dueDate: input.dueDate ?? null,
    recurrence: input.recurrence ?? "none",
    reminder: input.reminder ?? "none",
  }).run();
  return toTask(getTaskForUser(userId, id));
}

export function updateTask(
  userId: string,
  taskId: string,
  input: UpdateTaskInput,
): Task {
  getTaskForUser(userId, taskId);
  const db = getDb();
  db.update(tasks)
    .set({
      ...input,
      notes: input.notes === undefined ? undefined : input.notes,
    })
    .where(and(eq(tasks.id, taskId), eq(tasks.userId, userId)))
    .run();
  return toTask(getTaskForUser(userId, taskId));
}

export function deleteTask(userId: string, taskId: string): void {
  getTaskForUser(userId, taskId);
  const db = getDb();
  db.delete(tasks)
    .where(and(eq(tasks.id, taskId), eq(tasks.userId, userId)))
    .run();
}

export function completeTask(
  userId: string,
  taskId: string,
  occurrenceDate?: string,
): Task {
  const row = getTaskForUser(userId, taskId);
  const db = getDb();
  const task = toTask(row);

  if (isRecurring(task) && occurrenceDate) {
    const existing = new Set(task.completedDates ?? []);
    if (!existing.has(occurrenceDate)) {
      db.insert(taskCompletedDates).values({ taskId, dateKey: occurrenceDate }).run();
      existing.add(occurrenceDate);
    }
    return {
      ...task,
      completedDates: [...existing],
    };
  }

  db.update(tasks)
    .set({ status: "done" })
    .where(and(eq(tasks.id, taskId), eq(tasks.userId, userId)))
    .run();
  return toTask(getTaskForUser(userId, taskId));
}

export function buyTimeOnTask(
  userId: string,
  taskId: string,
  option: {
    title: string;
    costLabel: string;
    timeSavedMinutes: number;
  },
): Task {
  const row = getTaskForUser(userId, taskId);
  const db = getDb();
  db.update(tasks)
    .set({
      status: "bought_time",
      estimateMinutes: Math.max(15, row.estimateMinutes - option.timeSavedMinutes),
      notes: `Bought time: ${option.title} (${option.costLabel})`,
    })
    .where(and(eq(tasks.id, taskId), eq(tasks.userId, userId)))
    .run();
  return toTask(getTaskForUser(userId, taskId));
}
