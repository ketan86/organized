"use client";

import { useMemo, type ReactNode } from "react";
import {
  buildCoachInsight,
  centerReadout,
  formatAreaProgressSummary,
  formatElapsed,
  getAllAreaProgress,
  getAreaPressure,
  plannedHoursForArea,
  progressRollup,
  type AreaDef,
  type AreaProgress,
  type IntentId,
  type Session,
  type Task,
  type TimeWindow,
  type UsualWeekBlock,
} from "@/lib/mock-data";
import { AreaProgressBar } from "@/components/AreaProgressBar";
import { ProgressRing } from "@/components/ProgressRing";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useElapsed } from "@/hooks/useElapsed";

function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <div className="mb-2 flex items-center gap-3">
      <div className="h-px flex-1 bg-app-chip" />
      <h2 className="shrink-0 text-center text-xs font-semibold tracking-wide text-app">
        {children}
      </h2>
      <div className="h-px flex-1 bg-app-chip" />
    </div>
  );
}

function AccountIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c0-4 4-6 8-6s8 2 8 6" />
    </svg>
  );
}

type OrbitItem = AreaDef & {
  hours: number;
  progress: AreaProgress;
  pressure: ReturnType<typeof getAreaPressure>;
};

type LifeOrbitScreenProps = {
  areas: AreaDef[];
  usualWeek: UsualWeekBlock[];
  intents: IntentId[];
  tasks: Task[];
  sessions: Session[];
  runningSession: Session | null;
  window: TimeWindow;
  onWindowChange: (window: TimeWindow) => void;
  onOpenArea: (areaId: string) => void;
  onOpenTask?: (taskId: string) => void;
  onCapture: () => void;
  onOpenCalendar: () => void;
  onOpenAccount: () => void;
  onStartTracking: (areaId: string) => void;
  onStopTracking: () => void;
  onSwitchTracking: () => void;
  switchNotice: string | null;
  progressNotice: string | null;
  embedded?: boolean;
};

