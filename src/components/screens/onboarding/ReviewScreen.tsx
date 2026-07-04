"use client";

import { OnboardingChrome } from "@/components/onboarding/OnboardingChrome";
import {
  DAY_HOURS,
  formatHours,
  hoursToPercent,
  type AreaDef,
} from "@/lib/mock-data";
import type { AreaWeight } from "./WeightageScreen";

type ReviewScreenProps = {
  areas: AreaDef[];
  weights: AreaWeight[];
  protectedIds: string[];
  onToggleProtected: (id: string) => void;
  onEditAreas: () => void;
  onEditWeights: () => void;
  onFinish: () => void;
  onBack: () => void;
};

export function ReviewScreen({
  areas,
  weights,
  protectedIds,
  onToggleProtected,
  onEditAreas,
  onEditWeights,
  onFinish,
  onBack,
}: ReviewScreenProps) {
  const items = weights
    .map((w) => {
      const area = areas.find((a) => a.id === w.id);
      return area ? { ...area, hours: w.hours } : null;
    })
    .filter(Boolean) as (AreaDef & { hours: number })[];

  const maxHours = Math.max(...items.map((i) => i.hours), 1);

  return (
    <OnboardingChrome
      step={4}
      totalSteps={4}
      title="This is your life map"
      subtitle="Protected areas won’t be cut when you’re overloaded."
      onBack={onBack}
      footer={
        <button
          type="button"
          onClick={onFinish}
          className="w-full rounded-2xl bg-gradient-to-r from-violet-500 to-violet-400 py-3.5 text-[15px] font-semibold text-white shadow-lg shadow-violet-500/25 active:scale-[0.98]"
        >
          This is my life
        </button>
      }
    >
      <div className="relative mb-5 flex h-44 items-center justify-center overflow-hidden rounded-3xl border border-app bg-gradient-to-b from-violet-500/10 to-transparent">
        <div className="animate-pulse-soft absolute h-24 w-24 rounded-full bg-violet-500/10 blur-2xl" />
        {items.map((item, index) => {
          const size = 28 + (item.hours / maxHours) * 36;
          const angle = (index / items.length) * Math.PI * 2 - Math.PI / 2;
          const radius = 52;
          const x = Math.cos(angle) * radius;
          const y = Math.sin(angle) * radius;
          return (
            <div
              key={item.id}
              className="absolute flex flex-col items-center"
              style={{
                width: size,
                height: size,
                transform: `translate(${x}px, ${y}px)`,
              }}
            >
              <div
                className="h-full w-full rounded-full shadow-lg"
                style={{
                  backgroundColor: item.color,
                  opacity: 0.85,
                  boxShadow: `0 0 20px ${item.color}55`,
                }}
              />
            </div>
          );
        })}
        <div className="relative z-10 text-center">
          <p className="text-[10px] uppercase tracking-wider text-app-muted">
            Life budget
          </p>
          <p className="text-sm font-semibold text-app">
            {formatHours(items.reduce((s, i) => s + i.hours, 0))} / {DAY_HOURS}h
          </p>
        </div>
      </div>

      <div className="mb-3 flex gap-2">
        <button
          type="button"
          onClick={onEditAreas}
          className="rounded-full border border-app px-3 py-1.5 text-xs text-app-muted"
        >
          Edit areas
        </button>
        <button
          type="button"
          onClick={onEditWeights}
          className="rounded-full border border-app px-3 py-1.5 text-xs text-app-muted"
        >
          Edit time
        </button>
      </div>

      <div className="flex flex-col gap-2">
        {items.map((item) => {
          const isProtected = protectedIds.includes(item.id);
          return (
            <div
              key={item.id}
              className="flex items-center gap-3 rounded-2xl border border-app bg-app-card px-3 py-3"
            >
              <span
                className="h-3 w-3 shrink-0 rounded-full"
                style={{ backgroundColor: item.color }}
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-app">
                  {item.name}
                </p>
                <p className="text-xs text-app-muted">
                  {formatHours(item.hours)} · {hoursToPercent(item.hours)}%
                </p>
              </div>
              <button
                type="button"
                onClick={() => onToggleProtected(item.id)}
                className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium transition ${
                  isProtected
                    ? "bg-app-success text-app-success"
                    : "bg-app-card text-app-faint"
                }`}
              >
                <ShieldIcon filled={isProtected} />
                {isProtected ? "Protected" : "Protect"}
              </button>
            </div>
          );
        })}
      </div>
    </OnboardingChrome>
  );
}

function ShieldIcon({ filled }: { filled: boolean }) {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden
    >
      <path d="M12 3l8 4v5c0 5-3.5 8.5-8 9-4.5-.5-8-4-8-9V7l8-4z" />
    </svg>
  );
}
