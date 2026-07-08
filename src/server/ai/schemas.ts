import { z } from "zod";

export const capturePlanStepSchema = z.object({
  title: z.string().min(1).max(200),
  estimateMinutes: z.number().int().min(5).max(240),
  detail: z.string().max(500).optional(),
});

const dateKeySchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

const recurrenceSchema = z.enum(["none", "daily", "weekdays", "weekly"]);

const reminderSchema = z.union([
  z.enum(["none", "morning", "evening"]),
  z.string().regex(/^\d{2}:\d{2}$/),
  z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/),
]);

const captureActionSchema = z.enum([
  "create_task",
  "create_tasks",
  "clarify",
  "schedule_task",
  "complete_task",
  "update_task",
  "delete_task",
]);

type CaptureAction = z.infer<typeof captureActionSchema>;

/** Models often send [] for unused optional arrays — treat as omitted. */
function omitEmptyArray(val: unknown): unknown {
  if (Array.isArray(val) && val.length === 0) return undefined;
  return val;
}

function sanitizeTaskDraft(val: unknown): unknown {
  if (!val || typeof val !== "object" || Array.isArray(val)) return val;
  const task = { ...(val as Record<string, unknown>) };
  if (Array.isArray(task.planSteps) && task.planSteps.length === 0) {
    delete task.planSteps;
  }
  return task;
}

/** Strip irrelevant / malformed fields models often add alongside the real action. */
export function sanitizeCaptureRaw(val: unknown): unknown {
  if (!val || typeof val !== "object" || Array.isArray(val)) return val;

  const raw = { ...(val as Record<string, unknown>) };
  const action = raw.action as CaptureAction | undefined;

  if (raw.task) raw.task = sanitizeTaskDraft(raw.task);

  if (Array.isArray(raw.tasks)) {
    const tasks = raw.tasks.map(sanitizeTaskDraft);
    if (tasks.length === 0) {
      delete raw.tasks;
    } else if (tasks.length === 1) {
      if (
        (action === "create_task" || action === "create_tasks") &&
        !raw.task
      ) {
        raw.task = tasks[0];
      }
      delete raw.tasks;
    } else if (action !== "create_tasks") {
      delete raw.tasks;
    } else {
      raw.tasks = tasks;
    }
  }

  if (Array.isArray(raw.options) && raw.options.length < 2) {
    delete raw.options;
  }

  if (
    raw.updates &&
    typeof raw.updates === "object" &&
    !Array.isArray(raw.updates) &&
    Object.keys(raw.updates).length === 0
  ) {
    delete raw.updates;
  }

  switch (action) {
    case "complete_task":
    case "delete_task":
      delete raw.task;
      delete raw.tasks;
      delete raw.updates;
      delete raw.scheduledDate;
      delete raw.question;
      delete raw.options;
      break;
    case "schedule_task":
      delete raw.task;
      delete raw.tasks;
      delete raw.updates;
      delete raw.question;
      delete raw.options;
      break;
    case "update_task":
      delete raw.task;
      delete raw.tasks;
      delete raw.scheduledDate;
      delete raw.occurrenceDate;
      delete raw.question;
      delete raw.options;
      break;
    case "create_task":
      delete raw.tasks;
      delete raw.taskId;
      delete raw.updates;
      delete raw.scheduledDate;
      delete raw.occurrenceDate;
      delete raw.question;
      delete raw.options;
      break;
    case "create_tasks":
      delete raw.task;
      delete raw.taskId;
      delete raw.updates;
      delete raw.scheduledDate;
      delete raw.occurrenceDate;
      delete raw.question;
      delete raw.options;
      break;
    case "clarify":
      delete raw.task;
      delete raw.tasks;
      delete raw.taskId;
      delete raw.updates;
      delete raw.scheduledDate;
      delete raw.occurrenceDate;
      break;
  }

  return raw;
}

export const taskDraftSchema = z.object({
  title: z.string().min(1).max(200),
  areaId: z.string().min(1),
  estimateMinutes: z.number().int().min(0).max(480),
  notes: z.string().max(2000),
  dueDate: dateKeySchema.nullable(),
  pinnedDate: dateKeySchema.nullable().optional(),
  defaultSchedule: z
    .enum(["today", "tomorrow", "due", "backlog"])
    .optional(),
  planSteps: z.preprocess(
    omitEmptyArray,
    z.array(capturePlanStepSchema).min(1).max(8).optional(),
  ),
  recurrence: recurrenceSchema.optional(),
  reminder: reminderSchema.optional(),
});

export const taskUpdatesSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  areaId: z.string().min(1).optional(),
  estimateMinutes: z.number().int().min(1).max(480).optional(),
  notes: z.string().max(2000).nullable().optional(),
  dueDate: dateKeySchema.nullable().optional(),
  scheduledDate: dateKeySchema.nullable().optional(),
  recurrence: recurrenceSchema.optional(),
  reminder: reminderSchema.optional(),
});

const captureResponseCoreSchema = z.object({
  action: captureActionSchema,
  task: taskDraftSchema.optional(),
  tasks: z.array(taskDraftSchema).max(5).optional(),
  question: z.string().min(1).max(300).optional(),
  options: z.array(z.string().min(1).max(100)).max(6).optional(),
  taskId: z.string().min(1).optional(),
  scheduledDate: dateKeySchema.nullable().optional(),
  occurrenceDate: dateKeySchema.optional(),
  updates: taskUpdatesSchema.optional(),
  reasoning: z.string().max(500).optional(),
  confidence: z.enum(["high", "medium", "low"]).optional(),
});

/** Lenient schema for LLM output — business rules enforced in capture.ts */
export const captureResponseSchema = z.preprocess(
  sanitizeCaptureRaw,
  captureResponseCoreSchema,
);

export type CaptureResponse = z.infer<typeof captureResponseCoreSchema>;
export type TaskDraft = z.infer<typeof taskDraftSchema>;
export type TaskUpdatesDraft = z.infer<typeof taskUpdatesSchema>;
