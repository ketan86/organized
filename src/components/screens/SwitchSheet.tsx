"use client";

import type { AreaDef } from "@/lib/mock-data";
import { Sheet, SheetBody, SheetHeader } from "@/components/ui/Sheet";

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
    <Sheet onClose={onDismiss}>
      <SheetHeader
        eyebrow="Quick switch"
        title={`Pause ${fromName}, do something else`}
        subtitle={`Stops ${fromName} and starts the next one. Come back to ${fromName} anytime — this is a switch, not “done for the day.”`}
      />

      <SheetBody className="space-y-2 pt-2">
        {options.map((area) => (
          <button
            key={area.id}
            type="button"
            onClick={() => onSwitch(area.id)}
            className="card-app flex w-full items-center gap-3 px-4 py-3.5 text-left transition active:scale-[0.99]"
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

        <button
          type="button"
          onClick={onDismiss}
          className="btn-secondary btn-lg mt-2 w-full"
        >
          Cancel
        </button>
      </SheetBody>
    </Sheet>
  );
}
