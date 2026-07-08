"use client";

import {
  actualHoursForArea,
  blocksOnDate,
  formatAreaProgressSummary,
  formatBlockLabel,
  formatElapsed,
  formatHours,
  formatMinutes,
  getAreaPressure,
  getAreaProgress,
  isBacklogTask,
  isRecurring,
  plannedHoursForArea,
  reminderLabel,
  scheduleLabel,
  taskVisibleInWindow,
  taskWindowState,
  todayKey,
  dueLabel,
  type AreaDef,
  type Session,
  type Task,
  type TimeWindow,
  type UsualWeekBlock,
} from "@/lib/mock-data";
import { AreaProgressBar } from "@/components/AreaProgressBar";
import { useElapsed } from "@/hooks/useElapsed";

type AreaDetailScreenProps = {
  area: AreaDef;
  usualWeek: UsualWeekBlock[];
  isProtected: boolean;
  tasks: Task[];
  sessions: Session[];
  runningSession: Session | null;
  window: TimeWindow;
  onBack: () => void;
  onOpenTask: (taskId: string) => void;
  onCapture: () => void;
  onOpenSchedule: () => void;
  progressNotice?: string | null;
  embedded?: boolean;
};

function TaskRow({
  task,
  area,
  capacityHours,
  window,
  completed,
  onOpenTask,
}: {
  task: Task;
  area: AreaDef;
  capacityHours: number;
  window: TimeWindow;
  completed: boolean;
  onOpenTask: (taskId: string) => void;
}) {
  const due = dueLabel(task);
  const onPlate = taskVisibleInWindow(task, window) && !completed;

  return (
    <li>
      <button
        type="button"
        onClick={() => onOpenTask(task.id)}
        className={`flex w-full items-start gap-3 py-3.5 text-left transition hover:bg-app-card/50 ${
          completed ? "opacity-75" : ""
        }`}
      >
        <span
          className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${
            completed ? "bg-app-faint" : ""
          }`}
          style={completed ? undefined : { backgroundColor: area.color }}
        />
        <div className="min-w-0 flex-1">
          <p
            className={`text-sm font-medium ${
              completed ? "text-app-faint line-through" : "text-app"
            }`}
          >
            {task.title}
          </p>
          <p className="mt-0.5 text-xs text-app-muted">
            {formatMinutes(task.estimateMinutes)}
            {completed ? (
              <span className="text-app-success"> · Done</span>
            ) : (
              <>
                <span className="text-app-faint"> · </span>
                <span className={onPlate ? "text-app-accent-soft" : "text-app-faint"}>
                  {scheduleLabel(task)}
                </span>
              </>
            )}
            {task.reminder !== "none" && (
              <>
                <span className="text-app-faint"> · </span>
                🔔 {reminderLabel(task.reminder)}
              </>
            )}
            {due && !isRecurring(task) && (
              <>
                <span className="text-app-faint"> · </span>
                {due}
              </>
            )}
            {onPlate &&
              window === "today" &&
              capacityHours > 0 &&
              !isRecurring(task) &&
              task.estimateMinutes > capacityHours * 60 && (
                <span className="text-app-warning"> · over today’s plan</span>
              )}
          </p>
        </div>
        <span className="mt-0.5 shrink-0 text-app-faint">›</span>
      </button>
    </li>
  );
}

function FlatRow({
  label,
  value,
  hint,
  onClick,
}: {
  label: string;
  value?: string;
  hint?: string;
  onClick?: () => void;
}) {
  const Tag = onClick ? "button" : "div";
  return (
    <Tag
      type={onClick ? "button" : undefined}
      onClick={onClick}
      className={`flex w-full items-center justify-between gap-3 py-3 text-left ${
        onClick ? "transition hover:bg-app-card/40" : ""
      }`}
    >
      <div className="min-w-0">
        <p className="text-sm text-app-secondary">{label}</p>
        {hint && <p className="mt-0.5 text-xs text-app-muted">{hint}</p>}
      </div>
      {value != null && (
        <span className="shrink-0 text-sm text-app-muted">{value}</span>
      )}
      {onClick && <span className="shrink-0 text-app-faint">›</span>}
    </Tag>
  );
}

export function AreaDetailScreen({
  area,
  usualWeek,
  isProtected,
  tasks,
  sessions,
  runningSession,
  window,
  onBack,
  onOpenTask,
  onCapture,
  onOpenSchedule,
  progressNotice,
  embedded = false,
}: AreaDetailScreenProps) {
  const pressure = getAreaPressure(area, usualWeek, tasks, window);
  const progress = getAreaProgress(area, usualWeek, tasks, sessions, window);
  const todayBlocks = blocksOnDate(usualWeek, todayKey(), area.id);
  const plannedToday = plannedHoursForArea(usualWeek, area.id, "today");
  const areaTasks = tasks.filter((t) => t.areaId === area.id);
  const openTasks = areaTasks.filter((t) => t.status === "open");
  const trackingHere =
    runningSession != null && runningSession.areaId === area.id;
  const elapsed = useElapsed(
    trackingHere ? runningSession.startedAt : null,
    trackingHere,
  );
  const actualToday = actualHoursForArea(sessions, area.id, "today");
  const actualWindow = actualHoursForArea(sessions, area.id, window);

  const onPlate = areaTasks.filter((t) => taskVisibleInWindow(t, window));
  const backlog = openTasks.filter(
    (t) =>
      !taskVisibleInWindow(t, window) &&
      (window === "today" ? true : isBacklogTask(t) || isRecurring(t)),
  );
  const onPlateIds = new Set(onPlate.map((t) => t.id));
  const fillPct = Math.min(pressure.ratio * 100, 100);
  const windowLabel = window === "today" ? "today" : "this week";
  const todaySchedule =
    plannedToday > 0
      ? todayBlocks.map(formatBlockLabel).join(" · ")
      : "No blocks today";

  return (
    <div className={`panel-page flex flex-col ${embedded ? "" : "pt-14"}`}>
      {progressNotice && (
        <div className="mb-4 rounded-lg border border-app-success bg-app-success px-3.5 py-2.5 text-sm text-app-success">
          {progressNotice}
        </div>
      )}

      {!embedded && (
        <div className="mb-4 flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="btn-icon"
            aria-label="Back"
          >
            ←
          </button>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: area.color }}
              />
              <h1 className="truncate text-lg font-semibold text-app">
                {area.name}
              </h1>
              {isProtected && (
                <span className="rounded-full bg-app-success px-2 py-0.5 text-[10px] font-medium text-app-success">
                  Protected
                </span>
              )}
            </div>
            <p className="mt-0.5 text-xs text-app-muted">Today: {todaySchedule}</p>
          </div>
        </div>
      )}

      {embedded && (
        <p className="mb-3 text-xs text-app-muted">
          Today: {todaySchedule}
          {isProtected ? " · Protected" : ""}
        </p>
      )}

      {/* Tracking — status only; start/stop lives on home */}
      <div
        className={`py-3 ${
          trackingHere ? "rounded-2xl border border-app-accent bg-app-accent-soft px-3" : ""
        }`}
      >
        {trackingHere ? (
          <>
            <p className="text-xs text-app-muted">Tracking now</p>
            <p className="text-xl font-semibold tabular-nums text-app">
              {formatElapsed(elapsed)}
            </p>
            <p className="mt-1 text-[11px] text-app-muted">
              Stop or switch from the home screen.
            </p>
          </>
        ) : (
          <>
            <p className="text-xs text-app-muted">Tracked today</p>
            <p className="text-sm text-app">
              {formatHours(actualToday)}
              {window === "week" && (
                <span className="text-app-muted">
                  {" "}
                  · {formatHours(actualWindow)} this week
                </span>
              )}
            </p>
          </>
        )}
      </div>

      <FlatRow
        label="Weekly schedule"
        hint={plannedToday > 0 ? `Today ${formatHours(plannedToday)}` : "Tap to set hours"}
        onClick={onOpenSchedule}
      />

      {/* Goal + load — compact metrics, no cards */}
      {(progress.plannedHours > 0 || pressure.capacity > 0) && (
        <div className="space-y-4 py-4">
          {progress.plannedHours > 0 && (
            <div>
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-xs text-app-muted">
                  {window === "today" ? "Today's goal" : "This week's goal"}
                </span>
                <span
                  className={`text-sm font-semibold tabular-nums ${
                    progress.goalMet ? "text-app-success" : "text-app"
                  }`}
                >
                  {progress.progressPct}%
                </span>
              </div>
              <AreaProgressBar
                progressPct={progress.progressPct}
                color={area.color}
                goalMet={progress.goalMet}
                size="sm"
                className="mt-2"
              />
              <p className="mt-1.5 text-[11px] text-app-muted">
                {formatAreaProgressSummary(progress)}
              </p>
            </div>
          )}

          <div>
            <div className="flex items-baseline justify-between gap-2 text-xs">
              <span className="text-app-muted">Task load · {windowLabel}</span>
              <span className="text-app">
                {formatHours(pressure.load)}
                <span className="text-app-muted"> / {formatHours(pressure.capacity)}</span>
              </span>
            </div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-app-track">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${fillPct}%`,
                  backgroundColor: pressure.overloaded ? "#fbbf24" : area.color,
                }}
              />
            </div>
            <p className="mt-1.5 text-[11px] text-app-muted">
              {pressure.overloaded
                ? `${formatHours(pressure.load - pressure.capacity)} over plan`
                : pressure.free > 0.05
                  ? `${formatHours(pressure.free)} room left`
                  : pressure.capacity <= 0
                    ? "No hours set for this window"
                    : "Matches your plan"}
            </p>
          </div>
        </div>
      )}

      {/* Tasks */}
      <div className="mt-4 flex items-center justify-between">
        <h2 className="text-xs font-medium uppercase tracking-wide text-app-muted">
          {window === "today" ? "Today" : "This week"} · {onPlate.length}
        </h2>
        <button
          type="button"
          onClick={onCapture}
          className="btn-primary btn-sm shrink-0 whitespace-nowrap"
        >
          + Add
        </button>
      </div>

      {onPlate.length === 0 ? (
        <p className="py-8 text-center text-sm text-app-muted">
          Nothing scheduled {windowLabel}
        </p>
      ) : (
        <ul>
          {onPlate.map((task) => (
            <TaskRow
              key={task.id}
              task={task}
              area={area}
              capacityHours={pressure.capacity}
              window={window}
              completed={taskWindowState(task, window) === "completed"}
              onOpenTask={onOpenTask}
            />
          ))}
        </ul>
      )}

      {backlog.length > 0 && (
        <>
          <h3 className="mt-6 mb-2 text-xs font-medium uppercase tracking-wide text-app-muted">
            {window === "today" ? "Not today" : "Outside week"} · {backlog.length}
          </h3>
          <ul className="opacity-80">
            {backlog.map((task) => (
              <TaskRow
                key={task.id}
                task={task}
                area={area}
                capacityHours={pressure.capacity}
                window={window}
                completed={false}
                onOpenTask={onOpenTask}
              />
            ))}
          </ul>
        </>
      )}

      {areaTasks.some((t) => t.status !== "open" && !onPlateIds.has(t.id)) && (
        <div className="mt-6 pt-4">
          <p className="mb-2 text-xs font-medium text-app-muted">Done / bought time</p>
          <ul className="space-y-1">
            {areaTasks
              .filter((t) => t.status !== "open" && !onPlateIds.has(t.id))
              .map((task) => (
                <li
                  key={task.id}
                  className="flex items-center gap-2 py-1 text-sm text-app-faint line-through"
                >
                  {task.title}
                  {task.status === "bought_time" && (
                    <span className="rounded-full bg-app-success px-2 py-0.5 text-[10px] text-app-success no-underline">
                      bought time
                    </span>
                  )}
                </li>
              ))}
          </ul>
        </div>
      )}
    </div>
  );
}
