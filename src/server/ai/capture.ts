import { generateObject, NoObjectGeneratedError, type FilePart } from "ai";
import type { ClarifyTurn, CaptureActionResult, CreateTaskDraft } from "@/lib/ai-capture";
import type { BootstrapResponse } from "@/lib/app-state";
import {
  addDays,
  type CaptureSuggestion,
  inferReminderFromText,
  parseAbsoluteReminder,
  resolvePreferredTime,
  scheduleChoiceForDateKey,
  type Recurrence,
  type Reminder,
  type ScheduleChoice,
  todayKey,
  type Task,
} from "@/lib/mock-data";
import { placeTask } from "@/lib/scheduling/placement";
import { resolvePlacementMode } from "@/lib/scheduling/resolve-placement-mode";
import { checkProtectedAreaFit } from "@/lib/scheduling/protected-area";
import { buildCaptureContext } from "@/server/ai/context";
import { getCapturePrompts } from "@/server/ai/prompt";
import {
  activeAiProviderLabel,
  requireAiModel,
} from "@/server/ai/providers";
import {
  captureResponseSchema,
  sanitizeCaptureRaw,
  type CaptureResponse,
  type TaskDraft,
  type TaskUpdatesDraft,
} from "@/server/ai/schemas";
import type { AiProviderId } from "@/server/ai/config";

export type CaptureInput = {
  bootstrap: BootstrapResponse;
  text?: string;
  image?: { data: Uint8Array; mimeType: string };
  clarifyHistory?: ClarifyTurn[];
};

export type CaptureOutput = {
  result: CaptureActionResult;
  provider: AiProviderId;
};

const MAX_IMAGE_BYTES = 4 * 1024 * 1024;

export async function captureTaskFromInput(
  input: CaptureInput,
): Promise<CaptureOutput> {
  const hasText = Boolean(input.text?.trim());
  const hasImage = Boolean(input.image);

  if (!hasText && !hasImage) {
    throw new Error("Text or image is required");
  }
  if (input.image && input.image.data.byteLength > MAX_IMAGE_BYTES) {
    throw new Error("Image must be under 4 MB");
  }

  const context = buildCaptureContext(input.bootstrap);
  const validAreaIds = new Set(
    input.bootstrap.areas
      .filter((a) => input.bootstrap.selectedIds.includes(a.id))
      .map((a) => a.id),
  );
  const openTasks = input.bootstrap.tasks.filter((t) => t.status === "open");

  const { system, user: userPrompt } = getCapturePrompts(context, {
    text: input.text,
    hasImage,
    clarifyHistory: input.clarifyHistory,
  });

  const userContent: Array<{ type: "text"; text: string } | FilePart> = [
    { type: "text", text: userPrompt },
  ];

  if (input.image) {
    userContent.push({
      type: "file",
      data: input.image.data,
      mediaType: input.image.mimeType,
    });
  }

  let object: CaptureResponse;
  try {
    ({ object } = await generateObject({
      model: requireAiModel(),
      schema: captureResponseSchema,
      system,
      messages: [{ role: "user", content: userContent }],
    }));
  } catch (error) {
    const repaired = repairCaptureResponse(error);
    if (!repaired) throw error;
    object = repaired;
  }

  const reconciled = reconcileCaptureAction(
    object,
    input.text,
    openTasks,
    validAreaIds,
  );
  const resolved = tryResolveExistingTaskUpdate(
    reconciled,
    input.text,
    openTasks,
  );
  const enriched = enrichCaptureFromText(resolved, input.text);
  const result = toCaptureActionResult(enriched, input.bootstrap);

  return {
    result,
    provider: activeAiProviderLabel(),
  };
}

