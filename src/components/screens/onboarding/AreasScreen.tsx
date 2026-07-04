"use client";

import { useState } from "react";
import { OnboardingChrome } from "@/components/onboarding/OnboardingChrome";
import {
  CUSTOM_AREA_COLORS,
  type AreaDef,
} from "@/lib/mock-data";

type AreasScreenProps = {
  areas: AreaDef[];
  selectedIds: string[];
  onToggle: (id: string) => void;
  onAddCustom: (area: AreaDef) => void;
  onNext: () => void;
  onBack: () => void;
};

export function AreasScreen({
  areas,
  selectedIds,
  onToggle,
  onAddCustom,
  onNext,
  onBack,
}: AreasScreenProps) {
  const [showAdd, setShowAdd] = useState(false);
  const [customName, setCustomName] = useState("");

  const canContinue = selectedIds.length >= 3;

  function handleAdd() {
    const name = customName.trim();
    if (!name) return;
    const color =
      CUSTOM_AREA_COLORS[
        areas.filter((a) => a.isCustom).length % CUSTOM_AREA_COLORS.length
      ];
    onAddCustom({
      id: `custom-${Date.now()}`,
      name,
      color,
      defaultHours: 1,
      defaultSelected: true,
      defaultProtected: false,
      blocks: [],
      daysPattern: "everyday",
      isCustom: true,
    });
    setCustomName("");
    setShowAdd(false);
  }

  return (
    <OnboardingChrome
      step={2}
      totalSteps={4}
      title="What areas make up your life?"
      subtitle="Start with these, or add your own. You’ll give each a weight next."
      onBack={onBack}
      footer={
        <div className="flex flex-col gap-2">
          {!canContinue && (
            <p className="text-center text-xs text-app-warning">
              Pick at least 3 areas
            </p>
          )}
          <button
            type="button"
            disabled={!canContinue}
            onClick={onNext}
            className="w-full rounded-2xl bg-gradient-to-r from-violet-500 to-violet-400 py-3.5 text-[15px] font-semibold text-white shadow-lg shadow-violet-500/25 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
          >
            Continue · {selectedIds.length} selected
          </button>
        </div>
      }
    >
      <div className="flex flex-wrap gap-2">
        {areas.map((area) => {
          const active = selectedIds.includes(area.id);
          return (
            <button
              key={area.id}
              type="button"
              onClick={() => onToggle(area.id)}
              className={`flex items-center gap-2 rounded-full border px-3.5 py-2.5 text-sm font-medium transition active:scale-[0.98] ${
                active
                  ? "border-app-strong bg-app-chip text-app"
                  : "border-app bg-app-card text-app-muted"
              }`}
            >
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{
                  backgroundColor: active ? area.color : "var(--fg-faint)",
                }}
              />
              {area.name}
              {area.isCustom && (
                <span className="text-[10px] uppercase tracking-wide text-app-faint">
                  custom
                </span>
              )}
            </button>
          );
        })}

        <button
          type="button"
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-1.5 rounded-full border border-dashed border-app-strong px-3.5 py-2.5 text-sm font-medium text-app-accent"
        >
          <span className="text-base leading-none">+</span>
          Add your own
        </button>
      </div>

      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-app-overlay sm:absolute sm:rounded-[2.5rem]">
          <div className="w-full max-w-[390px] rounded-t-3xl border border-app bg-app-elevated p-6 pb-10">
            <h3 className="text-lg font-semibold text-app">New life area</h3>
            <p className="mt-1 text-sm text-app-muted">
              e.g. Faith, Side project, Dog
            </p>
            <input
              autoFocus
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAdd()}
              placeholder="Area name"
              className="mt-4 w-full rounded-2xl border border-app bg-app-input px-4 py-3.5 text-[15px] text-app outline-none placeholder-app focus:border-app-accent"
            />
            <div className="mt-4 flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowAdd(false);
                  setCustomName("");
                }}
                className="flex-1 rounded-2xl border border-app py-3 text-sm font-medium text-app-secondary"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAdd}
                disabled={!customName.trim()}
                className="flex-1 rounded-2xl bg-violet-500 py-3 text-sm font-semibold text-white disabled:opacity-40"
              >
                Add
              </button>
            </div>
          </div>
        </div>
      )}
    </OnboardingChrome>
  );
}
