"use client";

import { useMemo, type ReactNode } from "react";
import {
  buildCoachInsight,
  buildPlanActual,
  centerReadout,
  daysPatternLabel,
  formatElapsed,
  formatHours,
  getAreaPressure,
  plannedHoursForArea,
  type AreaDef,
  type IntentId,
  type Session,
  type Task,
  type TimeWindow,
} from "@/lib/mock-data";
import type { AreaWeight } from "./onboarding/WeightageScreen";
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

/** Angle: 0° at top, clockwise (matches budget pie). */
function piePoint(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = (angleDeg * Math.PI) / 180;
  return {
    x: cx + r * Math.sin(rad),
    y: cy - r * Math.cos(rad),
  };
}

function pieDonutPath(
  cx: number,
  cy: number,
  rOuter: number,
  rInner: number,
  startAngle: number,
  sweep: number,
): string {
  const endAngle = startAngle + sweep;
  const large = sweep > 180 ? 1 : 0;
  const o1 = piePoint(cx, cy, rOuter, startAngle);
  const o2 = piePoint(cx, cy, rOuter, endAngle);
  const i1 = piePoint(cx, cy, rInner, endAngle);
  const i2 = piePoint(cx, cy, rInner, startAngle);
  return [
    `M ${o1.x} ${o1.y}`,
    `A ${rOuter} ${rOuter} 0 ${large} 1 ${o2.x} ${o2.y}`,
    `L ${i1.x} ${i1.y}`,
    `A ${rInner} ${rInner} 0 ${large} 0 ${i2.x} ${i2.y}`,
    "Z",
  ].join(" ");
}

type OrbitItem = AreaDef & {
  hours: number;
  pressure: ReturnType<typeof getAreaPressure>;
};

type LifeOrbitScreenProps = {
  areas: AreaDef[];
  weights: AreaWeight[];
  protectedIds: string[];
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
  onStopTracking: () => void;
  onSwitchTracking: () => void;
  switchNotice: string | null;
};

