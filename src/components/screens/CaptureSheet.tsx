"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type {
  CaptureActionResult,
  CaptureConfirm,
  ClarifyTurn,
  CreateTaskDraft,
} from "@/lib/ai-capture";
import type { PlacementResult } from "@/lib/scheduling/placement";
import {
  addDays,
  formatDateLabel,
  formatMinutes,
  isReminderOnlyTask,
  parseAbsoluteReminder,
  resolvePreferredTime,
  reminderLabel,
  todayKey,
  type AreaDef,
  type Reminder,
  type Task,
  type UsualWeekBlock,
} from "@/lib/mock-data";
import {
  canConfirmPlacement,
  placeTask,
  scheduledDateFromPlacement,
  scheduledTimeFromPlacement,
} from "@/lib/scheduling/placement";
import {
  checkProtectedAreaFit,
  type ProtectedAreaCheck,
} from "@/lib/scheduling/protected-area";
import { PlacementPanel } from "@/components/scheduling/PlacementPanel";
import {
  ProtectedAreaPrompt,
  resolveProtectedAreaOption,
} from "@/components/scheduling/ProtectedAreaPrompt";
import { ReminderPicker } from "@/components/ui/ReminderPicker";
import { api } from "@/lib/api";
import { PanelBody } from "@/components/ui/Panel";
import { Sheet, SheetBody, SheetHeader } from "@/components/ui/Sheet";

export type { CaptureConfirm };

type CaptureSheetProps = {
  areas: AreaDef[];
  usualWeek: UsualWeekBlock[];
  tasks: Task[];
  protectedIds: string[];
  embedded?: boolean;
  onClose: () => void;
  onConfirm: (payload: CaptureConfirm) => void;
  onOpenManual?: () => void;
};

type Phase = "input" | "clarify" | "review";
type InputMode = "text" | "photo";

const ESTIMATE_PRESETS = [15, 30, 45, 60, 90, 120, 180];

const MAX_IMAGE_BYTES = 4 * 1024 * 1024;

const TEXT_INPUT_PLACEHOLDER =
  "Add a task, reschedule, mark done, update, or remove — type naturally, e.g. “Call dentist Friday” or “Move groceries to tomorrow”";

const INPUT_EXAMPLES = [
  "Call dentist — due Friday",
  "Move groceries to tomorrow",
  "Done with laundry",
  "Cancel dry cleaning appointment",
];