function toCaptureActionResult(
  raw: CaptureResponse,
  bootstrap: BootstrapResponse,
): CaptureActionResult {
  const validAreaIds = new Set(
    bootstrap.areas
      .filter((a) => bootstrap.selectedIds.includes(a.id))
      .map((a) => a.id),
  );
  const openTasks = bootstrap.tasks.filter((t) => t.status === "open");
  const selectedAreas = bootstrap.areas.filter((a) =>
    bootstrap.selectedIds.includes(a.id),
  );
  const reasoning = raw.reasoning;
  const confidence = raw.confidence;

  switch (raw.action) {
    case "create_task": {
      const taskDraft = raw.task;
      if (!taskDraft) {
        return clarifyFallback("What task should I add?");
      }
      const protectedCheck = checkProtectedAreaFit(
        taskDraft.areaId,
        taskDraft.title,
        selectedAreas,
        bootstrap.protectedIds,
      );
      if (!protectedCheck.ok) {
        return {
          type: "clarify",
          question: protectedCheck.question,
          options: protectedCheck.options,
          reasoning,
        };
      }
      return {
        type: "create_task",
        draft: buildCreateDraftWithPlacement(
          taskDraft,
          validAreaIds,
          bootstrap,
        ),
        reasoning,
        confidence,
      };
    }
    case "create_tasks": {
      if (!raw.tasks || raw.tasks.length < 2) {
        if (raw.task) {
          const protectedCheck = checkProtectedAreaFit(
            raw.task.areaId,
            raw.task.title,
            selectedAreas,
            bootstrap.protectedIds,
          );
          if (!protectedCheck.ok) {
            return {
              type: "clarify",
              question: protectedCheck.question,
              options: protectedCheck.options,
              reasoning,
            };
          }
          return {
            type: "create_task",
            draft: buildCreateDraftWithPlacement(
              raw.task,
              validAreaIds,
              bootstrap,
            ),
            reasoning,
            confidence,
          };
        }
        return clarifyFallback("Which tasks should I add?");
      }
      return {
        type: "create_tasks",
        drafts: raw.tasks.map((task) =>
          buildCreateDraftWithPlacement(task, validAreaIds, bootstrap),
        ),
        reasoning,
        confidence,
      };
    }
    case "clarify": {
      if (!raw.question?.trim()) {
        return clarifyFallback("Can you say a bit more?");
      }
      return {
        type: "clarify",
        question: raw.question.trim(),
        options: raw.options,
        reasoning,
      };
    }
    case "schedule_task": {
      const task = resolveTask(raw.taskId, openTasks);
      if (!task) {
        return clarifyFallback("Which task should I reschedule?");
      }
      return {
        type: "schedule_task",
        task,
        scheduledDate: raw.scheduledDate ?? null,
        reasoning,
        confidence,
      };
    }
    case "complete_task": {
      const task = resolveTask(raw.taskId, openTasks);
      if (!task) {
        return clarifyFallback("Which task did you finish?");
      }
      return {
        type: "complete_task",
        task,
        occurrenceDate: raw.occurrenceDate,
        reasoning,
        confidence,
      };
    }
    case "update_task": {
      const task = resolveTask(raw.taskId, openTasks);
      if (!task || !raw.updates) {
        return clarifyFallback("Which task should I update, and what should change?");
      }
      const preview = applyUpdates(task, raw.updates, validAreaIds);
      return {
        type: "update_task",
        task,
        preview,
        reasoning,
        confidence,
      };
    }
    case "delete_task": {
      const task = resolveTask(raw.taskId, openTasks);
      if (!task) {
        return clarifyFallback("Which task should I remove?");
      }
      return {
        type: "delete_task",
        task,
        reasoning,
        confidence,
      };
    }
    default:
      return clarifyFallback("What would you like to do?");
  }
}

function clarifyFallback(question: string): CaptureActionResult {
  return { type: "clarify", question };
}

function resolveTask(taskId: string | undefined, openTasks: Task[]): Task | null {
  if (!taskId) return null;
  return openTasks.find((t) => t.id === taskId) ?? null;
}

function toCreateDraft(draft: TaskDraft, validAreaIds: Set<string>) {
  const reminder = normalizeReminder(draft.reminder);
  const normalized = alignDraftWithReminder(draft, reminder);
  const suggestion = toCaptureSuggestion(normalized, validAreaIds);
  return {
    suggestion,
    recurrence: (normalized.recurrence ?? "none") as Recurrence,
    reminder,
  };
}

