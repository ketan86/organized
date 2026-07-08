"use client";

import { useMemo, useState } from "react";
import {
  CUSTOM_AREA_COLORS,
  areaScheduleLabel,
  formatHours,
  getDayBudgetStatuses,
  usualWeekBudgetErrorMessage,
  WEEK_DAY_LABELS,
  WEEK_DAY_ORDER,
  type AreaDef,
  type UsualWeekBlock,
} from "@/lib/mock-data";
import { ShieldIcon } from "@/components/ui/ShieldIcon";

type LifeMapScreenProps = {
  areas: AreaDef[];
  usualWeek: UsualWeekBlock[];
  protectedIds: string[];
  onOpenSchedule: (areaId: string) => void;
  onAddArea: (area: AreaDef) => void;
  onOpenAccount: () => void;
  embedded?: boolean;
  showAdd?: boolean;
  onShowAddChange?: (open: boolean) => void;
};

export function LifeMapScreen({
  areas,
  usualWeek,
  protectedIds,
  onOpenSchedule,
  onAddArea,
  onOpenAccount,
  embedded = false,
  showAdd: showAddProp,
  onShowAddChange,
}: LifeMapScreenProps) {
  const [showAddInternal, setShowAddInternal] = useState(false);
  const showAdd = showAddProp ?? showAddInternal;
  const setShowAdd = onShowAddChange ?? setShowAddInternal;
  const [name, setName] = useState("");

  const dayBudgets = useMemo(
    () => getDayBudgetStatuses(usualWeek),
    [usualWeek],
  );
  const overDays = dayBudgets.filter((d) => d.over);

  const areaRows = useMemo(
    () =>
      areas.map((area) => ({
        area,
        meta: areaScheduleLabel(usualWeek, area.id),
      })),
    [areas, usualWeek],
  );

  function handleAdd() {
    const trimmed = name.trim();
    if (!trimmed) return;
    const color =
      CUSTOM_AREA_COLORS[areas.filter((a) => a.isCustom).length % CUSTOM_AREA_COLORS.length];
    onAddArea({
      id: `custom-${Date.now()}`,
      name: trimmed,
      color,
      defaultHours: 1,
      defaultSelected: true,
      defaultProtected: false,
      blocks: [],
      daysPattern: "everyday",
      isCustom: true,
    });
    setName("");
    setShowAdd(false);
  }

  return (
    <div className={`panel-page flex flex-col gap-4 ${embedded ? "" : "pb-28 pt-14"}`}>
      {!embedded && (
        <div className="mb-1 flex items-center justify-between gap-2">
          <div className="min-w-0">
            <h1 className="text-lg font-semibold text-app">Your usual week</h1>
            <p className="mt-1 text-xs text-app-muted">
              How each life area runs Mon–Sun
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowAdd(true)}
            className="btn-primary btn-sm shrink-0 whitespace-nowrap"
          >
            + Add life area
          </button>
          <button
            type="button"
            onClick={onOpenAccount}
            className="btn-icon"
            aria-label="Account"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
              <circle cx="12" cy="8" r="4" />
              <path d="M4 20c0-4 4-6 8-6s8 2 8 6" />
            </svg>
          </button>
        </div>
      )}

      {embedded && (
        <p className="text-xs text-app-muted">
          Tap a life area to set its schedule. Protected areas show a shield and
          get priority when rebalancing.
        </p>
      )}

      <div className="rounded-2xl border border-app bg-app-card p-3">
        <div className="mb-2 flex items-center justify-between gap-2">
          <p className="text-[11px] font-medium uppercase tracking-wide text-app-muted">
            Daily budget · 24h
          </p>
          {overDays.length > 0 ? (
            <p className="text-[11px] font-medium text-app-warning">
              Over on {overDays.length} day{overDays.length === 1 ? "" : "s"}
            </p>
          ) : (
            <p className="text-[11px] text-app-muted">100% = full day</p>
          )}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {WEEK_DAY_ORDER.map((dow) => {
            const day = dayBudgets.find((d) => d.dayOfWeek === dow)!;
            return (
              <div
                key={dow}
                className={`rounded-lg px-1 py-2.5 text-center ${
                  day.over ? "bg-app-warning" : "bg-app-input/60"
                }`}
              >
                <p className="text-[11px] font-semibold text-app">
                  {WEEK_DAY_LABELS[dow]}
                </p>
                <p className="mt-1 text-sm font-semibold tabular-nums text-app">
                  {day.hours > 0 ? formatHours(day.hours) : "—"}
                </p>
                <p
                  className={`mt-0.5 text-xs tabular-nums ${
                    day.over ? "font-medium text-app-warning" : "text-app-muted"
                  }`}
                >
                  {day.hours > 0 ? `${day.pct}%` : "0%"}
                </p>
              </div>
            );
          })}
        </div>
        {overDays.length > 0 && (
          <p className="mt-2 text-[11px] leading-relaxed text-app-warning">
            {usualWeekBudgetErrorMessage(overDays)}
          </p>
        )}
      </div>

      {!embedded && (
        <p className="text-xs text-app-muted">
          Tap a row to edit its weekly schedule.
        </p>
      )}

      <ul className="divide-y divide-[var(--border)]">
        {areaRows.map(({ area, meta }) => {
          const isProtected = protectedIds.includes(area.id);
          return (
            <li key={area.id}>
              <button
                type="button"
                onClick={() => onOpenSchedule(area.id)}
                className="flex w-full items-center gap-3 py-3 text-left transition hover:bg-app-card/50"
              >
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: area.color }}
                />
                <div className="flex min-w-0 flex-1 items-center gap-1.5 truncate">
                  <span className="text-sm font-medium text-app">{area.name}</span>
                  {isProtected && (
                    <ShieldIcon
                      filled
                      className="shrink-0 text-app-success"
                    />
                  )}
                  <span className="truncate text-xs text-app-muted">
                    · {meta}
                  </span>
                </div>
                <span className="shrink-0 text-app-faint">›</span>
              </button>
            </li>
          );
        })}
      </ul>

      {showAdd && (
        <div className="absolute inset-0 z-50 flex items-end justify-center bg-app-overlay">
          <div className="w-full rounded-t-3xl border border-app bg-app-elevated p-6 pb-10">
            <h3 className="text-lg font-semibold text-app">New life area</h3>
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAdd()}
              placeholder="e.g. Side project"
              className="mt-4 w-full rounded-2xl border border-app bg-app-input px-4 py-3.5 text-[15px] text-app outline-none placeholder-app"
            />
            <div className="mt-4 flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowAdd(false);
                  setName("");
                }}
                className="btn-secondary btn-lg flex-1"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!name.trim()}
                onClick={handleAdd}
                className="btn-primary btn-lg flex-1"
              >
                Add
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
