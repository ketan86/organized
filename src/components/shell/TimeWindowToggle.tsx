"use client";

import type { TimeWindow } from "@/lib/mock-data";

type TimeWindowToggleProps = {
  value: TimeWindow;
  onChange: (window: TimeWindow) => void;
};

export function TimeWindowToggle({ value, onChange }: TimeWindowToggleProps) {
  return (
    <div className="btn-segment shrink-0">
      {(["today", "week"] as const).map((w) => (
        <button
          key={w}
          type="button"
          onClick={() => onChange(w)}
          className={`btn-segment-item ${
            value === w ? "btn-segment-item-active" : ""
          }`}
        >
          {w === "today" ? "Today" : "Week"}
        </button>
      ))}
    </div>
  );
}
