"use client";

import { useMemo, useState } from "react";
import {
  addDays,
  areaAppliesOnDate,
  blocksSummary,
  blockTimelineRanges,
  formatDateLabel,
  formatMinutes,
  isBacklogTask,
  isRecurring,
  reminderLabel,
  scheduleLabel,
  tasksOnDate,
  todayKey,
  weekRange,
  type AreaDef,
  type Task,
} from "@/lib/mock-data";
import type { AreaWeight } from "./onboarding/WeightageScreen";
import { ThemeToggle } from "@/components/ThemeToggle";

type CalendarScreenProps = {
  areas: AreaDef[];
  weights: AreaWeight[];
  tasks: Task[];
  onOpenTask: (taskId: string, occurrenceDate?: string) => void;
  onScheduleTask: (taskId: string, scheduledDate: string | null) => void;
  onCapture: () => void;
  onOpenOrbit: () => void;
};

function weekDays(anchor: string): string[] {
  const { start } = weekRange(anchor);
  return Array.from({ length: 7 }, (_, i) => addDays(start, i));
}

function dayLoadMinutes(tasks: Task[], dateKey: string): number {
  return tasksOnDate(tasks, dateKey).reduce(
    (sum, t) => sum + t.estimateMinutes,
    0,
  );
}

export function CalendarScreen({
  areas,
  weights,
  tasks,
  onOpenTask,
  onScheduleTask,
  onCapture,
  onOpenOrbit,
}: CalendarScreenProps) {
  const today = todayKey();
  const [anchor, setAnchor] = useState(today);
  const [selectedDay, setSelectedDay] = useState(today);

  const days = useMemo(() => weekDays(anchor), [anchor]);
  const { start, end } = weekRange(anchor);

  const weekLabel = useMemo(() => {
    const s = new Date(`${start}T12:00:00`);
    const e = new Date(`${end}T12:00:00`);
    const opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" };
    return `${s.toLocaleDateString(undefined, opts)} – ${e.toLocaleDateString(undefined, opts)}`;
  }, [start, end]);

  const dayTasks = useMemo(
    () => tasksOnDate(tasks, selectedDay),
    [tasks, selectedDay],
  );

  const backlog = useMemo(
    () => tasks.filter((t) => isBacklogTask(t)),
    [tasks],
  );

  const selectedLoad = dayLoadMinutes(tasks, selectedDay);
  const selectedBudget = weights.reduce((s, w) => s + w.hours, 0);
  const dayOver = selectedLoad / 60 > selectedBudget;

  const maxDayLoad = Math.max(
    ...days.map((d) => dayLoadMinutes(tasks, d)),
    1,
  );

  return (
    <div className="relative flex min-h-full flex-col px-5 pb-28 pt-14">
      <div className="relative z-10 flex items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-app-faint">
            Calendar
          </p>
          <h1 className="mt-0.5 text-lg font-semibold text-app">Your week</h1>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <ThemeToggle compact />
          <button
            type="button"
            onClick={onOpenOrbit}
            className="rounded-full border border-app bg-app-card px-3 py-1.5 text-[11px] font-medium text-app-secondary"
          >
            Orbit
          </button>
        </div>
      </div>

      {/* Google Calendar — future sync */}
      <div className="relative z-10 mt-3 flex items-center gap-3 rounded-2xl border border-app bg-app-card px-3.5 py-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-app-chip">
          <GoogleCalIcon />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-app">Google Calendar</p>
          <p className="text-[11px] text-app-muted">
            Sync coming soon — events will map to schedule days.
          </p>
        </div>
        <button
          type="button"
          disabled
          className="shrink-0 rounded-full bg-app-chip px-3 py-1.5 text-[11px] font-medium text-app-faint"
        >
          Connect
        </button>
      </div>

      {/* Week nav */}
      <div className="relative z-10 mt-4 flex items-center justify-between">
        <button
          type="button"
          onClick={() => {
            const next = addDays(anchor, -7);
            setAnchor(next);
            setSelectedDay(weekRange(next).start);
          }}
          className="flex h-8 w-8 items-center justify-center rounded-full border border-app text-app-secondary"
          aria-label="Previous week"
        >
          ‹
        </button>
        <button
          type="button"
          onClick={() => {
            setAnchor(today);
            setSelectedDay(today);
          }}
          className="text-sm font-medium text-app-secondary"
        >
          {weekLabel}
        </button>
        <button
          type="button"
          onClick={() => {
            const next = addDays(anchor, 7);
            setAnchor(next);
            setSelectedDay(weekRange(next).start);
          }}
          className="flex h-8 w-8 items-center justify-center rounded-full border border-app text-app-secondary"
          aria-label="Next week"
        >
          ›
        </button>
      </div>

      {/* Week strip */}
      <div className="relative z-10 mt-3 grid grid-cols-7 gap-1">
        {days.map((day) => {
          const load = dayLoadMinutes(tasks, day);
          const isToday = day === today;
          const isSelected = day === selectedDay;
          const d = new Date(`${day}T12:00:00`);
          const weekday = d.toLocaleDateString(undefined, { weekday: "narrow" });
          const dateNum = d.getDate();
          const barH = 4 + (load / maxDayLoad) * 28;

          return (
            <button
              key={day}
              type="button"
              onClick={() => setSelectedDay(day)}
              className={`flex flex-col items-center rounded-2xl px-0.5 py-2 transition ${
                isSelected
                  ? "bg-violet-500/25 ring-1 ring-violet-400/40"
                  : "bg-app-card"
              }`}
            >
              <span
                className={`text-[10px] ${
                  isToday ? "text-app-accent" : "text-app-faint"
                }`}
              >
                {weekday}
              </span>
              <span
                className={`mt-0.5 text-sm font-semibold ${
                  isSelected ? "text-app" : "text-app-secondary"
                }`}
              >
                {dateNum}
              </span>
              <div className="mt-1.5 flex h-8 items-end">
                <div
                  className="w-2 rounded-full"
                  style={{
                    height: load > 0 ? barH : 3,
                    backgroundColor:
                      load > 0
                        ? isSelected
                          ? "var(--accent-soft)"
                          : "var(--fg-muted)"
                        : "var(--ring-track)",
                  }}
                />
              </div>
            </button>
          );
        })}
      </div>

      {/* Selected day summary */}
      <div className="relative z-10 mt-4 flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-app">
            {formatDateLabel(selectedDay)}
          </h2>
          <p
            className={`text-xs ${
              dayOver ? "text-app-warning" : "text-app-muted"
            }`}
          >
            {formatMinutes(selectedLoad)} scheduled
            {dayOver && " · over life budget"}
          </p>
        </div>
        {selectedDay !== today && (
          <button
            type="button"
            onClick={() => setSelectedDay(today)}
            className="text-xs font-medium text-app-accent"
          >
            Jump to today
          </button>
        )}
      </div>

      {/* Area clock blocks for the day */}
      <div className="relative z-10 mt-3 rounded-2xl border border-app bg-app-card p-3">
        <p className="mb-2 text-[10px] font-medium uppercase tracking-wider text-app-faint">
          Life blocks · 12 AM – 12 AM
        </p>
        <div className="relative mb-2 h-8 overflow-hidden rounded-lg bg-app-track">
          {areas
            .filter((area) => areaAppliesOnDate(area, selectedDay))
            .flatMap((area) =>
              (area.blocks ?? []).flatMap((block) =>
                blockTimelineRanges(block).map((range, i) => (
                  <div
                    key={`${area.id}-${block.id}-${i}`}
                    title={`${area.name}: ${blocksSummary([block])}`}
                    className="absolute top-1 bottom-1 rounded-sm opacity-90"
                    style={{
                      left: `${range.left}%`,
                      width: `${Math.max(range.width, 0.8)}%`,
                      backgroundColor: area.color,
                    }}
                  />
                )),
              ),
            )}
        </div>
        <div className="mb-2 flex justify-between text-[9px] text-app-faint">
          <span>12 AM</span>
          <span>6 AM</span>
          <span>12 PM</span>
          <span>6 PM</span>
          <span>12 AM</span>
        </div>
        <div className="flex flex-col gap-1">
          {areas
            .filter(
              (a) =>
                areaAppliesOnDate(a, selectedDay) && (a.blocks ?? []).length > 0,
            )
            .map((area) => (
              <div
                key={area.id}
                className="flex items-start gap-2 text-[11px] text-app-muted"
              >
                <span
                  className="mt-1 h-2 w-2 shrink-0 rounded-full"
                  style={{ backgroundColor: area.color }}
                />
                <span className="min-w-0">
                  <span className="font-medium text-app">{area.name}</span>
                  <span className="text-app-faint">
                    {" "}
                    · {blocksSummary(area.blocks)}
                  </span>
                </span>
              </div>
            ))}
          {areas.filter((a) => areaAppliesOnDate(a, selectedDay)).length ===
            0 && (
            <p className="text-[11px] text-app-faint">
              No planned blocks for this day.
            </p>
          )}
        </div>
      </div>

      {/* Day agenda */}
      <div className="relative z-10 mt-3 flex flex-1 flex-col gap-2">
        {dayTasks.length === 0 && (
          <div className="rounded-2xl border border-dashed border-app px-4 py-8 text-center">
            <p className="text-sm text-app-muted">Nothing scheduled</p>
            <button
              type="button"
              onClick={onCapture}
              className="mt-2 text-sm font-medium text-app-accent"
            >
              Dump something
            </button>
          </div>
        )}

        {dayTasks.map((task) => {
          const area = areas.find((a) => a.id === task.areaId);
          return (
            <button
              key={task.id}
              type="button"
              onClick={() => onOpenTask(task.id, selectedDay)}
              className="flex items-start gap-3 rounded-2xl border border-app bg-app-card px-3.5 py-3 text-left active:scale-[0.99]"
            >
              <span
                className="mt-1 h-8 w-1 shrink-0 rounded-full"
                style={{ backgroundColor: area?.color ?? "#8b7cf6" }}
              />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-app">{task.title}</p>
                <p className="mt-0.5 text-xs text-app-muted">
                  {area?.name ?? "Area"} · {formatMinutes(task.estimateMinutes)}
                  {isRecurring(task) && (
                    <span className="text-app-accent-soft">
                      {" "}
                      · {scheduleLabel(task)}
                    </span>
                  )}
                  {task.reminder !== "none" && (
                    <span className="text-app-faint">
                      {" "}
                      · 🔔 {reminderLabel(task.reminder)}
                    </span>
                  )}
                </p>
              </div>
            </button>
          );
        })}

        {backlog.length > 0 && (
          <div className="mt-4">
            <p className="mb-2 text-xs font-medium uppercase tracking-wider text-app-faint">
              Backlog · tap to schedule on {formatDateLabel(selectedDay)}
            </p>
            <div className="flex flex-col gap-2">
              {backlog.map((task) => {
                const area = areas.find((a) => a.id === task.areaId);
                return (
                  <button
                    key={task.id}
                    type="button"
                    onClick={() => onScheduleTask(task.id, selectedDay)}
                    className="flex items-center gap-3 rounded-2xl border border-dashed border-app bg-app-card px-3.5 py-3 text-left"
                  >
                    <span
                      className="h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{ backgroundColor: area?.color ?? "#888" }}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm text-app-secondary">{task.title}</p>
                      <p className="text-[11px] text-app-faint">
                        {formatMinutes(task.estimateMinutes)} · add to this day
                      </p>
                    </div>
                    <span className="text-xs font-medium text-app-accent">+</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Bottom tabs */}
      <div className="absolute bottom-0 left-0 right-0 z-20 flex border-t border-app bg-app-nav px-6 pb-6 pt-2 backdrop-blur">
        <button
          type="button"
          onClick={onOpenOrbit}
          className="flex flex-1 flex-col items-center gap-0.5 py-1 text-app-muted"
        >
          <span className="text-lg">◎</span>
          <span className="text-[10px] font-medium">Orbit</span>
        </button>
        <button
          type="button"
          onClick={onCapture}
          className="-mt-5 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-r from-violet-500 to-violet-400 text-xl font-semibold text-white shadow-lg shadow-violet-500/30"
          aria-label="Dump it"
        >
          +
        </button>
        <button
          type="button"
          className="flex flex-1 flex-col items-center gap-0.5 py-1 text-app-accent"
        >
          <span className="text-lg">▦</span>
          <span className="text-[10px] font-medium">Calendar</span>
        </button>
      </div>
    </div>
  );
}

function GoogleCalIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden>
      <path
        fill="#4285F4"
        d="M19.5 4h-2V3a1 1 0 10-2 0v1h-7V3a1 1 0 10-2 0v1h-2A2.5 2.5 0 002 6.5v13A2.5 2.5 0 004.5 22h15a2.5 2.5 0 002.5-2.5v-13A2.5 2.5 0 0019.5 4z"
      />
      <path fill="#fff" d="M4 9h16v11.5a.5.5 0 01-.5.5h-15a.5.5 0 01-.5-.5V9z" />
      <path fill="#EA4335" d="M7 12h3v3H7z" />
      <path fill="#FBBC05" d="M10.5 12h3v3h-3z" />
      <path fill="#34A853" d="M14 12h3v3h-3z" />
    </svg>
  );
}