function buildCreateDraftWithPlacement(
  draft: TaskDraft,
  validAreaIds: Set<string>,
  bootstrap: BootstrapResponse,
): CreateTaskDraft {
  const base = toCreateDraft(draft, validAreaIds);
  const area = bootstrap.areas.find((a) => a.id === base.suggestion.areaId);
  const dueDate =
    base.suggestion.dueInDays != null
      ? addDays(todayKey(), base.suggestion.dueInDays)
      : null;
  const absolute = parseAbsoluteReminder(base.reminder);
  const { mode, pinnedDate } = resolvePlacementMode(draft, base.reminder);
  const preferredTime = resolvePreferredTime({
    title: base.suggestion.title,
    reminder: base.reminder,
    recurrence: base.recurrence,
    scheduledDate: pinnedDate,
  });

  const placement = placeTask({
    usualWeek: bootstrap.usualWeek,
    tasks: bootstrap.tasks,
    areaId: base.suggestion.areaId,
    areaName: area?.name ?? base.suggestion.areaId,
    estimateMinutes: base.suggestion.estimateMinutes,
    dueDate,
    mode,
    pinnedDate,
    preferredTime,
    reminderDateKey: absolute?.dateKey ?? null,
  });

  return {
    ...base,
    placement,
    pinnedDate: draft.pinnedDate ?? pinnedDate,
  };
}

function alignDraftWithReminder(
  draft: TaskDraft,
  reminder: Reminder,
): TaskDraft {
  const absolute = parseAbsoluteReminder(reminder);
  let dueDate = draft.dueDate;
  let defaultSchedule: ScheduleChoice = draft.defaultSchedule ?? "today";
  let estimateMinutes = draft.estimateMinutes;

  if (absolute) {
    defaultSchedule = scheduleChoiceForDateKey(absolute.dateKey);
    if (!dueDate || dueDate === absolute.dateKey) {
      dueDate = defaultSchedule === "due" ? absolute.dateKey : null;
    }
  } else if (reminder !== "none" && estimateMinutes === 0) {
    dueDate = null;
  }

  if (estimateMinutes === 0) {
    return {
      ...draft,
      estimateMinutes: 0,
      dueDate,
      defaultSchedule,
      planSteps: undefined,
    };
  }

  return { ...draft, dueDate, defaultSchedule, estimateMinutes };
}

function normalizeReminder(value: string | undefined): Reminder {
  if (!value || value === "none") return "none";
  if (value === "morning" || value === "evening") return value;
  if (/^\d{2}:\d{2}$/.test(value)) return value;
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/.test(value)) return value;
  return "none";
}

function toCaptureSuggestion(
  result: TaskDraft,
  validAreaIds: Set<string>,
): CaptureSuggestion {
  const areaId = validAreaIds.has(result.areaId)
    ? result.areaId
    : ([...validAreaIds][0] ?? result.areaId);

  const today = todayKey();
  let dueInDays: number | null = null;
  if (result.dueDate) {
    const start = new Date(`${today}T12:00:00`);
    const end = new Date(`${result.dueDate}T12:00:00`);
    dueInDays = Math.max(
      0,
      Math.round((end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000)),
    );
  }

  let defaultSchedule: ScheduleChoice = result.defaultSchedule ?? "today";
  if (defaultSchedule === "due" && !result.dueDate) {
    defaultSchedule = "backlog";
  }
  if (defaultSchedule === "tomorrow") {
    const tomorrow = addDays(today, 1);
    if (result.dueDate && result.dueDate < tomorrow) {
      defaultSchedule = "due";
    }
  }

  const notes = mergeNotesWithPlanSteps(
    result.notes.trim(),
    result.estimateMinutes === 0 ? undefined : result.planSteps,
  );

  return {
    title: result.title.trim(),
    areaId,
    estimateMinutes: clampEstimate(result.estimateMinutes),
    notes,
    planSteps: (result.planSteps ?? []).map((step) => ({
      title: step.title.trim(),
      estimateMinutes: clamp(step.estimateMinutes, 5, 240),
      detail: step.detail?.trim(),
    })),
    buyTimeOptions: [],
    dueInDays,
    defaultSchedule,
  };
}

function mergeNotesWithPlanSteps(
  notes: string,
  planSteps: TaskDraft["planSteps"],
): string {
  if (!planSteps?.length) return notes;
  const checklist = planSteps
    .map((step) => `- [ ] ${step.title.trim()}`)
    .join("\n");
  if (!notes) return `Plan:\n${checklist}`;
  return `${notes}\n\nPlan:\n${checklist}`;
}

