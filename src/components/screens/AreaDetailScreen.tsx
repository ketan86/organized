"use client";

import {
  actualHoursForArea,
  areaAppliesOnDate,
  areaBlocksHours,
  blockDurationHours,
  DAYS_PATTERN_OPTIONS,
  daysPatternLabel,
  formatBlockLabel,
  formatElapsed,
  formatHours,
  formatMinutes,
  formatTimeLabel,
  getAreaPressure,
  isBacklogTask,
  isRecurring,
  parseTimeToMinutes,
  reminderLabel,
  scheduleLabel,
  taskCountsInWindow,
  TIME_OPTIONS,
  todayKey,
  dueLabel,
  type AreaDef,
  type DaysPattern,
  type Session,
  type Task,
  type TimeBlock,
  type TimeWindow,
} from "@/lib/mock-data";
import { useElapsed } from "@/hooks/useElapsed";

type AreaDetailScreenProps = {
  area: AreaDef;
  budgetHours: number;
  isProtected: boolean;
  tasks: Task[];
  sessions: Session[];
  runningSession: Session | null;
  window: TimeWindow;
  onBack: () => void;
  onOpenTask: (taskId: string) => void;
  onCapture: () => void;
  onUpdateBlocks: (areaId: string, blocks: TimeBlock[]) => void;
  onStartTracking: (areaId: string) => void;
  onStopTracking: () => void;
  onSwitchTracking: () => void;
  onUpdateDaysPattern: (areaId: string, pattern: DaysPattern) => void;
};

function TaskRow({
  task,
  area,
  budgetHours,
  window,
  onOpenTask,
}: {
  task: Task;
  area: AreaDef;
  budgetHours: number;
  window: TimeWindow;
  onOpenTask: (taskId: string) => void;
}) {
  const due = dueLabel(task);
  const onPlate = taskCountsInWindow(task, window);

  return (
    <button
      type="button"
      onClick={() => onOpenTask(task.id)}
      className="flex items-start gap-3 rounded-2xl border border-app bg-app-card px-4 py-3.5 text-left transition active:scale-[0.99]"
    >
      <span
        className="mt-1.5 h-2 w-2 shrink-0 rounded-full"
        style={{ backgroundColor: area.color }}
      />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-app">{task.title}</p>
        <p className="mt-0.5 text-xs text-app-muted">
          {formatMinutes(task.estimateMinutes)}
          <span className="text-app-faint"> · </span>
          <span className={onPlate ? "text-app-accent-soft" : "text-app-faint"}>
            {scheduleLabel(task)}
          </span>
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
            !isRecurring(task) &&
            task.estimateMinutes > budgetHours * 60 && (
              <span className="text-app-warning"> · over daily budget</span>
            )}
        </p>
      </div>
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        className="mt-0.5 shrink-0 text-app-faint"
      >
        <path d="M9 18l6-6-6-6" />
      </svg>
    </button>
  );
}

