"use client";

import {
  DMV_CAPTURE_SUGGESTION,
  dueLabel,
  formatElapsed,
  formatMinutes,
  isRecurring,
  RECURRENCE_OPTIONS,
  REMINDER_OPTIONS,
  reminderLabel,
  scheduleLabel,
  scheduleOptions,
  todayKey,
  type AreaDef,
  type BuyTimeOption,
  type Recurrence,
  type Reminder,
  type Session,
  type Task,
} from "@/lib/mock-data";
import { useElapsed } from "@/hooks/useElapsed";

type TaskDetailScreenProps = {
  task: Task;
  area: AreaDef;
  budgetHours: number;
  occurrenceDate?: string | null;
  runningSession: Session | null;
  onBack: () => void;
  onSchedule: (taskId: string, scheduledDate: string | null) => void;
  onRecurrence: (taskId: string, recurrence: Recurrence) => void;
  onReminder: (taskId: string, reminder: Reminder) => void;
  onBuyTime: (taskId: string, option: BuyTimeOption) => void;
  onMarkDone: (taskId: string, occurrenceDate?: string) => void;
  onStartTracking: (taskId: string) => void;
  onStopTracking: () => void;
};

export function TaskDetailScreen({
  task,
  area,
  budgetHours,
  occurrenceDate,
  runningSession,
  onBack,
  onSchedule,
  onRecurrence,
  onReminder,
  onBuyTime,
  onMarkDone,
  onStartTracking,
  onStopTracking,
}: TaskDetailScreenProps) {
  const isDmv =
    task.id === "task-dmv" || task.title.toLowerCase().includes("dmv");
  const planSteps = isDmv ? DMV_CAPTURE_SUGGESTION.planSteps : [];
  const buyOptions = isDmv ? DMV_CAPTURE_SUGGESTION.buyTimeOptions : [];
  const due = dueLabel(task);
  const activeOccurrence = occurrenceDate ?? todayKey();
  const isTrackingHere =
    runningSession?.targetType === "task" &&
    runningSession.targetId === task.id;
  const elapsed = useElapsed(
    isTrackingHere ? runningSession.startedAt : null,
    isTrackingHere,
  );
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
        {task.status === "done" && (
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

      {task.status === "open" && (
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

      {task.status === "open" && !isRecurring(task) && (
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

      {task.status === "open" && (
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

      {task.status === "open" && (
        <div className="mb-5">
          <h2 className="text-sm font-medium text-app-secondary">Reminder</h2>
          <p className="mt-1 text-xs text-app-muted">
            Prototype only — no real notifications yet.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {REMINDER_OPTIONS.map((opt) => {
              const active = (task.reminder ?? "none") === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => onReminder(task.id, opt.id)}
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

      {planSteps.length > 0 && task.status === "open" && (
        <div className="mb-5">
          <h2 className="text-sm font-medium text-app-secondary">AI plan</h2>
          <ul className="mt-2 space-y-2">
            {planSteps.map((step, i) => (
              <li
                key={step.title}
                className="rounded-2xl border border-app bg-app-card px-3.5 py-3"
              >
                <div className="flex items-start gap-2.5">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-app-accent-soft text-[11px] font-medium text-app-accent">
                    {i + 1}
                  </span>
                  <div>
                    <p className="text-sm font-medium text-app">{step.title}</p>
                    {step.detail && (
                      <p className="mt-0.5 text-xs text-app-muted">{step.detail}</p>
                    )}
                    <p className="mt-1 text-[11px] text-app-faint">
                      {formatMinutes(step.estimateMinutes)}
                    </p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {buyOptions.length > 0 && task.status === "open" && (
        <div className="mb-5">
          <h2 className="text-sm font-medium text-app-secondary">Buy time</h2>
          <p className="mt-1 text-xs text-app-muted">
            Spend money to protect what matters.
          </p>
          <div className="mt-3 space-y-2">
            {buyOptions.map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => onBuyTime(task.id, option)}
                className="w-full rounded-2xl border border-app-success bg-app-success px-4 py-3.5 text-left transition active:scale-[0.99]"
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-semibold text-app">{option.title}</p>
                  <span className="shrink-0 text-xs font-medium text-app-success">
                    {option.costLabel}
                  </span>
                </div>
                <p className="mt-1 text-xs leading-relaxed text-app-muted">
                  {option.description}
                </p>
                <p className="mt-2 text-[11px] font-medium text-app-success-soft">
                  Saves ~{formatMinutes(option.timeSavedMinutes)}
                </p>
              </button>
            ))}
          </div>
        </div>
      )}

      {task.status === "open" && (
        <button
          type="button"
          onClick={() =>
            onMarkDone(
              task.id,
              isRecurring(task) ? activeOccurrence : undefined,
            )
          }
          className="mt-auto w-full rounded-2xl border border-app py-3.5 text-sm font-medium text-app-secondary"
        >
          {isRecurring(task) ? "Complete today’s occurrence" : "Mark done"}
        </button>
      )}

      {task.status !== "open" && (
        <button
          type="button"
          onClick={onBack}
          className="mt-auto w-full rounded-2xl bg-app-chip py-3.5 text-sm font-medium text-app"
        >
          Back to {area.name}
        </button>
      )}
    </div>
  );
}
