"use client";

import { useMemo, useState } from "react";
import {
  addDays,
  DEMO_CAPTURE_TEXT,
  DMV_CAPTURE_SUGGESTION,
  formatDateLabel,
  formatHours,
  formatMinutes,
  getAreaPressure,
  resolveScheduleChoice,
  todayKey,
  type AreaDef,
  type CaptureSuggestion,
  type ScheduleChoice,
  type Task,
} from "@/lib/mock-data";
import type { AreaWeight } from "./onboarding/WeightageScreen";

export type CaptureConfirm = {
  suggestion: CaptureSuggestion;
  scheduledDate: string | null;
  dueDate: string | null;
};

type CaptureSheetProps = {
  areas: AreaDef[];
  weights: AreaWeight[];
  tasks: Task[];
  onClose: () => void;
  onConfirm: (payload: CaptureConfirm) => void;
};

type Phase = "input" | "review";

const SCHEDULE_CHOICES: { id: ScheduleChoice; label: string }[] = [
  { id: "today", label: "Today" },
  { id: "tomorrow", label: "Tomorrow" },
  { id: "due", label: "On due day" },
  { id: "backlog", label: "Backlog" },
];

export function CaptureSheet({
  areas,
  weights,
  tasks,
  onClose,
  onConfirm,
}: CaptureSheetProps) {
  const [phase, setPhase] = useState<Phase>("input");
  const [text, setText] = useState(DEMO_CAPTURE_TEXT);
  const [sorting, setSorting] = useState(false);
  const [scheduleChoice, setScheduleChoice] = useState<ScheduleChoice>(
    DMV_CAPTURE_SUGGESTION.defaultSchedule,
  );

  const suggestion = DMV_CAPTURE_SUGGESTION;
  const area = areas.find((a) => a.id === suggestion.areaId);
  const weight = weights.find((w) => w.id === suggestion.areaId);
  const budgetHours = weight?.hours ?? 1;

  const dueDate =
    suggestion.dueInDays != null
      ? addDays(todayKey(), suggestion.dueInDays)
      : null;

  const scheduledDate = resolveScheduleChoice(scheduleChoice, dueDate);
  const impactWindow = scheduledDate === todayKey() ? "today" : "week";

  const currentPressure = useMemo(() => {
    if (!area) {
      return {
        areaId: suggestion.areaId,
        budgetHours,
        capacity: budgetHours,
        load: 0,
        ratio: 0,
        free: budgetHours,
        overloaded: false,
      };
    }
    return getAreaPressure(area, budgetHours, tasks, impactWindow);
  }, [area, suggestion.areaId, budgetHours, tasks, impactWindow]);

  const projectedLoad =
    currentPressure.load + suggestion.estimateMinutes / 60;
  const projectedOver = projectedLoad > currentPressure.capacity;

  function handleSort() {
    setSorting(true);
    globalThis.setTimeout(() => {
      setSorting(false);
      setPhase("review");
    }, 700);
  }

  return (
    <div className="flex h-full w-full flex-col justify-end bg-app-overlay backdrop-blur-[2px]">
      <button
        type="button"
        className="min-h-0 flex-1 cursor-default"
        aria-label="Close"
        onClick={onClose}
      />
      <div className="relative z-10 max-h-[85%] overflow-y-auto rounded-t-3xl border border-app bg-app-elevated px-5 pb-8 pt-4">
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-app-chip" />

        {phase === "input" && (
          <>
            <h2 className="text-lg font-semibold text-app">Ask AI</h2>
            <p className="mt-1 text-sm text-app-muted">
              Describe it in your own words. We’ll place it and estimate time.
            </p>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={4}
              className="mt-4 w-full resize-none rounded-2xl border border-app bg-app-input px-4 py-3.5 text-[15px] leading-relaxed text-app outline-none placeholder-app focus:border-app-accent"
              placeholder="What’s on your mind?"
            />
            <button
              type="button"
              disabled={!text.trim() || sorting}
              onClick={handleSort}
              className="mt-4 w-full rounded-2xl bg-gradient-to-r from-violet-500 to-violet-400 py-3.5 text-[15px] font-semibold text-white shadow-lg shadow-violet-500/25 disabled:opacity-50"
            >
              {sorting ? "Sorting…" : "Let AI sort it"}
            </button>
          </>
        )}

        {phase === "review" && area && (
          <>
            <p className="text-[11px] font-medium uppercase tracking-wider text-app-accent-soft">
              AI suggestion
            </p>
            <h2 className="mt-1 text-lg font-semibold text-app">
              {suggestion.title}
            </h2>

            <div className="mt-4 flex flex-wrap gap-2">
              <span className="flex items-center gap-1.5 rounded-full border border-app bg-app-input px-3 py-1.5 text-xs font-medium text-app">
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: area.color }}
                />
                {area.name}
              </span>
              <span className="rounded-full border border-app bg-app-input px-3 py-1.5 text-xs font-medium text-app">
                ~{formatMinutes(suggestion.estimateMinutes)}
              </span>
              {dueDate && (
                <span className="rounded-full border border-app bg-app-card px-3 py-1.5 text-xs font-medium text-app-secondary">
                  Due {formatDateLabel(dueDate)}
                </span>
              )}
            </div>

            <div className="mt-4">
              <p className="text-xs font-medium text-app-muted">Schedule when</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {SCHEDULE_CHOICES.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setScheduleChoice(c.id)}
                    className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                      scheduleChoice === c.id
                        ? "bg-violet-500 text-white"
                        : "border border-app bg-app-card text-app-secondary"
                    }`}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
              <p className="mt-2 text-[11px] text-app-faint">
                Counts on:{" "}
                {scheduledDate
                  ? formatDateLabel(scheduledDate)
                  : "Backlog (week only)"}
              </p>
            </div>

            <div
              className={`mt-4 rounded-2xl border p-3 ${
                projectedOver
                  ? "border-app-warning bg-app-warning"
                  : "border-app bg-app-card"
              }`}
            >
              <p
                className={`text-xs font-medium ${
                  projectedOver ? "text-app-warning-soft" : "text-app-secondary"
                }`}
              >
                Budget impact ·{" "}
                {impactWindow === "today" ? "today" : "this week"}
              </p>
              <p
                className={`mt-1 text-sm ${
                  projectedOver ? "text-app-warning-soft" : "text-app-secondary"
                }`}
              >
                {area.name} would be {formatHours(projectedLoad)} /{" "}
                {formatHours(currentPressure.capacity)}
                {projectedOver && (
                  <span>
                    {" "}
                    — over by{" "}
                    {formatHours(projectedLoad - currentPressure.capacity)}
                  </span>
                )}
              </p>
            </div>

            <div className="mt-4">
              <p className="text-xs font-medium text-app-muted">Plan preview</p>
              <ul className="mt-2 space-y-2">
                {suggestion.planSteps.map((step) => (
                  <li
                    key={step.title}
                    className="flex items-start gap-2 text-sm text-app-secondary"
                  >
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-violet-400/80" />
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

            <div className="mt-5 flex gap-3">
              <button
                type="button"
                onClick={() => setPhase("input")}
                className="flex-1 rounded-2xl border border-app py-3.5 text-sm font-medium text-app-secondary"
              >
                Edit
              </button>
              <button
                type="button"
                onClick={() =>
                  onConfirm({ suggestion, scheduledDate, dueDate })
                }
                className="flex-[1.4] rounded-2xl bg-gradient-to-r from-violet-500 to-violet-400 py-3.5 text-sm font-semibold text-white"
              >
                Add to {area.name}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