export function AreaDetailScreen({
  area,
  budgetHours,
  isProtected,
  tasks,
  sessions,
  runningSession,
  window,
  onBack,
  onOpenTask,
  onCapture,
  onUpdateBlocks,
  onStartTracking,
  onStopTracking,
  onSwitchTracking,
  onUpdateDaysPattern,
}: AreaDetailScreenProps) {
  const pressure = getAreaPressure(area, budgetHours, tasks, window);
  const appliesToday = areaAppliesOnDate(area, todayKey());
  const areaTasks = tasks.filter((t) => t.areaId === area.id);
  const openTasks = areaTasks.filter((t) => t.status === "open");
  const blocks = area.blocks ?? [];
  const isTrackingHere =
    runningSession?.targetType === "area" &&
    runningSession.targetId === area.id;
  const elapsed = useElapsed(
    isTrackingHere ? runningSession.startedAt : null,
    isTrackingHere,
  );
  const actualToday = actualHoursForArea(sessions, area.id, "today");
  const actualWindow = actualHoursForArea(sessions, area.id, window);

  const onPlate = openTasks.filter((t) => taskCountsInWindow(t, window));
  const backlog = openTasks.filter(
    (t) =>
      !taskCountsInWindow(t, window) &&
      (window === "today" ? true : isBacklogTask(t) || isRecurring(t)),
  );
  const fillPct = Math.min(pressure.ratio * 100, 100);

  function updateBlock(id: string, patch: Partial<TimeBlock>) {
    onUpdateBlocks(
      area.id,
      blocks.map((b) => (b.id === id ? { ...b, ...patch } : b)),
    );
  }

  function removeBlock(id: string) {
    onUpdateBlocks(
      area.id,
      blocks.filter((b) => b.id !== id),
    );
  }

  function addBlock() {
    onUpdateBlocks(area.id, [
      ...blocks,
      {
        id: `block-${Date.now()}`,
        start: "09:00",
        end: "10:00",
      },
    ]);
  }

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
          <div className="flex items-center gap-2">
            <span
              className="h-3 w-3 rounded-full"
              style={{ backgroundColor: area.color }}
            />
            <h1 className="truncate text-xl font-semibold text-app">
              {area.name}
            </h1>
            {isProtected && (
              <span className="rounded-full bg-app-success px-2 py-0.5 text-[10px] font-medium text-app-success">
                Protected
              </span>
            )}
          </div>
          <p className="mt-0.5 text-xs text-app-muted">
            {formatHours(budgetHours)}/active day ·{" "}
            {daysPatternLabel(area.daysPattern)}
            {!appliesToday && " · not planned today"}
          </p>
        </div>
      </div>

      {/* Live tracking */}
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
              Track time
            </p>
            {isTrackingHere ? (
              <p className="mt-1 text-xl font-semibold tabular-nums text-app">
                {formatElapsed(elapsed)}
              </p>
            ) : (
              <p className="mt-1 text-sm text-app-muted">
                You tracked today: {formatHours(actualToday)}
                {window === "week" && (
                  <span className="text-app-faint">
                    {" "}
                    · this week {formatHours(actualWindow)}
                  </span>
                )}
              </p>
            )}
          </div>
          {isTrackingHere ? (
            <div className="flex shrink-0 flex-col gap-2">
              <button
                type="button"
                onClick={onSwitchTracking}
                className="rounded-2xl border border-app-accent bg-app px-4 py-2.5 text-sm font-semibold text-app-accent"
              >
                Switch
              </button>
              <button
                type="button"
                onClick={onStopTracking}
                className="rounded-2xl bg-violet-500 px-4 py-2.5 text-sm font-semibold text-white"
              >
                Stop
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => onStartTracking(area.id)}
              className="rounded-2xl border border-app-accent bg-app px-5 py-3 text-sm font-semibold text-app-accent"
            >
              Start {area.name}
            </button>
          )}
        </div>
        {isTrackingHere && (
          <p className="mt-2 text-[11px] text-app-muted">
            Switch = do a chore (or something else), then come back. Stop = done
            with {area.name} for now.
          </p>
        )}
        {runningSession && !isTrackingHere && (
          <p className="mt-2 text-[11px] text-app-muted">
            Starting will switch from your other timer (not “finished early”).
          </p>
        )}
      </div>

      <div className="mb-5 rounded-2xl border border-app bg-app-card p-4">
        <p className="mb-2 text-xs font-medium text-app-secondary">
          Open tasks · {window === "today" ? "today" : "this week"}
        </p>
        <div className="mb-2 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-app-muted">
          <span>
            Tasks:{" "}
            <span className="font-medium text-app">
              {formatHours(pressure.load)}
            </span>
          </span>
          <span>
            You set:{" "}
            <span className="font-medium text-app">
              {formatHours(pressure.capacity)}
            </span>
          </span>
        </div>
        <div className="h-2.5 overflow-hidden rounded-full bg-app-track">
          <div
            className="h-full rounded-full transition-all"
            style={{
              width: `${fillPct}%`,
              backgroundColor: pressure.overloaded ? "#fbbf24" : area.color,
            }}
          />
        </div>
        {pressure.overloaded ? (
          <p className="mt-2 text-[11px] text-app-warning-soft">
            {formatHours(pressure.load - pressure.capacity)} more tasks than you
            planned — reschedule, buy time, or offload.
          </p>
        ) : (
          <p className="mt-2 text-[11px] text-app-faint">
            {pressure.free > 0.05
              ? `${formatHours(pressure.free)} of room left for more tasks`
              : "Task list matches the hours you set"}
          </p>
        )}
      </div>

      {/* Which days + start/stop blocks */}
      <div className="mb-5 rounded-2xl border border-app bg-app-card p-4">
        <div className="mb-1 flex items-center justify-between">
          <h2 className="text-sm font-medium text-app-secondary">
            Planned hours
          </h2>
          <span className="text-xs tabular-nums text-app-muted">
            {formatHours(areaBlocksHours(blocks) || budgetHours)} / active day
          </span>
        </div>
        <p className="mb-3 text-[11px] leading-relaxed text-app-faint">
          Which days this applies, then start/stop times. Gaps are pauses (e.g.
          lunch). Overnight is ok for sleep.
        </p>

        <p className="mb-1.5 text-xs font-medium text-app-muted">Days</p>
        <div className="mb-4 flex flex-wrap gap-2">
          {DAYS_PATTERN_OPTIONS.map((opt) => {
            const active = (area.daysPattern ?? "everyday") === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => onUpdateDaysPattern(area.id, opt.id)}
                className={`rounded-full px-3 py-1.5 text-xs font-medium ${
                  active
                    ? "bg-violet-500 text-white"
                    : "border border-app bg-app-input text-app-secondary"
                }`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
        <p className="mb-3 text-[11px] text-app-faint">
          {DAYS_PATTERN_OPTIONS.find(
            (o) => o.id === (area.daysPattern ?? "everyday"),
          )?.hint}
          {!appliesToday && " — nothing planned for today."}
        </p>

        <p className="mb-1.5 text-xs font-medium text-app-muted">
          Start / stop on those days
        </p>

        {blocks.length === 0 && (
          <p className="mb-3 text-xs text-app-muted">
            No clock hours yet — budget only. Add a block when this area has a
            set window.
          </p>
        )}

        <div className="flex flex-col gap-2.5">
          {blocks.map((block, index) => {
            const overnight =
              parseTimeToMinutes(block.end) <= parseTimeToMinutes(block.start);
            return (
              <div
                key={block.id}
                className="rounded-xl border border-app bg-app-input px-3 py-2.5"
              >
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-[11px] font-medium text-app-muted">
                    Block {index + 1}
                    {overnight ? " · overnight" : ""}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeBlock(block.id)}
                    className="text-[11px] text-app-faint"
                  >
                    Remove
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <label className="flex min-w-0 flex-1 flex-col gap-1">
                    <span className="text-[10px] uppercase tracking-wide text-app-faint">
                      Start
                    </span>
                    <select
                      value={block.start}
                      onChange={(e) =>
                        updateBlock(block.id, { start: e.target.value })
                      }
                      className="w-full rounded-lg border border-app bg-app px-2 py-2 text-sm text-app outline-none"
                    >
                      {TIME_OPTIONS.map((t) => (
                        <option key={t} value={t}>
                          {formatTimeLabel(t)}
                        </option>
                      ))}
                    </select>
                  </label>
                  <span className="mt-4 text-app-faint">→</span>
                  <label className="flex min-w-0 flex-1 flex-col gap-1">
                    <span className="text-[10px] uppercase tracking-wide text-app-faint">
                      Stop
                    </span>
                    <select
                      value={block.end}
                      onChange={(e) =>
                        updateBlock(block.id, { end: e.target.value })
                      }
                      className="w-full rounded-lg border border-app bg-app px-2 py-2 text-sm text-app outline-none"
                    >
                      {TIME_OPTIONS.map((t) => (
                        <option key={t} value={t}>
                          {formatTimeLabel(t)}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
                <p className="mt-2 text-[11px] text-app-accent-soft">
                  {formatBlockLabel(block)} ·{" "}
                  {formatHours(blockDurationHours(block))}
                </p>
              </div>
            );
          })}
        </div>

        <button
          type="button"
          onClick={addBlock}
          className="mt-3 w-full rounded-xl border border-dashed border-app-strong py-2.5 text-xs font-medium text-app-accent"
        >
          + Add start / stop block
        </button>
      </div>

      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-medium text-app-secondary">
          {window === "today" ? "On today" : "Counting this week"} ·{" "}
          {onPlate.length}
        </h2>
        <button
          type="button"
          onClick={onCapture}
          className="text-xs font-medium text-app-accent"
        >
          + Add
        </button>
      </div>

      <div className="flex flex-1 flex-col gap-2">
        {onPlate.length === 0 && (
          <div className="rounded-2xl border border-dashed border-app px-4 py-6 text-center">
            <p className="text-sm text-app-muted">
              Nothing scheduled{" "}
              {window === "today" ? "for today" : "this week"}
            </p>
          </div>
        )}

        {onPlate.map((task) => (
          <TaskRow
            key={task.id}
            task={task}
            area={area}
            budgetHours={budgetHours}
            window={window}
            onOpenTask={onOpenTask}
          />
        ))}

        {backlog.length > 0 && (
          <div className="mt-4">
            <p className="mb-2 text-xs font-medium uppercase tracking-wider text-app-faint">
              {window === "today" ? "Not on today" : "Outside this week"} ·{" "}
              {backlog.length}
            </p>
            <div className="flex flex-col gap-2 opacity-80">
              {backlog.map((task) => (
                <TaskRow
                  key={task.id}
                  task={task}
                  area={area}
                  budgetHours={budgetHours}
                  window={window}
                  onOpenTask={onOpenTask}
                />
              ))}
            </div>
          </div>
        )}

        {areaTasks.some((t) => t.status !== "open") && (
          <div className="mt-4">
            <p className="mb-2 text-xs text-app-faint">Done / bought time</p>
            {areaTasks
              .filter((t) => t.status !== "open")
              .map((task) => (
                <div
                  key={task.id}
                  className="flex items-center gap-2 py-2 text-sm text-app-faint line-through"
                >
                  {task.title}
                  {task.status === "bought_time" && (
                    <span className="rounded-full bg-app-success px-2 py-0.5 text-[10px] text-app-success-soft no-underline">
                      bought time
                    </span>
                  )}
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}