export function LifeOrbitScreen({
  areas,
  usualWeek,
  intents,
  tasks,
  sessions,
  runningSession,
  window,
  onWindowChange,
  onOpenArea,
  onOpenTask,
  onCapture,
  onOpenCalendar,
  onOpenAccount,
  onStartTracking,
  onStopTracking,
  onSwitchTracking,
  switchNotice,
  progressNotice,
  embedded = false,
}: LifeOrbitScreenProps) {
  const progresses = useMemo(
    () => getAllAreaProgress(areas, usualWeek, tasks, sessions, window),
    [areas, usualWeek, tasks, sessions, window],
  );

  const progressByArea = useMemo(
    () => new Map(progresses.map((p) => [p.areaId, p])),
    [progresses],
  );

  const runningLabel = useMemo(() => {
    if (!runningSession) return null;
    if (runningSession.targetType === "area") {
      return areas.find((a) => a.id === runningSession.targetId)?.name ?? "Live";
    }
    const task = tasks.find((t) => t.id === runningSession.targetId);
    return task?.title ?? "Task";
  }, [runningSession, areas, tasks]);

  const runningArea = useMemo(() => {
    if (!runningSession) return null;
    return areas.find((a) => a.id === runningSession.areaId) ?? null;
  }, [runningSession, areas]);

  const elapsed = useElapsed(
    runningSession?.startedAt ?? null,
    !!runningSession,
  );

  const items = useMemo(
    () =>
      areas
        .map((area) => {
          const progress = progressByArea.get(area.id);
          if (!progress) return null;
          const hours = plannedHoursForArea(usualWeek, area.id, window);
          const pressure = getAreaPressure(area, usualWeek, tasks, window);
          return { ...area, hours, progress, pressure };
        })
        .filter(Boolean) as OrbitItem[],
    [areas, progressByArea, usualWeek, tasks, window],
  );

  const activeItems = useMemo(
    () => items.filter((i) => i.hours > 0),
    [items],
  );

  const insight = buildCoachInsight(progresses, areas, intents, window);
  const readout = centerReadout(progresses, areas, window);
  const rollup = progressRollup(progresses);
  const windowLabel = window === "today" ? "Today" : "This week";

  const overallPct = useMemo(() => {
    if (activeItems.length === 0) return 0;
    const sum = activeItems.reduce((s, i) => s + i.progress.progressPct, 0);
    return Math.round(sum / activeItems.length);
  }, [activeItems]);

  const sortedRows = [...activeItems].sort((a, b) => {
    if (a.progress.overloaded !== b.progress.overloaded) {
      return a.progress.overloaded ? -1 : 1;
    }
    if (a.progress.goalMet !== b.progress.goalMet) {
      return a.progress.goalMet ? 1 : -1;
    }
    return a.progress.progressRatio - b.progress.progressRatio;
  });

  const heroFill =
    rollup.withGoal > 0 && rollup.goalsMet === rollup.withGoal
      ? "var(--success-text)"
      : rollup.overloaded > 0
        ? "#fbbf24"
        : "var(--accent)";

  return (
    <div className={`relative flex min-h-full flex-col ${embedded ? "px-4 pb-8 pt-4" : "px-5 pb-28 pt-14"}`}>
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="animate-pulse-soft absolute left-1/2 top-[18%] h-48 w-48 -translate-x-1/2 rounded-full bg-[color-mix(in_srgb,var(--accent)_12%,transparent)] blur-3xl" />
      </div>

      {!embedded && (
      <div className="relative z-10 flex items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-app-faint">
            Life Orbit
          </p>
          <h1 className="mt-0.5 text-lg font-semibold text-app">Organized</h1>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <div className="btn-segment">
            {(["today", "week"] as const).map((w) => (
              <button
                key={w}
                type="button"
                onClick={() => onWindowChange(w)}
                className={`btn-segment-item ${
                  window === w ? "btn-segment-item-active" : ""
                }`}
              >
                {w === "today" ? "Today" : "Week"}
              </button>
            ))}
          </div>
          <ThemeToggle compact />
          <button
            type="button"
            onClick={onOpenAccount}
            className="btn-icon border border-app bg-app-card"
            aria-label="Account"
          >
            <AccountIcon />
          </button>
        </div>
      </div>
      )}


      {switchNotice && (
        <div className="relative z-10 mt-3 rounded-2xl border border-app bg-app-card px-3.5 py-2.5 text-sm text-app">
          {switchNotice}
        </div>
      )}

      {progressNotice && (
        <div className="progress-notice relative z-10 mt-3 rounded-2xl border border-app-success bg-app-success px-3.5 py-2.5 text-sm text-app-success">
          {progressNotice}
        </div>
      )}

      {/* Live timer */}
      {runningSession && (
        <div className="relative z-10 mt-3 rounded-2xl border border-app-accent bg-app-accent-soft px-3.5 py-3">
          <div className="flex w-full items-center gap-3">
            <button
              type="button"
              onClick={() => {
                if (runningSession.targetType === "area") {
                  onOpenArea(runningSession.targetId);
                } else if (onOpenTask) {
                  onOpenTask(runningSession.targetId);
                } else {
                  onOpenArea(runningSession.areaId);
                }
              }}
              className="flex min-w-0 flex-1 items-center gap-3 text-left"
            >
              <span
                className="h-3 w-3 shrink-0 animate-pulse rounded-full"
                style={{ backgroundColor: runningArea?.color ?? "#8b7cf6" }}
              />
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-medium uppercase tracking-wider text-app-accent-soft">
                  Now
                </p>
                <p className="truncate text-sm font-semibold text-app">
                  {runningLabel}
                </p>
              </div>
              <span className="text-sm font-semibold tabular-nums text-app">
                {formatElapsed(elapsed)}
              </span>
            </button>
          </div>
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={onSwitchTracking}
              className="btn-secondary btn-sm flex-1"
            >
              Switch
            </button>
            <button
              type="button"
              onClick={onStopTracking}
              className="btn-primary btn-sm flex-1"
            >
              Stop
            </button>
          </div>
          <p className="mt-2 text-[10px] leading-relaxed text-app-muted">
            Switch = pause for a chore, then come back. Stop = done with this for
            now.
          </p>
        </div>
      )}

      {/* Hero ring — overall progress */}
      <div className="relative z-10 mt-4 flex flex-col items-center">
        <p className="mb-3 text-[10px] uppercase tracking-wider text-app-faint">
          {windowLabel} · goal progress
        </p>

        {activeItems.length === 0 ? (
          <div className="flex h-36 w-36 items-center justify-center rounded-full border border-app bg-app-card px-6 text-center">
            <p className="text-sm text-app-muted">
              Nothing planned for {windowLabel.toLowerCase()}
            </p>
          </div>
        ) : (
          <>
            <ProgressRing
              size={144}
              strokeWidth={10}
              progressPct={overallPct}
              fillColor={heroFill}
            >
              <p className="text-2xl font-bold tabular-nums text-app">
                {overallPct}%
              </p>
              {rollup.withGoal > 0 && (
                <p className="mt-0.5 text-[10px] font-medium text-app-muted">
                  {rollup.goalsMet}/{rollup.withGoal} goals
                </p>
              )}
            </ProgressRing>
            <p className="mt-3 max-w-[220px] text-center text-xs font-medium leading-snug text-app-secondary">
              {readout}
            </p>
          </>
        )}
      </div>

      {/* Life part rows */}
      <div className="relative z-10 mt-6">
        <SectionTitle>
          {window === "today" ? "Today" : "This week"}
        </SectionTitle>
        <div className="flex flex-col gap-2">
          {sortedRows.map((item) => {
            const summary = formatAreaProgressSummary(item.progress);
            const trackingHere =
              runningSession != null && runningSession.areaId === item.id;

            return (
              <div
                key={item.id}
                className={`rounded-2xl border bg-app-card px-3 py-3 ${
                  trackingHere ? "border-app-accent" : "border-app"
                }`}
              >
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onOpenArea(item.id)}
                    className="flex min-w-0 flex-1 items-center gap-3 text-left transition active:scale-[0.99]"
                  >
                    <span
                      className="h-3 w-3 shrink-0 rounded-full"
                      style={{ backgroundColor: item.color }}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-semibold text-app">
                          {item.name}
                        </p>
                        <span
                          className={`shrink-0 text-xs font-semibold tabular-nums ${
                            item.progress.goalMet
                              ? "text-app-success"
                              : item.progress.overloaded
                                ? "text-app-warning"
                                : "text-app-muted"
                          }`}
                        >
                          {item.progress.progressPct}%
                        </span>
                      </div>
                      <AreaProgressBar
                        progressPct={item.progress.progressPct}
                        color={item.color}
                        goalMet={item.progress.goalMet}
                        overloaded={item.progress.overloaded}
                        className="mt-2"
                      />
                      <p
                        className={`mt-1.5 truncate text-xs ${
                          item.progress.overloaded
                            ? "text-app-warning"
                            : item.progress.goalMet
                              ? "text-app-success"
                              : "text-app-muted"
                        }`}
                      >
                        {summary}
                      </p>
                    </div>
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      className="shrink-0 self-center text-app-faint"
                    >
                      <path d="M9 18l6-6-6-6" />
                    </svg>
                  </button>
                  {trackingHere ? (
                    <button
                      type="button"
                      onClick={onStopTracking}
                      className="btn-primary btn-sm shrink-0"
                    >
                      Stop
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => onStartTracking(item.id)}
                      className="btn-secondary btn-sm shrink-0"
                    >
                      Start
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Coach */}
      <div className="relative z-10 mt-4 mb-2 rounded-3xl border border-app bg-app-card p-4 backdrop-blur-sm">
        <p className="text-[11px] font-medium uppercase tracking-wider text-app-accent-soft">
          Coach
        </p>
        <h2 className="mt-1 text-base font-semibold text-app">
          {insight.headline}
        </h2>
        <p className="mt-1.5 text-sm leading-relaxed text-app-muted">
          {insight.body}
        </p>
        <button
          type="button"
          onClick={() => {
            if (insight.ctaAreaId) onOpenArea(insight.ctaAreaId);
            else onCapture();
          }}
          className="mt-3 rounded-xl bg-app-chip px-3.5 py-2 text-sm font-medium text-app transition active:scale-[0.98]"
        >
          {insight.ctaLabel}
        </button>
      </div>

      {/* Bottom tabs */}
      {!embedded && (
      <div className="absolute bottom-0 left-0 right-0 z-20 flex border-t border-app bg-app-nav px-6 pb-6 pt-2 backdrop-blur lg:hidden">
        <button
          type="button"
          className="flex flex-1 flex-col items-center gap-0.5 py-1 text-app-accent"
        >
          <span className="text-lg">◎</span>
          <span className="text-[10px] font-medium">Orbit</span>
        </button>
        <button
          type="button"
          onClick={onCapture}
          className="fab-primary -mt-5"
          aria-label="Capture"
        >
          +
        </button>
        <button
          type="button"
          onClick={onOpenCalendar}
          className="flex flex-1 flex-col items-center gap-0.5 py-1 text-app-muted"
        >
          <span className="text-lg">▦</span>
          <span className="text-[10px] font-medium">Calendar</span>
        </button>
      </div>
      )}
    </div>
  );
}
