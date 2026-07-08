"use client";

import { useState } from "react";
import {
  dueLabel,
  formatElapsed,
  formatHours,
  formatMinutes,
  getAreaProgress,
  isCompletedOnDate,
  isRecurring,
  RECURRENCE_OPTIONS,
  reminderLabel,
  scheduleLabel,
  scheduleOptions,
  taskGoalCreditPct,
  todayKey,
  type AreaDef,
  type BuyTimeOption,
  type Recurrence,
  type Reminder,
  type Session,
  type Task,
  type TimeWindow,
  type UsualWeekBlock,
} from "@/lib/mock-data";
import { ReminderPicker } from "@/components/ui/ReminderPicker";
import { useElapsed } from "@/hooks/useElapsed";

type TaskDetailScreenProps = {
  task: Task;
  area: AreaDef;
  usualWeek: UsualWeekBlock[];
  tasks: Task[];
  sessions: Session[];
  window: TimeWindow;
  occurrenceDate?: string | null;
  runningSession: Session | null;
  onBack: () => void;
  onSchedule: (taskId: string, scheduledDate: string | null) => void;
  onRecurrence: (taskId: string, recurrence: Recurrence) => void;
  onReminder: (taskId: string, reminder: Reminder) => void;
  onBuyTime: (taskId: string, option: BuyTimeOption) => void;
  onMarkDone: (taskId: string, occurrenceDate?: string) => void;
  onDelete: (taskId: string) => void;
  onStartTracking: (taskId: string) => void;
  onStopTracking: () => void;
};

