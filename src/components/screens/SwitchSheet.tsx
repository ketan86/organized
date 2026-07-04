"use client";

import type { AreaDef } from "@/lib/mock-data";

type SwitchSheetProps = {
  fromName: string;
  areas: AreaDef[];
  currentAreaId: string;
  onSwitch: (areaId: string) => void;
  onDismiss: () => void;
};

export function SwitchSheet({
  fromName,
  areas,
  currentAreaId,
  onSwitch,
  onDismiss,
}: SwitchSheetProps) {
  const options = areas.filter((a) => a.id !== currentAreaId);

  return (
    <div className="flex h-full w-full flex-col justify-end bg-app-overlay backdrop-blur-[2px]">
      <button
        type="button"
        className="min-h-0 flex-1 cursor-default"
        aria-label="Dismiss"
        onClick={onDismiss}
      />
      <div className="relative z-10 max-h-[85%] overflow-y-auto rounded-t-3xl border border-app bg-app-elevated px-5 pb-8 pt-4">
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-app-chip" />

        <p className="text-[11px] font-medium uppercase tracking-wider text-app-accent-soft">
          Quick switch
        </p>
        <h2 className="mt-1 text-xl font-semibold text-app">
          Pause {fromName}, do something else
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-app-muted">
          Stops {fromName} and starts the next one. Come back to {fromName}{" "}
          anytime — this is a switch, not “done for the day.”
        </p>

        <div className="mt-5 flex flex-col gap-2">
          {options.map((area) => (
            <button
              key={area.id}
              type="button"
              onClick={() => onSwitch(area.id)}
              className="flex items-center gap-3 rounded-2xl border border-app bg-app-card px-4 py-3.5 text-left transition active:scale-[0.99]"
            >
              <span
                className="h-3 w-3 shrink-0 rounded-full"
                style={{ backgroundColor: area.color }}
              />
              <span className="flex-1 text-sm font-semibold text-app">
                Switch to {area.name}
              </span>
              <span className="text-sm font-medium text-app-accent">Go</span>
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={onDismiss}
          className="mt-4 w-full rounded-2xl border border-app py-3.5 text-sm font-medium text-app-secondary"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
