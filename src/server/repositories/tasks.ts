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

async function getTaskForUser(userId: string, taskId: string) {
  const db = getDb();
  const row = await db
    .select()
    .from(tasks)
    .where(and(eq(tasks.id, taskId), eq(tasks.userId, userId)))
    .get();
  if (!row) throw new ApiError(404, "Task not found");
  return row;
}

async function completedDatesForTask(taskId: string): Promise<string[]> {
  const db = getDb();
  const rows = await db
    .select()
    .from(taskCompletedDates)
    .where(eq(taskCompletedDates.taskId, taskId))
    .all();
  return rows.map((row) => row.dateKey);
}

async function toTask(row: typeof tasks.$inferSelect): Promise<Task> {
  return mapTaskRow(row, await completedDatesForTask(row.id));
}

export async function createTask(
  userId: string,
  input: CreateTaskInput,
): Promise<Task> {
  const db = getDb();
  const id = `task-${randomUUID()}`;
  await db.insert(tasks).values({
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
  });
  return toTask(await getTaskForUser(userId, id));
}

export async function updateTask(
  userId: string,
  taskId: string,
  input: UpdateTaskInput,
): Promise<Task> {
  await getTaskForUser(userId, taskId);
  const db = getDb();
  await db
    .update(tasks)
    .set({
      ...input,
      notes: input.notes === undefined ? undefined : input.notes,
    })
    .where(and(eq(tasks.id, taskId), eq(tasks.userId, userId)));
  return toTask(await getTaskForUser(userId, taskId));
}

export async function deleteTask(userId: string, taskId: string): Promise<void> {
  await getTaskForUser(userId, taskId);
  const db = getDb();
  await db
    .delete(tasks)
    .where(and(eq(tasks.id, taskId), eq(tasks.userId, userId)));
}

export async function completeTask(
  userId: string,
  taskId: string,
  occurrenceDate?: string,
): Promise<Task> {
  const row = await getTaskForUser(userId, taskId);
  const db = getDb();
  const task = await toTask(row);

  if (isRecurring(task) && occurrenceDate) {
    const existing = new Set(task.completedDates ?? []);
    if (!existing.has(occurrenceDate)) {
      await db
        .insert(taskCompletedDates)
        .values({ taskId, dateKey: occurrenceDate });
      existing.add(occurrenceDate);
    }
    return {
      ...task,
      completedDates: [...existing],
    };
  }

  await db
    .update(tasks)
    .set({ status: "done" })
    .where(and(eq(tasks.id, taskId), eq(tasks.userId, userId)));
  return toTask(await getTaskForUser(userId, taskId));
}

export async function buyTimeOnTask(
  userId: string,
  taskId: string,
  option: {
    title: string;
    costLabel: string;
    timeSavedMinutes: number;
  },
): Promise<Task> {
  const row = await getTaskForUser(userId, taskId);
  const db = getDb();
  await db
    .update(tasks)
    .set({
      status: "bought_time",
      estimateMinutes: Math.max(15, row.estimateMinutes - option.timeSavedMinutes),
      notes: `Bought time: ${option.title} (${option.costLabel})`,
    })
    .where(and(eq(tasks.id, taskId), eq(tasks.userId, userId)));
  return toTask(await getTaskForUser(userId, taskId));
}