export function LifeOrbitScreen({
  areas,
  weights,
  protectedIds,
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
  onStopTracking,
  onSwitchTracking,
  switchNotice,
}: LifeOrbitScreenProps) {
  const pressures = useMemo(
    () =>
      areas.map((area) => {
        const hours =
          weights.find((w) => w.id === area.id)?.hours ?? area.defaultHours;
        return getAreaPressure(area, hours, tasks, window);
      }),
    [areas, weights, tasks, window],
  );

  const planActual = useMemo(
    () => buildPlanActual(areas, weights, sessions, window),
    [areas, weights, sessions, window],
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
      weights
        .map((w) => {
          const area = areas.find((a) => a.id === w.id);
          const pressure = pressures.find((p) => p.areaId === w.id);
          if (!area || !pressure) return null;
          const hours = plannedHoursForArea(area, w.hours, window);
          return { ...area, hours, pressure };
        })
        .filter(Boolean) as OrbitItem[],
    [weights, areas, pressures, window],
  );

  const pieItems = useMemo(
    () => items.filter((i) => i.hours > 0),
    [items],
  );

  const insight = buildCoachInsight(pressures, areas, intents);
  const readout = centerReadout(pressures, areas);
  const windowLabel = window === "today" ? "Today" : "This week";

  const totalBudget = pieItems.reduce((s, i) => s + i.hours, 0) || 1;
  let cursor = 0;
  const segments = pieItems.map((item) => {
    const start = cursor;
    const sweep = (item.hours / totalBudget) * 360;
    cursor += sweep;
    const pct = Math.round((item.hours / totalBudget) * 100);
    return { item, start, sweep, pct };
  });

  const sortedBars = [...items].sort(
    (a, b) => b.pressure.ratio - a.pressure.ratio,
  );

  const pieSize = 220;
  const pieCx = pieSize / 2;
  const pieCy = pieSize / 2;
  const pieOuter = 100;
  const pieInner = 52;
  const pieLabelR = (pieOuter + pieInner) / 2;

  return (
    <div className="relative flex min-h-full flex-col px-5 pb-28 pt-14">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="animate-pulse-soft absolute left-1/2 top-[18%] h-48 w-48 -translate-x-1/2 rounded-full bg-violet-500/10 blur-3xl" />
      </div>

      {/* Header */}
      <div className="relative z-10 flex items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-app-faint">
            Life Orbit
          </p>
          <h1 className="mt-0.5 text-lg font-semibold text-app">Organized</h1>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <ThemeToggle compact />
          <div className="flex rounded-full border border-app bg-app-card p-0.5">
            {(["today", "week"] as const).map((w) => (
              <button
                key={w}
                type="button"
                onClick={() => onWindowChange(w)}
                className={`rounded-full px-3 py-1.5 text-[11px] font-medium transition ${
                  window === w
                    ? "bg-app-chip text-app"
                    : "text-app-muted"
                }`}
              >
                {w === "today" ? "Today" : "Week"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Switch confirmation */}
      {switchNotice && (
        <div className="relative z-10 mt-3 rounded-2xl border border-app bg-app-card px-3.5 py-2.5 text-sm text-app">
          {switchNotice}
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
              className="flex-1 rounded-xl border border-app bg-app px-3 py-2 text-xs font-semibold text-app-accent"
            >
              Switch
            </button>
            <button
              type="button"
              onClick={onStopTracking}
              className="flex-1 rounded-xl bg-violet-500 px-3 py-2 text-xs font-semibold text-white"
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

      {/* Pie — budget share */}
      <div className="relative z-10 mt-4 flex flex-col items-center">
        <p className="mb-2 text-[10px] uppercase tracking-wider text-app-faint">
          {windowLabel} · budget mix
        </p>
        <div
          className="relative"
          style={{ width: pieSize, height: pieSize }}
        >
          {pieItems.length === 0 ? (
            <div className="flex h-full items-center justify-center rounded-full border border-app bg-app-card px-6 text-center">
              <p className="text-sm text-app-muted">
                Nothing planned for {windowLabel.toLowerCase()}
              </p>
            </div>
          ) : (
          <svg
            width={pieSize}
            height={pieSize}
            viewBox={`0 0 ${pieSize} ${pieSize}`}
            className="overflow-visible"
          >
            {segments.map(({ item, start, sweep, pct }) => {
              const color = item.pressure.overloaded ? "#fbbf24" : item.color;
              // Full circle edge case
              const safeSweep = Math.min(sweep, 359.99);
              if (safeSweep <= 0.01) return null;

              const mid = start + sweep / 2;
              const label = piePoint(pieCx, pieCy, pieLabelR, mid);
              const showLabel = pct >= 5 && sweep >= 18;

              return (
                <g key={item.id}>
                  <path
                    d={pieDonutPath(
                      pieCx,
                      pieCy,
                      pieOuter,
                      pieInner,
                      start,
                      safeSweep,
                    )}
                    fill={color}
                    className="cursor-pointer transition-opacity hover:opacity-90"
                    onClick={() => onOpenArea(item.id)}
                  />
                  {showLabel && (
                    <g
                      className="cursor-pointer"
                      onClick={() => onOpenArea(item.id)}
                    >
                      <text
                        x={label.x}
                        y={label.y - 5}
                        textAnchor="middle"
                        fill="#fff"
                        fontSize="11"
                        fontWeight="600"
                        style={{
                          paintOrder: "stroke",
                          stroke: "rgba(0,0,0,0.5)",
                          strokeWidth: 3,
                        }}
                      >
                        {item.name}
                      </text>
                      <text
                        x={label.x}
                        y={label.y + 9}
                        textAnchor="middle"
                        fill="#fff"
                        fontSize="10"
                        fontWeight="500"
                        style={{
                          paintOrder: "stroke",
                          stroke: "rgba(0,0,0,0.5)",
                          strokeWidth: 3,
                        }}
                      >
                        {pct}%
                      </text>
                    </g>
                  )}
                </g>
              );
            })}
            <circle
              cx={pieCx}
              cy={pieCy}
              r={pieInner - 1}
              style={{ fill: "var(--pie-center)" }}
            />
          </svg>
          )}
          {pieItems.length > 0 && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center px-10 text-center">
            <p className="max-w-[100px] text-[12px] font-semibold leading-snug text-app">
              {readout}
            </p>
          </div>
          )}
        </div>
      </div>

      {/* Per life part: tasks + tracked time */}
      <div className="relative z-10 mt-6">
        <SectionTitle>
          {window === "today" ? "Today" : "This week"}
        </SectionTitle>
        <p className="mb-3 text-center text-[11px] leading-relaxed text-app-muted">
          Tasks on your plate, and time from Start / Stop, vs hours you set.
        </p>
        <div className="flex flex-col gap-2">
          {sortedBars.map((item) => {
            const fill = Math.min(item.pressure.ratio * 100, 100);
            const overloaded = item.pressure.overloaded;
            const isProtected = protectedIds.includes(item.id);
            const room = item.pressure.capacity - item.pressure.load;
            const tracked = planActual.find((r) => r.areaId === item.id);
            const actualHours = tracked?.actualHours ?? 0;
            const plannedHours =
              tracked?.plannedHours ?? item.pressure.capacity;
            const trackDelta = actualHours - plannedHours;
            const trackOver = trackDelta > 0.08;
            const trackUnder = trackDelta < -0.08 && plannedHours > 0;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onOpenArea(item.id)}
                className="rounded-2xl border border-app bg-app-card px-3 py-3 text-left transition active:scale-[0.99]"
              >
                <div className="mb-2 flex items-center gap-2">
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="truncate text-sm font-medium text-app">
                    {item.name}
                  </span>
                  {isProtected && (
                    <span className="rounded-full bg-app-success px-1.5 py-0.5 text-[9px] font-medium text-app-success">
                      protected
                    </span>
                  )}
                </div>

                <div className="space-y-1 text-[11px] text-app-muted">
                  <p>
                    You set:{" "}
                    <span className="font-medium text-app">
                      {plannedHours > 0
                        ? formatHours(plannedHours)
                        : "nothing today"}
                    </span>
                    <span className="text-app-faint">
                      {" "}
                      · {daysPatternLabel(item.daysPattern)}
                    </span>
                  </p>
                  <p>
                    Open tasks:{" "}
                    <span className="font-medium text-app">
                      {formatHours(item.pressure.load)}
                    </span>
                    <span
                      className={
                        overloaded ? "text-app-warning" : "text-app-faint"
                      }
                    >
                      {plannedHours <= 0
                        ? item.pressure.load > 0
                          ? " · tasks on a day with no plan"
                          : " · no plan today"
                        : overloaded
                          ? ` · ${formatHours(item.pressure.load - item.pressure.capacity)} more than planned`
                          : room > 0.05
                            ? ` · ${formatHours(room)} room left`
                            : " · matches plan"}
                    </span>
                  </p>
                  <p>
                    You tracked:{" "}
                    <span className="font-medium text-app">
                      {formatHours(actualHours)}
                    </span>
                    <span
                      className={
                        trackOver
                          ? "text-app-warning"
                          : trackUnder
                            ? "text-app-accent"
                            : "text-app-faint"
                      }
                    >
                      {plannedHours <= 0
                        ? actualHours > 0
                          ? " · extra (not on today’s plan)"
                          : " · none"
                        : trackOver
                          ? ` · ${formatHours(trackDelta)} longer than planned`
                          : trackUnder
                            ? ` · ${formatHours(-trackDelta)} still available`
                            : " · on plan"}
                    </span>
                  </p>
                </div>

                <div className="mt-2 h-2 overflow-hidden rounded-full bg-app-input">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${fill}%`,
                      backgroundColor: overloaded ? "#fbbf24" : item.color,
                    }}
                  />
                </div>
              </button>
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
      <div className="absolute bottom-0 left-0 right-0 z-20 flex border-t border-app bg-app-nav px-6 pb-6 pt-2 backdrop-blur">
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
          className="-mt-5 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-r from-violet-500 to-violet-400 text-xl font-semibold text-white shadow-lg shadow-violet-500/30"
          aria-label="Dump it"
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
    </div>
  );
}