export function TaskDetailScreen({
  task,
  area,
  usualWeek,
  tasks,
  sessions,
  window,
  occurrenceDate,
  runningSession,
  onBack,
  onSchedule,
  onRecurrence,
  onReminder,
  onBuyTime,
  onMarkDone,
  onDelete,
  onStartTracking,
  onStopTracking,
}: TaskDetailScreenProps) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const due = dueLabel(task);
  const activeOccurrence = occurrenceDate ?? todayKey();
  const occurrenceCompleted = isCompletedOnDate(task, activeOccurrence);
  const isTrackingHere =
    runningSession?.targetType === "task" &&
    runningSession.targetId === task.id;
  const elapsed = useElapsed(
    isTrackingHere ? runningSession.startedAt : null,
    isTrackingHere,
  );
  const progress = getAreaProgress(area, usualWeek, tasks, sessions, window);
  const goalCreditPct = taskGoalCreditPct(task, progress);
  const budgetHours = progress.plannedHours || 1;
  const overDaily =
    task.status === "open" &&
    !isRecurring(task) &&
    task.scheduledDate !== null &&
    task.estimateMinutes > budgetHours * 60;

  return (
    <div className="flex min-h-full flex-col px-5 pb-8 pt-14">
      <div className="mb-5 flex items-center gap-3">
        <button
          type="button"
          onClick={onBack}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-app bg-app-card text-app-secondary"
          aria-label="Back"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 text-xs text-app-muted">
            <span
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: area.color }}
            />
            {area.name}
          </div>
          <h1 className="mt-0.5 text-lg font-semibold leading-snug text-app">
            {task.title}
          </h1>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        <span className="rounded-full border border-app bg-app-input px-3 py-1.5 text-xs font-medium text-app">
          ~{formatMinutes(task.estimateMinutes)}
        </span>
        <span className="rounded-full border border-app-accent bg-app-accent-soft px-3 py-1.5 text-xs font-medium text-app-accent">
          {scheduleLabel(task)}
        </span>
        {task.reminder !== "none" && (
          <span className="rounded-full border border-app bg-app-card px-3 py-1.5 text-xs font-medium text-app-secondary">
            🔔 {reminderLabel(task.reminder)}
          </span>
        )}
        {due && (
          <span className="rounded-full border border-app bg-app-card px-3 py-1.5 text-xs font-medium text-app-secondary">
            {due}
          </span>
        )}
        {task.status === "bought_time" && (
          <span className="rounded-full bg-app-success px-3 py-1.5 text-xs font-medium text-app-success">
            Bought time
          </span>
        )}
        {(task.status === "done" || occurrenceCompleted) && (
          <span className="rounded-full bg-app-chip px-3 py-1.5 text-xs font-medium text-app-muted">
            Done
          </span>
        )}
      </div>

      {overDaily && (
        <div className="mb-4 rounded-2xl border border-app-warning bg-app-warning px-3.5 py-2.5 text-xs leading-relaxed text-app-warning-soft">
          This is {formatMinutes(task.estimateMinutes)} but {area.name} only has{" "}
          {budgetHours}h/day. Split days, move it, or buy time.
        </div>
      )}

      {task.notes && (
        <p className="mb-5 text-sm leading-relaxed text-app-muted">{task.notes}</p>
      )}

      {task.status === "open" && !occurrenceCompleted && (
        <div
          className={`mb-5 rounded-2xl border p-4 ${
            isTrackingHere
              ? "border-app-accent bg-app-accent-soft"
              : "border-app bg-app-card"
          }`}
        >
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-medium uppercase tracking-wider text-app-faint">
                Track this task
              </p>
              {isTrackingHere ? (
                <p className="mt-1 text-xl font-semibold tabular-nums text-app">
                  {formatElapsed(elapsed)}
                </p>
              ) : (
                <p className="mt-1 text-sm text-app-muted">
                  Counts toward {area.name} actual time
                </p>
              )}
            </div>
            {isTrackingHere ? (
              <button
                type="button"
                onClick={onStopTracking}
                className="rounded-2xl bg-violet-500 px-5 py-3 text-sm font-semibold text-white"
              >
                Stop
              </button>
            ) : (
              <button
                type="button"
                onClick={() => onStartTracking(task.id)}
                className="rounded-2xl border border-app-accent bg-app px-5 py-3 text-sm font-semibold text-app-accent"
              >
                Start
              </button>
            )}
          </div>
        </div>
      )}

      {task.status === "open" && !isRecurring(task) && !occurrenceCompleted && (
        <div className="mb-5">
          <h2 className="text-sm font-medium text-app-secondary">Schedule</h2>
          <p className="mt-1 text-xs text-app-muted">
            Hours count on the day you schedule — not the due date.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {scheduleOptions().map((opt) => {
              const active =
                opt.key === null
                  ? task.scheduledDate === null
                  : task.scheduledDate === opt.key;
              return (
                <button
                  key={opt.label}
                  type="button"
                  onClick={() => onSchedule(task.id, opt.key)}
                  className={`rounded-full px-3 py-1.5 text-xs font-medium transition active:scale-95 ${
                    active
                      ? "bg-violet-500 text-white"
                      : "border border-app bg-app-card text-app-secondary"
                  }`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {task.status === "open" && !occurrenceCompleted && (
        <div className="mb-5">
          <h2 className="text-sm font-medium text-app-secondary">Repeat</h2>
          <p className="mt-1 text-xs text-app-muted">
            Recurring items show on each matching day in Calendar and Orbit.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {RECURRENCE_OPTIONS.map((opt) => {
              const active = (task.recurrence ?? "none") === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => onRecurrence(task.id, opt.id)}
                  className={`rounded-full px-3 py-1.5 text-xs font-medium transition active:scale-95 ${
                    active
                      ? "bg-violet-500 text-white"
                      : "border border-app bg-app-card text-app-secondary"
                  }`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {task.status === "open" && !occurrenceCompleted && (
        <div className="mb-5">
          <h2 className="text-sm font-medium text-app-secondary">Reminder</h2>
          <div className="mt-3">
            <ReminderPicker
              value={task.reminder ?? "none"}
              recurring={(task.recurrence ?? "none") !== "none"}
              defaultDateKey={task.scheduledDate ?? task.dueDate ?? todayKey()}
              onChange={(r) => onReminder(task.id, r)}
            />
          </div>
        </div>
      )}

      {task.status === "open" && !occurrenceCompleted && (
        <div className="mt-auto space-y-3">
          {progress.plannedHours > 0 && goalCreditPct > 0 && (
            <div className="rounded-2xl border border-app-accent bg-app-accent-soft px-3.5 py-3 text-sm text-app-accent">
              Completing adds{" "}
              <span className="font-semibold">{goalCreditPct}%</span> toward{" "}
              {area.name}&apos;s {window === "today" ? "daily" : "weekly"} goal (
              {formatHours(progress.plannedHours)})
            </div>
          )}
          <button
            type="button"
            onClick={() =>
              onMarkDone(
                task.id,
                isRecurring(task) ? activeOccurrence : undefined,
              )
            }
            className="w-full rounded-2xl bg-violet-500 py-3.5 text-sm font-semibold text-white shadow-lg shadow-violet-500/20"
          >
            {isRecurring(task) ? "Complete today's occurrence" : "Mark done"}
          </button>
          {!confirmDelete ? (
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              className="w-full py-2 text-sm font-medium text-app-warning-soft"
            >
              Delete task
            </button>
          ) : (
            <div className="rounded-2xl border border-app-warning bg-app-warning px-3.5 py-3">
              <p className="text-sm text-app-warning-soft">
                Delete this task permanently?
              </p>
              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => setConfirmDelete(false)}
                  className="flex-1 rounded-xl border border-app py-2.5 text-sm font-medium text-app-secondary"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => onDelete(task.id)}
                  className="flex-1 rounded-xl bg-red-500/90 py-2.5 text-sm font-semibold text-white"
                >
                  Delete
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {(task.status !== "open" || occurrenceCompleted) && (
        <div className="mt-auto space-y-3">
          <button
            type="button"
            onClick={onBack}
            className="w-full rounded-2xl bg-app-chip py-3.5 text-sm font-medium text-app"
          >
            Back to {area.name}
          </button>
          {!confirmDelete ? (
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              className="w-full py-2 text-sm font-medium text-app-warning-soft"
            >
              Delete task
            </button>
          ) : (
            <div className="rounded-2xl border border-app-warning bg-app-warning px-3.5 py-3">
              <p className="text-sm text-app-warning-soft">
                Delete this task permanently?
              </p>
              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => setConfirmDelete(false)}
                  className="flex-1 rounded-xl border border-app py-2.5 text-sm font-medium text-app-secondary"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => onDelete(task.id)}
                  className="flex-1 rounded-xl bg-red-500/90 py-2.5 text-sm font-semibold text-white"
                >
                  Delete
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