function applyUpdates(
  task: Task,
  updates: TaskUpdatesDraft,
  validAreaIds: Set<string>,
): Task {
  const next: Task = { ...task };

  if (updates.title !== undefined) next.title = updates.title.trim();
  if (updates.areaId !== undefined && validAreaIds.has(updates.areaId)) {
    next.areaId = updates.areaId;
  }
  if (updates.estimateMinutes !== undefined) {
    next.estimateMinutes = clamp(updates.estimateMinutes, 15, 480);
  }
  if (updates.notes !== undefined) {
    next.notes = updates.notes?.trim() || undefined;
  }
  if (updates.dueDate !== undefined) next.dueDate = updates.dueDate;
  if (updates.scheduledDate !== undefined) {
    next.scheduledDate = updates.scheduledDate;
  }
  if (updates.recurrence !== undefined) next.recurrence = updates.recurrence;
  if (updates.reminder !== undefined) {
    next.reminder = normalizeReminder(updates.reminder);
  }

  return next;
}

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, Math.round(n)));
}

function clampEstimate(minutes: number): number {
  if (minutes <= 0) return 0;
  return clamp(minutes, 15, 480);
}

function repairCaptureResponse(error: unknown): CaptureResponse | null {
  if (!NoObjectGeneratedError.isInstance(error) || !error.text) {
    return null;
  }
  try {
    const raw = JSON.parse(error.text) as unknown;
    const sanitized = sanitizeCaptureRaw(raw);
    const parsed = captureResponseSchema.safeParse(sanitized);
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

const MANAGEMENT_ACTIONS = new Set<CaptureResponse["action"]>([
  "schedule_task",
  "complete_task",
  "update_task",
  "delete_task",
]);

function hasManagementIntent(text: string): boolean {
  const t = text.toLowerCase();
  return /\b(done with|finished|finished with|complete|completed|mark .+ done|mark done|checked off|move existing|reschedule existing|update existing|move .+ to|reschedule|schedule .+ for|push .+ to|cancel|delete|remove|change .+ to|update .+|edit .+|rename .+ to|set .+ to)\b/.test(
    t,
  );
}

function looksLikeNewTaskDescription(text: string): boolean {
  const t = text.toLowerCase().trim();
  if (!t || hasManagementIntent(t)) return false;
  return /\b(need to|needs to|have to|has to|got to|gotta|should|want to|remember to|don't forget|call|email|text|buy|pick up|submit|send|file|pay|book|order|make an?|get|follow up|reach out|contact|invoice|invoice for)\b/.test(
    t,
  );
}

function normalizeTitle(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function titlesClearlyDiffer(a: string, b: string): boolean {
  const na = normalizeTitle(a);
  const nb = normalizeTitle(b);
  if (!na || !nb) return true;
  if (na === nb) return false;
  if (na.includes(nb) || nb.includes(na)) {
    return na.split(" ").length >= nb.split(" ").length + 2
      || nb.split(" ").length >= na.split(" ").length + 2;
  }
  return true;
}

/**
 * Models often pick update/complete on partial title overlap.
 * If the user described new work, coerce to create_task.
 */
function reconcileCaptureAction(
  raw: CaptureResponse,
  text: string | undefined,
  openTasks: Task[],
  validAreaIds: Set<string>,
): CaptureResponse {
  if (!text?.trim() || !MANAGEMENT_ACTIONS.has(raw.action)) {
    return raw;
  }

  const matched = raw.taskId
    ? openTasks.find((t) => t.id === raw.taskId)
    : undefined;
  const proposedTitle = raw.task?.title ?? raw.updates?.title;
  const newWork =
    looksLikeNewTaskDescription(text) &&
    !hasManagementIntent(text) &&
    (!matched ||
      !proposedTitle ||
      titlesClearlyDiffer(proposedTitle, matched.title));

  if (!newWork) return raw;

  const draft =
    raw.task ??
    draftFromMisclassifiedManagement(raw, text, matched, validAreaIds);
  if (!draft) return raw;

  return {
    action: "create_task",
    task: draft,
    reasoning:
      raw.reasoning ??
      "Sounds like a new task — creating it instead of changing an existing one.",
    confidence: raw.confidence,
  };
}

function draftFromMisclassifiedManagement(
  raw: CaptureResponse,
  text: string,
  matched: Task | undefined,
  validAreaIds: Set<string>,
): TaskDraft | undefined {
  const title =
    raw.updates?.title?.trim() ||
    raw.task?.title?.trim() ||
    text.trim().slice(0, 200);
  if (!title) return undefined;

  const fallbackArea = [...validAreaIds][0] ?? "chores";
  const areaId =
    raw.updates?.areaId ??
    raw.task?.areaId ??
    matched?.areaId ??
    fallbackArea;

  return {
    title,
    areaId: validAreaIds.has(areaId) ? areaId : fallbackArea,
    estimateMinutes: raw.updates?.estimateMinutes ?? raw.task?.estimateMinutes ?? 30,
    notes: raw.updates?.notes ?? raw.task?.notes ?? "",
    dueDate: raw.updates?.dueDate ?? raw.task?.dueDate ?? null,
    defaultSchedule:
      raw.task?.defaultSchedule ??
      inferReminderFromText(text)?.defaultSchedule ??
      "today",
    recurrence: raw.updates?.recurrence ?? raw.task?.recurrence,
    reminder:
      raw.updates?.reminder ??
      raw.task?.reminder ??
      inferReminderFromText(text)?.reminder,
  };
}

function hasReminderValue(value: string | undefined): boolean {
  return Boolean(value && value !== "none");
}

function enrichCaptureFromText(
  raw: CaptureResponse,
  text: string | undefined,
): CaptureResponse {
  if (!text?.trim()) return raw;

  const inferred = inferReminderFromText(text);
  if (!inferred) return raw;

  if (raw.action === "create_task" && raw.task) {
    const task = { ...raw.task };
    if (!hasReminderValue(task.reminder)) {
      task.reminder = inferred.reminder;
    }
    if (
      inferred.defaultSchedule === "tomorrow" &&
      task.defaultSchedule === "today"
    ) {
      task.defaultSchedule = "tomorrow";
    }
    return { ...raw, task };
  }

  if (raw.action === "update_task") {
    const updates = { ...(raw.updates ?? {}) };
    if (!hasReminderValue(updates.reminder)) {
      updates.reminder = inferred.reminder;
    }
    if (
      inferred.defaultSchedule === "tomorrow" &&
      updates.scheduledDate === undefined
    ) {
      updates.scheduledDate = addDays(todayKey(), 1);
    }
    return { ...raw, updates };
  }

  if (
    raw.action === "schedule_task" &&
    raw.scheduledDate === undefined &&
    inferred.defaultSchedule === "tomorrow"
  ) {
    return { ...raw, scheduledDate: addDays(todayKey(), 1) };
  }

  return raw;
}

function tryResolveExistingTaskUpdate(
  raw: CaptureResponse,
  text: string | undefined,
  openTasks: Task[],
): CaptureResponse {
  if (!text?.trim()) return raw;

  const t = text.toLowerCase();
  const wantsExisting =
    /\b(move existing|reschedule existing|update existing|move the existing)\b/.test(
      t,
    );
  if (!wantsExisting) return raw;

  const matched = findBestMatchingOpenTask(text, openTasks);
  if (!matched) return raw;

  const inferred = inferReminderFromText(text);
  const updates: TaskUpdatesDraft = { ...(raw.updates ?? {}) };

  if (
    raw.task?.title &&
    normalizeTitle(raw.task.title) !== normalizeTitle(text)
  ) {
    updates.title = raw.task.title;
  }
  if (raw.task?.estimateMinutes !== undefined) {
    updates.estimateMinutes = raw.task.estimateMinutes;
  }
  if (inferred) {
    if (!hasReminderValue(updates.reminder)) {
      updates.reminder = inferred.reminder;
    }
    if (
      inferred.defaultSchedule === "tomorrow" &&
      updates.scheduledDate === undefined
    ) {
      updates.scheduledDate = addDays(todayKey(), 1);
    }
  }

  return {
    action: "update_task",
    taskId: matched.id,
    updates,
    reasoning: raw.reasoning,
    confidence: raw.confidence,
  };
}

function findBestMatchingOpenTask(
  text: string,
  openTasks: Task[],
): Task | undefined {
  const normalized = normalizeTitle(text);
  let best: { task: Task; score: number } | undefined;

  for (const task of openTasks) {
    const title = normalizeTitle(task.title);
    if (!title) continue;

    if (normalized.includes(title) || title.includes(normalized)) {
      const score = title.length + 20;
      if (!best || score > best.score) best = { task, score };
      continue;
    }

    const words = title.split(" ").filter((w) => w.length > 2);
    const hits = words.filter((w) => normalized.includes(w)).length;
    if (hits >= 2) {
      const score = hits;
      if (!best || score > best.score) best = { task, score };
    }
  }

  return best?.task;
}
