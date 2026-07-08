"use client";

import { useState } from "react";
import {
  areaScheduleLabel,
  blockDurationHours,
  dayAllocationPct,
  formatBlockLabel,
  formatHours,
  formatTimeLabel,
  plannedHoursOnDay,
  TIME_OPTIONS,
  usualWeekBudgetErrorMessage,
  validateUsualWeekBudget,
  WEEK_DAY_LABELS,
  WEEK_DAY_ORDER,
  type AreaDef,
  type UsualWeekBlock,
} from "@/lib/mock-data";
import { SettingsRow, SettingsSection } from "@/components/ui/SettingsRows";
import { ShieldIcon } from "@/components/ui/ShieldIcon";

type LifePartScheduleScreenProps = {
  area: AreaDef;
  usualWeek: UsualWeekBlock[];
  isProtected: boolean;
  onToggleProtected: () => void;
  onChange: (blocks: UsualWeekBlock[]) => void;
  onBack: () => void;
  embedded?: boolean;
};

export function LifePartScheduleScreen({
  area,
  usualWeek,
  isProtected,
  onToggleProtected,
  onChange,
  onBack,
  embedded = false,
}: LifePartScheduleScreenProps) {
  const [openDay, setOpenDay] = useState<number | null>(1);
  const [budgetError, setBudgetError] = useState<string | null>(null);

  const areaBlocks = usualWeek.filter((b) => b.areaId === area.id);

  function blocksForDay(dow: number) {
    return areaBlocks
      .filter((b) => b.dayOfWeek === dow)
      .sort((a, b) => a.start.localeCompare(b.start));
  }

  function applyChange(next: UsualWeekBlock[]) {
    const budget = validateUsualWeekBudget(next);
    if (!budget.ok) {
      setBudgetError(usualWeekBudgetErrorMessage(budget.overDays));
      return;
    }
    setBudgetError(null);
    onChange(next);
  }

  function addBlock(dow: number) {
    const id = `uw-${area.id}-${dow}-${Date.now()}`;
    applyChange([
      ...usualWeek,
      { id, areaId: area.id, dayOfWeek: dow, start: "09:00", end: "10:00" },
    ]);
    setOpenDay(dow);
  }

  function updateBlock(id: string, patch: Partial<UsualWeekBlock>) {
    applyChange(usualWeek.map((b) => (b.id === id ? { ...b, ...patch } : b)));
  }

  function removeBlock(id: string) {
    applyChange(usualWeek.filter((b) => b.id !== id));
  }

  function clearDay(dow: number) {
    applyChange(
      usualWeek.filter((b) => !(b.areaId === area.id && b.dayOfWeek === dow)),
    );
  }

  /** Copy this day's blocks onto Mon–Fri */
  function applyToWeekdays(fromDow: number) {
    const source = blocksForDay(fromDow);
    const withoutWeekdays = usualWeek.filter(
      (b) =>
        !(
          b.areaId === area.id &&
          b.dayOfWeek >= 1 &&
          b.dayOfWeek <= 5
        ),
    );
    const copies = [1, 2, 3, 4, 5].flatMap((dow) =>
      source.map((b) => ({
        ...b,
        id: `uw-${area.id}-${dow}-${b.start}-${Date.now()}-${dow}`,
        dayOfWeek: dow,
      })),
    );
    applyChange([...withoutWeekdays, ...copies]);
  }

  /** Copy this day's blocks onto Sat–Sun */
  function applyToWeekends(fromDow: number) {
    const source = blocksForDay(fromDow);
    const withoutWeekends = usualWeek.filter(
      (b) =>
        !(b.areaId === area.id && (b.dayOfWeek === 0 || b.dayOfWeek === 6)),
    );
    const copies = [6, 0].flatMap((dow) =>
      source.map((b) => ({
        ...b,
        id: `uw-${area.id}-${dow}-${b.start}-${Date.now()}-${dow}`,
        dayOfWeek: dow,
      })),
    );
    applyChange([...withoutWeekends, ...copies]);
  }

  const weekHoursLabel = areaScheduleLabel(usualWeek, area.id, {
    includeWeekTotal: true,
  });

  return (
    <div
      className={`flex min-h-full flex-col ${embedded ? "panel-page" : "px-5 pb-8 pt-14"}`}
    >
      {!embedded && (
        <div className="mb-5 flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-app bg-app-card text-app-secondary"
            aria-label="Back"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
                <ShieldIcon filled className="shrink-0 text-app-success" />
              )}
            </div>
            <p className="text-xs text-app-muted">{weekHoursLabel}</p>
          </div>
        </div>
      )}

      <SettingsSection className="mb-5">
        <SettingsRow
          label="Protected"
          hint="Won't be cut when your week is overloaded"
        >
          <button
            type="button"
            role="switch"
            aria-checked={isProtected}
            onClick={onToggleProtected}
            className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium transition ${
              isProtected
                ? "bg-app-success text-app-success"
                : "border border-app bg-app text-app-muted"
            }`}
          >
            <ShieldIcon filled={isProtected} />
            {isProtected ? "On" : "Off"}
          </button>
        </SettingsRow>
      </SettingsSection>

      <p className="mb-3 text-[11px] leading-relaxed text-app-muted">
        Turn days on with a time block. Each day is capped at 24 hours across
        all life areas. Use “Apply to weekdays” so you don’t set Work five times.
      </p>

      {budgetError && (
        <p className="mb-3 rounded-xl border border-app-warning bg-app-warning px-3 py-2.5 text-[11px] leading-relaxed text-app-warning">
          {budgetError}
        </p>
      )}

      <div className="flex flex-col gap-2">
        {WEEK_DAY_ORDER.map((dow) => {
          const dayBlocks = blocksForDay(dow);
          const isOpen = openDay === dow;
          const areaDayHours = dayBlocks.reduce(
            (s, b) => s + blockDurationHours(b),
            0,
          );
          const totalDayHours = plannedHoursOnDay(usualWeek, dow);
          const totalPct = dayAllocationPct(totalDayHours);
          const dayOver = totalDayHours > 24.001;

          return (
            <div
              key={dow}
              className={`rounded-2xl border bg-app-card overflow-hidden ${
                dayOver ? "border-app-warning" : "border-app"
              }`}
            >
              <button
                type="button"
                onClick={() => setOpenDay(isOpen ? null : dow)}
                className="flex w-full items-center gap-3 px-3 py-3 text-left"
              >
                <span className="w-10 text-sm font-semibold text-app">
                  {WEEK_DAY_LABELS[dow]}
                </span>
                <span className="min-w-0 flex-1 text-xs text-app-muted">
                  {dayBlocks.length === 0
                    ? "Off"
                    : dayBlocks.map((b) => formatBlockLabel(b)).join(" · ")}
                </span>
                <span className="shrink-0 text-right">
                  <span
                    className={`block text-[11px] tabular-nums ${
                      dayOver ? "font-medium text-app-warning" : "text-app-faint"
                    }`}
                  >
                    {totalDayHours > 0
                      ? `${formatHours(totalDayHours)} · ${totalPct}%`
                      : "—"}
                  </span>
                  {areaDayHours > 0 && areaDayHours !== totalDayHours && (
                    <span className="block text-[10px] tabular-nums text-app-muted">
                      {area.name} {formatHours(areaDayHours)}
                    </span>
                  )}
                </span>
              </button>

              {isOpen && (
                <div className="space-y-3 border-t border-app px-3 py-3">
                  {dayBlocks.map((block) => (
                    <div
                      key={block.id}
                      className="rounded-xl border border-app bg-app-input px-3 py-2.5"
                    >
                      <div className="flex items-end gap-2">
                        <label className="flex-1">
                          <span className="mb-1 block text-[10px] uppercase text-app-faint">
                            Start
                          </span>
                          <select
                            value={block.start}
                            onChange={(e) =>
                              updateBlock(block.id, { start: e.target.value })
                            }
                            className="w-full rounded-lg border border-app bg-app px-2 py-2 text-sm text-app"
                          >
                            {TIME_OPTIONS.map((t) => (
                              <option key={t} value={t}>
                                {formatTimeLabel(t)}
                              </option>
                            ))}
                          </select>
                        </label>
                        <label className="flex-1">
                          <span className="mb-1 block text-[10px] uppercase text-app-faint">
                            Stop
                          </span>
                          <select
                            value={block.end}
                            onChange={(e) =>
                              updateBlock(block.id, { end: e.target.value })
                            }
                            className="w-full rounded-lg border border-app bg-app px-2 py-2 text-sm text-app"
                          >
                            {TIME_OPTIONS.map((t) => (
                              <option key={t} value={t}>
                                {formatTimeLabel(t)}
                              </option>
                            ))}
                          </select>
                        </label>
                        <button
                          type="button"
                          onClick={() => removeBlock(block.id)}
                          className="pb-2 text-xs text-app-warning"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={() => addBlock(dow)}
                    className="w-full rounded-xl border border-dashed border-app-strong py-2.5 text-xs font-medium text-app-accent"
                  >
                    + Add time on {WEEK_DAY_LABELS[dow]}
                  </button>

                  {dayBlocks.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => applyToWeekdays(dow)}
                        className="rounded-full border border-app bg-app px-3 py-1.5 text-[11px] font-medium text-app-secondary"
                      >
                        Apply to weekdays
                      </button>
                      <button
                        type="button"
                        onClick={() => applyToWeekends(dow)}
                        className="rounded-full border border-app bg-app px-3 py-1.5 text-[11px] font-medium text-app-secondary"
                      >
                        Apply to weekends
                      </button>
                      <button
                        type="button"
                        onClick={() => clearDay(dow)}
                        className="rounded-full border border-app bg-app px-3 py-1.5 text-[11px] font-medium text-app-faint"
                      >
                        Clear day
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
