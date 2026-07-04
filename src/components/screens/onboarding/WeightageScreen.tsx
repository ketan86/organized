"use client";

import { useMemo, useState } from "react";
import { OnboardingChrome } from "@/components/onboarding/OnboardingChrome";
import {
  DAY_HOURS,
  formatHours,
  hoursToPercent,
  type AreaDef,
} from "@/lib/mock-data";

export type AreaWeight = {
  id: string;
  hours: number;
};

type WeightageScreenProps = {
  areas: AreaDef[];
  weights: AreaWeight[];
  onChangeHours: (id: string, hours: number) => void;
  onNext: () => void;
  onBack: () => void;
};

export function WeightageScreen({
  areas,
  weights,
  onChangeHours,
  onNext,
  onBack,
}: WeightageScreenProps) {
  const [mode, setMode] = useState<"hours" | "percent">("hours");

  const totalHours = useMemo(
    () => weights.reduce((sum, w) => sum + w.hours, 0),
    [weights],
  );
  const flex = Math.max(0, DAY_HOURS - totalHours);
  const over = Math.max(0, totalHours - DAY_HOURS);

  function step(id: string, current: number, delta: number) {
    const next = Math.max(0, Math.min(24, Math.round((current + delta) * 2) / 2));
    onChangeHours(id, next);
  }

  return (
    <OnboardingChrome
      step={3}
      totalSteps={4}
      title="How much time for each area?"
      subtitle="How much of your day does each part of life get?"
      onBack={onBack}
      footer={
        <button
          type="button"
          onClick={onNext}
          className="w-full rounded-2xl bg-gradient-to-r from-violet-500 to-violet-400 py-3.5 text-[15px] font-semibold text-white shadow-lg shadow-violet-500/25 active:scale-[0.98]"
        >
          Continue
        </button>
      }
    >
      <div className="mb-4 rounded-2xl border border-app bg-app-card p-3">
        <div className="mb-2 flex items-center justify-between text-xs">
          <span className="text-app-muted">Your day</span>
          <span className={over > 0 ? "text-app-warning" : "text-app-secondary"}>
            {formatHours(totalHours)} / {DAY_HOURS}h
            {flex > 0 && (
              <span className="text-app-muted"> · {formatHours(flex)} flex</span>
            )}
            {over > 0 && (
              <span className="text-app-warning"> · over by {formatHours(over)}</span>
            )}
          </span>
        </div>
        <div className="flex h-3 overflow-hidden rounded-full bg-app-track">
          {weights.map((w) => {
            const area = areas.find((a) => a.id === w.id);
            if (!area || w.hours <= 0) return null;
            const width = (w.hours / DAY_HOURS) * 100;
            return (
              <div
                key={w.id}
                title={`${area.name}: ${formatHours(w.hours)}`}
                style={{
                  width: `${width}%`,
                  backgroundColor: area.color,
                }}
                className="h-full min-w-[2px]"
              />
            );
          })}
          {flex > 0 && (
            <div
              style={{ width: `${(flex / DAY_HOURS) * 100}%` }}
              className="h-full bg-app-chip"
              title={`Flex: ${formatHours(flex)}`}
            />
          )}
        </div>
        {over > 0 && (
          <p className="mt-2 text-[11px] leading-relaxed text-app-warning-soft">
            Over by {formatHours(over)} — that’s ok for now. We’ll calibrate later.
          </p>
        )}
      </div>

      <div className="mb-4 flex rounded-xl border border-app bg-app-card p-1">
        {(["hours", "percent"] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMode(m)}
            className={`flex-1 rounded-lg py-2 text-xs font-medium capitalize transition ${
              mode === m
                ? "bg-app-chip text-app"
                : "text-app-muted"
            }`}
          >
            {m === "hours" ? "Hours / day" : "% of life"}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-3 pb-2">
        {weights.map((w) => {
          const area = areas.find((a) => a.id === w.id);
          if (!area) return null;
          const display =
            mode === "hours"
              ? formatHours(w.hours)
              : `${hoursToPercent(w.hours)}%`;

          return (
            <div
              key={w.id}
              className="flex items-center gap-3 rounded-2xl border border-app bg-app-card px-3 py-3"
            >
              <span
                className="h-3 w-3 shrink-0 rounded-full"
                style={{ backgroundColor: area.color }}
              />
              <span className="min-w-0 flex-1 truncate text-sm font-medium text-app">
                {area.name}
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => step(w.id, w.hours, -0.5)}
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-app bg-app-card text-lg text-app-secondary"
                  aria-label={`Decrease ${area.name}`}
                >
                  −
                </button>
                <span className="w-12 text-center text-sm font-semibold tabular-nums text-app">
                  {display}
                </span>
                <button
                  type="button"
                  onClick={() => step(w.id, w.hours, 0.5)}
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-app bg-app-card text-lg text-app-secondary"
                  aria-label={`Increase ${area.name}`}
                >
                  +
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </OnboardingChrome>
  );
}