export function CaptureSheet({
  areas,
  usualWeek,
  tasks,
  protectedIds,
  embedded = false,
  onClose,
  onConfirm,
  onOpenManual,
}: CaptureSheetProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [phase, setPhase] = useState<Phase>("input");
  const [inputMode, setInputMode] = useState<InputMode>("text");
  const [text, setText] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [sorting, setSorting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [captureResult, setCaptureResult] = useState<CaptureActionResult | null>(
    null,
  );
  const [clarifyHistory, setClarifyHistory] = useState<ClarifyTurn[]>([]);
  const [clarifyAnswer, setClarifyAnswer] = useState("");
  const [aiProvider, setAiProvider] = useState<string | null>(null);

  const [createDraft, setCreateDraft] = useState<CreateTaskDraft | null>(null);
  const [createDrafts, setCreateDrafts] = useState<CreateTaskDraft[]>([]);
  const [explicitBacklog, setExplicitBacklog] = useState(false);
  const [pinnedDateOverride, setPinnedDateOverride] = useState<string | null>(
    null,
  );
  const [areaMismatch, setAreaMismatch] =
    useState<Extract<ProtectedAreaCheck, { ok: false }> | null>(null);
  const [areaMismatchResolved, setAreaMismatchResolved] = useState(false);

  const [aiStatus, setAiStatus] = useState<Awaited<
    ReturnType<typeof api.ai.status>
  > | null>(null);

  useEffect(() => {
    void api.ai
      .status()
      .then(setAiStatus)
      .catch(() => setAiStatus(null));
  }, []);

  useEffect(() => {
    return () => {
      if (imagePreview) URL.revokeObjectURL(imagePreview);
    };
  }, [imagePreview]);

  const canSort =
    aiStatus?.configured !== false &&
    (inputMode === "text" ? Boolean(text.trim()) : Boolean(imageFile));

  function handlePickImage(file: File | null) {
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    if (!file) {
      setImageFile(null);
      setImagePreview(null);
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setError("Image must be under 4 MB. Try a smaller photo.");
      return;
    }
    setError(null);
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  }

  function applyCaptureResult(result: CaptureActionResult, provider: string) {
    setCaptureResult(result);
    setAiProvider(provider);

    if (result.type === "clarify") {
      setPhase("clarify");
      setClarifyAnswer("");
      return;
    }

    if (result.type === "create_task") {
      setCreateDraft(result.draft);
      setExplicitBacklog(false);
      setPinnedDateOverride(null);
      syncAreaGuard(result.draft);
    }
    if (result.type === "create_tasks") {
      setCreateDrafts(result.drafts);
      setExplicitBacklog(false);
      setPinnedDateOverride(null);
    }

    setPhase("review");
  }

  async function runCapture(history: ClarifyTurn[] = clarifyHistory) {
    if (!canSort && phase !== "clarify") return;
    setSorting(true);
    setError(null);
    try {
      const result =
        inputMode === "photo" && imageFile
          ? await api.ai.captureImage(imageFile, text || undefined, history)
          : await api.ai.captureText(text.trim(), history);

      applyCaptureResult(result.result, result.provider);
    } catch (err) {
      setError(err instanceof Error ? err.message : "AI capture failed");
    } finally {
      setSorting(false);
    }
  }

  async function handleClarifySubmit(answer: string) {
    if (!captureResult || captureResult.type !== "clarify" || !answer.trim()) {
      return;
    }
    const nextHistory: ClarifyTurn[] = [
      ...clarifyHistory,
      { question: captureResult.question, answer: answer.trim() },
    ];
    setClarifyHistory(nextHistory);
    setSorting(true);
    setError(null);
    try {
      const result =
        inputMode === "photo" && imageFile
          ? await api.ai.captureImage(imageFile, text || undefined, nextHistory)
          : await api.ai.captureText(text.trim(), nextHistory);
      applyCaptureResult(result.result, result.provider);
    } catch (err) {
      setError(err instanceof Error ? err.message : "AI capture failed");
    } finally {
      setSorting(false);
    }
  }

  function goBackToInput() {
    setPhase("input");
    setCaptureResult(null);
    setCreateDraft(null);
    setCreateDrafts([]);
    setExplicitBacklog(false);
    setPinnedDateOverride(null);
    setAreaMismatch(null);
    setAreaMismatchResolved(false);
    setError(null);
  }

  function syncAreaGuard(draft: CreateTaskDraft) {
    const check = checkProtectedAreaFit(
      draft.suggestion.areaId,
      draft.suggestion.title,
      areas,
      protectedIds,
    );
    if (!check.ok) {
      setAreaMismatch(check);
      setAreaMismatchResolved(false);
    } else {
      setAreaMismatch(null);
      setAreaMismatchResolved(false);
    }
  }

  function dueDateForDraft(draft: CreateTaskDraft): string | null {
    return draft.suggestion.dueInDays != null
      ? addDays(todayKey(), draft.suggestion.dueInDays)
      : null;
  }

  function computePlacement(
    draft: CreateTaskDraft,
    areaName: string,
    backlog: boolean,
    pinnedOverride: string | null,
  ) {
    const dueDate = dueDateForDraft(draft);
    const absolute = parseAbsoluteReminder(draft.reminder);
    const pinned =
      pinnedOverride ?? draft.pinnedDate ?? absolute?.dateKey ?? null;
    const preferredTime = resolvePreferredTime({
      title: draft.suggestion.title,
      reminder: draft.reminder,
      recurrence: draft.recurrence,
      scheduledDate: pinned,
    });
    return placeTask({
      usualWeek,
      tasks,
      areaId: draft.suggestion.areaId,
      areaName,
      estimateMinutes: draft.suggestion.estimateMinutes,
      dueDate,
      mode: backlog ? "backlog" : pinned ? "pinned" : "auto",
      pinnedDate: pinned,
      preferredTime,
      reminderDateKey: absolute?.dateKey ?? null,
    });
  }

  function updateCreateDraft(patch: Partial<CreateTaskDraft["suggestion"]>) {
    if (!createDraft) return;
    const next: CreateTaskDraft = {
      ...createDraft,
      suggestion: { ...createDraft.suggestion, ...patch },
    };
    setCreateDraft(next);
    if (patch.areaId !== undefined || patch.title !== undefined) {
      syncAreaGuard(next);
    }
  }

  function handleAreaMismatchOption(option: string) {
    if (!createDraft || !areaMismatch) return;
    const resolved = resolveProtectedAreaOption(
      option,
      areas,
      createDraft.suggestion.areaId,
    );
    if (resolved.keepAnyway) {
      setAreaMismatchResolved(true);
      return;
    }
    if (resolved.areaId) {
      updateCreateDraft({ areaId: resolved.areaId });
    }
  }

  function updateMultiDraft(
    index: number,
    patch: Partial<CreateTaskDraft["suggestion"]>,
  ) {
    setCreateDrafts((prev) =>
      prev.map((draft, i) =>
        i === index
          ? { ...draft, suggestion: { ...draft.suggestion, ...patch } }
          : draft,
      ),
    );
  }

  function removeMultiDraft(index: number) {
    setCreateDrafts((prev) => prev.filter((_, i) => i !== index));
  }

  const createArea = createDraft
    ? areas.find((a) => a.id === createDraft.suggestion.areaId)
    : undefined;

  const createDueDate = createDraft ? dueDateForDraft(createDraft) : null;

  const createPlacement = useMemo(() => {
    if (!createDraft || !createArea) return null;
    return computePlacement(
      createDraft,
      createArea.name,
      explicitBacklog,
      pinnedDateOverride,
    );
  }, [
    createDraft,
    createArea,
    explicitBacklog,
    pinnedDateOverride,
    usualWeek,
    tasks,
  ]);

  const canConfirmCreate =
    createDraft &&
    createPlacement &&
    canConfirmPlacement(createPlacement, explicitBacklog) &&
    (!areaMismatch || areaMismatchResolved);

  function confirmCreateTask() {
    if (!createDraft || !createPlacement || !canConfirmCreate) return;
    onConfirm({
      action: "create_task",
      draft: createDraft,
      scheduledDate: explicitBacklog
        ? null
        : scheduledDateFromPlacement(createPlacement),
      scheduledTime: explicitBacklog
        ? null
        : scheduledTimeFromPlacement(createPlacement),
      dueDate: createDueDate,
    });
  }

  function confirmCreateTasks() {
    if (createDrafts.length === 0) return;
    const items = createDrafts.map((draft) => {
      const area = areas.find((a) => a.id === draft.suggestion.areaId);
      const placement = computePlacement(
        draft,
        area?.name ?? draft.suggestion.areaId,
        false,
        null,
      );
      if (placement.status === "unachievable") return null;
      return {
        draft,
        scheduledDate: scheduledDateFromPlacement(placement),
        scheduledTime: scheduledTimeFromPlacement(placement),
        dueDate: dueDateForDraft(draft),
      };
    });
    if (items.some((item) => item === null)) return;
    onConfirm({
      action: "create_tasks",
      drafts: items as Array<{
        draft: CreateTaskDraft;
        scheduledDate: string | null;
        scheduledTime: string | null;
        dueDate: string | null;
      }>,
    });
  }

  function taskArea(task: Task) {
    return areas.find((a) => a.id === task.areaId);
  }

  const content = (
    <>
      {phase === "input" && (
        <>
          {!embedded && (
            <SheetHeader
              title="Capture"
              subtitle="Type naturally — add, reschedule, complete, update, or remove tasks."
            />
          )}
          {embedded && (
            <p className="mb-4 text-xs leading-relaxed text-app-muted">
              Type naturally — add, reschedule, complete, update, or remove tasks.
            </p>
          )}

          <div className={`card-app flex p-1 ${embedded ? "" : "mt-4"}`}>
            {(
              [
                { id: "text" as const, label: "Type" },
                { id: "photo" as const, label: "Photo" },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setInputMode(tab.id)}
                className={`flex-1 rounded-lg py-2 text-sm font-medium transition ${
                  inputMode === tab.id ? "btn-chip-active" : "text-app-secondary"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {aiStatus && !aiStatus.configured && (
            <div className="mt-3 rounded-2xl border border-app-warning bg-app-warning px-3.5 py-3 text-sm text-app-warning-soft">
              <p className="font-medium">AI not configured</p>
              <p className="mt-1 text-xs leading-relaxed">
                {aiStatus.setupHint} Copy <code className="text-app">env.example</code> to{" "}
                <code className="text-app">.env.local</code> and restart the dev server.
              </p>
            </div>
          )}

          {error && (
            <div className="mt-3 rounded-2xl border border-app-warning bg-app-warning px-3.5 py-2.5 text-sm text-app-warning-soft">
              {error}
            </div>
          )}

          {inputMode === "text" ? (
            <>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => {
                  if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
                    e.preventDefault();
                    void runCapture();
                  }
                }}
                rows={5}
                className="input-app mt-4 resize-none px-4 py-3.5 text-[15px] leading-relaxed"
                placeholder={TEXT_INPUT_PLACEHOLDER}
              />
              <p className="mt-2 text-[11px] leading-relaxed text-app-faint">
                Examples: {INPUT_EXAMPLES.join(" · ")}
              </p>
            </>
          ) : (
            <div className="mt-4">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={(e) => handlePickImage(e.target.files?.[0] ?? null)}
              />
              {imagePreview ? (
                <div className="overflow-hidden rounded-2xl border border-app">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={imagePreview}
                    alt="Selected"
                    className="max-h-48 w-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => handlePickImage(null)}
                    className="w-full border-t border-app py-2 text-xs font-medium text-app-muted"
                  >
                    Remove photo
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex w-full flex-col items-center justify-center rounded-2xl border border-dashed border-app-strong bg-app-card py-10"
                >
                  <span className="text-2xl">📷</span>
                  <span className="mt-2 text-sm font-medium text-app">
                    Take or choose photo
                  </span>
                </button>
              )}
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={2}
                className="input-app mt-3 resize-none px-4 py-3 text-sm"
                placeholder="Optional — add context or say what to do (e.g. due Friday, mark done)"
              />
            </div>
          )}

          <button
            type="button"
            disabled={!canSort || sorting}
            onClick={() => void runCapture()}
            className="btn-primary btn-lg mt-4 w-full disabled:opacity-50"
          >
            {sorting ? "Sorting…" : "Let AI sort it"}
          </button>

          {onOpenManual && (
            <button
              type="button"
              onClick={onOpenManual}
              className="mt-3 w-full py-2 text-sm text-app-muted"
            >
              Enter manually instead
            </button>
          )}
        </>
      )}

      {phase === "clarify" && captureResult?.type === "clarify" && (
        <>
          <p className="text-[11px] font-medium uppercase tracking-wider text-app-accent-soft">
            Quick question
          </p>
          <h2 className="mt-1 text-lg font-semibold text-app">
            {captureResult.question}
          </h2>
          {captureResult.reasoning && (
            <p className="mt-2 text-sm text-app-muted">{captureResult.reasoning}</p>
          )}

          {captureResult.options && captureResult.options.length > 0 ? (
            <div className="mt-4 flex flex-wrap gap-2">
              {captureResult.options.map((option) => (
                <button
                  key={option}
                  type="button"
                  disabled={sorting}
                  onClick={() => void handleClarifySubmit(option)}
                  className="btn-chip px-3 py-2 text-sm"
                >
                  {option}
                </button>
              ))}
            </div>
          ) : (
            <textarea
              value={clarifyAnswer}
              onChange={(e) => setClarifyAnswer(e.target.value)}
              rows={2}
              className="input-app mt-4 resize-none px-4 py-3 text-sm"
              placeholder="Your answer"
            />
          )}

          {(!captureResult.options || captureResult.options.length === 0) && (
            <button
              type="button"
              disabled={!clarifyAnswer.trim() || sorting}
              onClick={() => void handleClarifySubmit(clarifyAnswer)}
              className="btn-primary btn-lg mt-4 w-full disabled:opacity-50"
            >
              {sorting ? "Sorting…" : "Continue"}
            </button>
          )}

          {error && (
            <div className="mt-3 rounded-2xl border border-app-warning bg-app-warning px-3.5 py-2.5 text-sm text-app-warning-soft">
              {error}
            </div>
          )}

          <button
            type="button"
            onClick={goBackToInput}
            className="btn-secondary btn-lg mt-3 w-full"
          >
            Back
          </button>
        </>
      )}

      {phase === "review" && captureResult && captureResult.type === "create_task" && createDraft && createArea && createPlacement && (
        <CreateTaskReview
          draft={createDraft}
          area={createArea}
          areas={areas}
          placement={createPlacement}
          explicitBacklog={explicitBacklog}
          pinnedDateOverride={pinnedDateOverride}
          dueDate={createDueDate}
          canConfirm={!!canConfirmCreate}
          aiProvider={aiProvider}
          reasoning={captureResult.reasoning}
          onExplicitBacklogChange={setExplicitBacklog}
          onPinnedDateChange={setPinnedDateOverride}
          onDraftChange={updateCreateDraft}
          areaMismatch={areaMismatch && !areaMismatchResolved ? areaMismatch : null}
          onAreaMismatchOption={handleAreaMismatchOption}
          onReminderChange={(reminder) => {
            setCreateDraft((prev) => (prev ? { ...prev, reminder } : null));
            const absolute = parseAbsoluteReminder(reminder);
            if (absolute) {
              setExplicitBacklog(false);
              setPinnedDateOverride(absolute.dateKey);
            }
          }}
          onBack={goBackToInput}
          onConfirm={confirmCreateTask}
        />
      )}

      {phase === "review" && captureResult?.type === "create_tasks" && (
        <>
          <ActionHeader
            label="Add tasks"
            provider={aiProvider}
            reasoning={captureResult.reasoning}
          />
          <div className="mt-4 space-y-4">
            {createDrafts.map((draft, index) => {
              const area = areas.find((a) => a.id === draft.suggestion.areaId);
              const dueDate = dueDateForDraft(draft);
              const placement = area
                ? computePlacement(draft, area.name, false, null)
                : null;
              const blocked = placement?.status === "unachievable";
              return (
                <div
                  key={`${draft.suggestion.title}-${index}`}
                  className={`rounded-2xl border p-3 ${
                    blocked ? "border-app-warning bg-app-warning" : "border-app bg-app-card"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <input
                      value={draft.suggestion.title}
                      onChange={(e) =>
                        updateMultiDraft(index, { title: e.target.value })
                      }
                      className="input-app flex-1 px-3 py-2 text-sm font-medium"
                    />
                    {createDrafts.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeMultiDraft(index)}
                        className="shrink-0 text-xs text-app-muted"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                  {area && (
                    <p className="mt-2 text-xs text-app-muted">
                      {area.name} · ~{formatMinutes(draft.suggestion.estimateMinutes)}
                      {dueDate ? ` · Due ${formatDateLabel(dueDate)}` : ""}
                    </p>
                  )}
                  {placement && (
                    <PlacementPanel
                      placement={placement}
                      explicitBacklog={false}
                      reminderOnly={isReminderOnlyTask(
                        draft.suggestion.estimateMinutes,
                        draft.reminder,
                      )}
                      className="mt-2"
                    />
                  )}
                </div>
              );
            })}
          </div>
          <div className="mt-5 flex gap-3">
            <button type="button" onClick={goBackToInput} className="btn-secondary btn-lg flex-1">
              Back
            </button>
            <button
              type="button"
              onClick={confirmCreateTasks}
              disabled={
                createDrafts.length === 0 ||
                createDrafts.some((draft) => {
                  const area = areas.find((a) => a.id === draft.suggestion.areaId);
                  if (!area) return true;
                  return (
                    computePlacement(draft, area.name, false, null).status ===
                    "unachievable"
                  );
                })
              }
              className="btn-primary btn-lg flex-[1.4] disabled:opacity-50"
            >
              Add {createDrafts.length} task{createDrafts.length === 1 ? "" : "s"}
            </button>
          </div>
        </>
      )}

      {phase === "review" && captureResult?.type === "schedule_task" && (
        <ManagementReview
          actionLabel="Reschedule"
          task={captureResult.task}
          area={taskArea(captureResult.task)}
          provider={aiProvider}
          reasoning={captureResult.reasoning}
          detail={
            captureResult.scheduledDate
              ? `Move to ${formatDateLabel(captureResult.scheduledDate)}`
              : "Move to backlog"
          }
          onBack={goBackToInput}
          onConfirm={() =>
            onConfirm({
              action: "schedule_task",
              taskId: captureResult.task.id,
              scheduledDate: captureResult.scheduledDate,
            })
          }
          confirmLabel="Reschedule"
        />
      )}

      {phase === "review" && captureResult?.type === "complete_task" && (
        <ManagementReview
          actionLabel="Complete"
          task={captureResult.task}
          area={taskArea(captureResult.task)}
          provider={aiProvider}
          reasoning={captureResult.reasoning}
          detail={
            captureResult.occurrenceDate
              ? `Mark done for ${formatDateLabel(captureResult.occurrenceDate)}`
              : "Mark as done"
          }
          onBack={goBackToInput}
          onConfirm={() =>
            onConfirm({
              action: "complete_task",
              taskId: captureResult.task.id,
              occurrenceDate: captureResult.occurrenceDate,
            })
          }
          confirmLabel="Mark done"
        />
      )}

      {phase === "review" && captureResult?.type === "update_task" && (
        <ManagementReview
          actionLabel="Update"
          task={captureResult.task}
          area={taskArea(captureResult.task)}
          provider={aiProvider}
          reasoning={captureResult.reasoning}
          detail={describeTaskChanges(captureResult.task, captureResult.preview)}
          onBack={goBackToInput}
          onConfirm={() =>
            onConfirm({
              action: "update_task",
              taskId: captureResult.task.id,
              preview: captureResult.preview,
            })
          }
          confirmLabel="Save changes"
        />
      )}

      {phase === "review" && captureResult?.type === "delete_task" && (
        <ManagementReview
          actionLabel="Remove"
          task={captureResult.task}
          area={taskArea(captureResult.task)}
          provider={aiProvider}
          reasoning={captureResult.reasoning}
          detail="This task will be permanently removed."
          onBack={goBackToInput}
          onConfirm={() =>
            onConfirm({
              action: "delete_task",
              taskId: captureResult.task.id,
            })
          }
          confirmLabel="Remove task"
          destructive
        />
      )}
    </>
  );

  if (embedded) {
    return (
      <div className="flex min-h-0 flex-1 flex-col">
        <PanelBody className="pb-6">{content}</PanelBody>
      </div>
    );
  }

  return (
    <Sheet onClose={onClose} maxHeight="max-h-[92%]">
      <SheetBody className="pb-8 pt-1">{content}</SheetBody>
    </Sheet>
  );
}

function ActionHeader({
  label,
  provider,
  reasoning,
}: {
  label: string;
  provider: string | null;
  reasoning?: string;
}) {
  return (
    <>
      <p className="text-[11px] font-medium uppercase tracking-wider text-app-accent-soft">
        {label}
        {provider ? (
          <span className="ml-2 normal-case text-app-faint">via {provider}</span>
        ) : null}
      </p>
      {reasoning && (
        <p className="mt-2 text-sm leading-relaxed text-app-muted">{reasoning}</p>
      )}
    </>
  );
}

function CreateTaskReview({
  draft,
  area,
  areas,
  placement,
  explicitBacklog,
  pinnedDateOverride,
  dueDate,
  canConfirm,
  areaMismatch,
  onAreaMismatchOption,
  aiProvider,
  reasoning,
  onExplicitBacklogChange,
  onPinnedDateChange,
  onDraftChange,
  onReminderChange,
  onBack,
  onConfirm,
}: {
  draft: CreateTaskDraft;
  area: AreaDef;
  areas: AreaDef[];
  placement: PlacementResult;
  explicitBacklog: boolean;
  pinnedDateOverride: string | null;
  dueDate: string | null;
  canConfirm: boolean;
  areaMismatch: Extract<ProtectedAreaCheck, { ok: false }> | null;
  onAreaMismatchOption: (option: string) => void;
  aiProvider: string | null;
  reasoning?: string;
  onExplicitBacklogChange: (backlog: boolean) => void;
  onPinnedDateChange: (dateKey: string | null) => void;
  onDraftChange: (patch: Partial<CreateTaskDraft["suggestion"]>) => void;
  onReminderChange: (reminder: Reminder) => void;
  onBack: () => void;
  onConfirm: () => void;
}) {
  const { suggestion } = draft;
  const reminderOnly = isReminderOnlyTask(
    suggestion.estimateMinutes,
    draft.reminder,
  );
  const scheduleMode = explicitBacklog
    ? "someday"
    : pinnedDateOverride !== null
      ? "pick"
      : "suggestion";
  const scheduledDate = explicitBacklog
    ? null
    : scheduledDateFromPlacement(placement);

  return (
    <>
      <ActionHeader label="New task" provider={aiProvider} reasoning={reasoning} />

      <label className="mt-4 block">
        <span className="mb-1.5 block text-xs font-medium text-app-muted">Title</span>
        <input
          value={suggestion.title}
          onChange={(e) => onDraftChange({ title: e.target.value })}
          className="input-app w-full px-4 py-3 text-[15px]"
        />
      </label>

      <div className="mt-4">
        <p className="mb-1.5 text-xs font-medium text-app-muted">Life area</p>
        <div className="flex flex-wrap gap-2">
          {areas.map((a) => (
            <button
              key={a.id}
              type="button"
              onClick={() => onDraftChange({ areaId: a.id })}
              className={`flex items-center gap-1.5 px-3 py-1.5 btn-chip ${
                a.id === suggestion.areaId ? "btn-chip-active" : ""
              }`}
            >
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: a.color }}
              />
              {a.name}
            </button>
          ))}
        </div>
      </div>

      {areaMismatch && (
        <div className="mt-3">
          <ProtectedAreaPrompt
            check={areaMismatch}
            onSelect={onAreaMismatchOption}
          />
        </div>
      )}

      <div className="mt-4">
        {reminderOnly ? (
          <p className="text-sm text-app-secondary">
            Reminder only — no time on your life-area budget.
          </p>
        ) : (
          <>
            <p className="mb-1.5 text-xs font-medium text-app-muted">
              How long? · {formatMinutes(suggestion.estimateMinutes)}
            </p>
            <div className="flex flex-wrap gap-2">
              {[0, ...ESTIMATE_PRESETS].map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => onDraftChange({ estimateMinutes: m })}
                  className={`px-3 py-1.5 btn-chip ${
                    suggestion.estimateMinutes === m ? "btn-chip-active" : ""
                  }`}
                >
                  {m === 0 ? "No time" : formatMinutes(m)}
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      <div className="mt-4">
        <p className="mb-1.5 text-xs font-medium text-app-muted">Reminder</p>
        <ReminderPicker
          value={draft.reminder}
          recurring={draft.recurrence !== "none"}
          onChange={onReminderChange}
          defaultDateKey={scheduledDate ?? todayKey()}
          variant="chips"
        />
      </div>

      {draft.recurrence !== "none" && (
        <div className="mt-3 flex flex-wrap gap-2">
          <span className="rounded-full border border-app bg-app-input px-3 py-1.5 text-xs text-app">
            Repeats {draft.recurrence}
          </span>
        </div>
      )}

      {!reminderOnly && (
        <>
          <div className="mt-4">
            <p className="text-xs font-medium text-app-muted">Schedule</p>
            <div className="mt-2 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => {
                  onExplicitBacklogChange(false);
                  onPinnedDateChange(null);
                }}
                className={`px-3 py-1.5 btn-chip ${
                  scheduleMode === "suggestion" ? "btn-chip-active" : ""
                }`}
              >
                Use suggestion
              </button>
              <button
                type="button"
                onClick={() => {
                  onExplicitBacklogChange(false);
                  onPinnedDateChange(
                    pinnedDateOverride ??
                      scheduledDateFromPlacement(placement) ??
                      todayKey(),
                  );
                }}
                className={`px-3 py-1.5 btn-chip ${
                  scheduleMode === "pick" ? "btn-chip-active" : ""
                }`}
              >
                Pick date
              </button>
              <button
                type="button"
                onClick={() => {
                  onExplicitBacklogChange(true);
                  onPinnedDateChange(null);
                }}
                className={`px-3 py-1.5 btn-chip ${
                  scheduleMode === "someday" ? "btn-chip-active" : ""
                }`}
              >
                Someday
              </button>
            </div>
            {scheduleMode === "pick" && pinnedDateOverride && (
              <input
                type="date"
                value={pinnedDateOverride}
                min={todayKey()}
                onChange={(e) => onPinnedDateChange(e.target.value || null)}
                className="input-app mt-2 w-full px-3 py-2 text-sm"
              />
            )}
            {dueDate && scheduledDate && dueDate !== scheduledDate && (
              <p className="mt-2 text-[11px] text-app-faint">
                Due {formatDateLabel(dueDate)}
              </p>
            )}
          </div>

          <PlacementPanel
            placement={placement}
            explicitBacklog={explicitBacklog}
            reminderOnly={false}
          />
        </>
      )}

      {suggestion.planSteps.length > 0 && (
        <div className="mt-4">
          <p className="text-xs font-medium text-app-muted">Plan preview</p>
          <ul className="mt-2 space-y-2">
            {suggestion.planSteps.map((step) => (
              <li
                key={step.title}
                className="flex items-start gap-2 text-sm text-app-secondary"
              >
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--accent)]" />
                <span>
                  {step.title}
                  <span className="text-app-faint">
                    {" "}
                    · {formatMinutes(step.estimateMinutes)}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-5 flex gap-3">
        <button type="button" onClick={onBack} className="btn-secondary btn-lg flex-1">
          Back
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={!canConfirm}
          className="btn-primary btn-lg flex-[1.4] disabled:opacity-50"
        >
          {placement.status === "unachievable" && !explicitBacklog
            ? "No room — adjust first"
            : `Add to ${area.name}`}
        </button>
      </div>
    </>
  );
}

function ManagementReview({
  actionLabel,
  task,
  area,
  provider,
  reasoning,
  detail,
  onBack,
  onConfirm,
  confirmLabel,
  destructive = false,
}: {
  actionLabel: string;
  task: Task;
  area?: AreaDef;
  provider: string | null;
  reasoning?: string;
  detail: string;
  onBack: () => void;
  onConfirm: () => void;
  confirmLabel: string;
  destructive?: boolean;
}) {
  return (
    <>
      <ActionHeader label={actionLabel} provider={provider} reasoning={reasoning} />
      <h2 className="mt-3 text-lg font-semibold text-app">{task.title}</h2>
      {area && (
        <p className="mt-2 text-sm text-app-muted">
          {area.name} · ~{formatMinutes(task.estimateMinutes)}
        </p>
      )}
      <p className="mt-3 text-sm text-app-secondary">{detail}</p>
      <div className="mt-5 flex gap-3">
        <button type="button" onClick={onBack} className="btn-secondary btn-lg flex-1">
          Back
        </button>
        <button
          type="button"
          onClick={onConfirm}
          className={`btn-lg flex-[1.4] ${
            destructive
              ? "rounded-2xl bg-red-500/90 font-semibold text-white"
              : "btn-primary"
          }`}
        >
          {confirmLabel}
        </button>
      </div>
    </>
  );
}

function describeTaskChanges(before: Task, after: Task): string {
  const parts: string[] = [];
  if (before.title !== after.title) {
    parts.push(`Title → "${after.title}"`);
  }
  if (before.areaId !== after.areaId) {
    parts.push("Life area changed");
  }
  if (before.estimateMinutes !== after.estimateMinutes) {
    parts.push(`Estimate → ${formatMinutes(after.estimateMinutes)}`);
  }
  if (before.scheduledDate !== after.scheduledDate) {
    parts.push(
      after.scheduledDate
        ? `Schedule → ${formatDateLabel(after.scheduledDate)}`
        : "Move to backlog",
    );
  }
  if (before.dueDate !== after.dueDate) {
    parts.push(
      after.dueDate
        ? `Due → ${formatDateLabel(after.dueDate)}`
        : "Clear due date",
    );
  }
  if (before.recurrence !== after.recurrence) {
    parts.push(`Recurrence → ${after.recurrence}`);
  }
  if (before.reminder !== after.reminder) {
    parts.push(`Reminder → ${reminderLabel(after.reminder)}`);
  }
  if (before.notes !== after.notes) {
    parts.push("Notes updated");
  }
  return parts.length > 0 ? parts.join(" · ") : "No visible changes";
}
