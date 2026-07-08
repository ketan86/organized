import type { PlacementResult } from "@/lib/scheduling/placement";
import { formatDateLabel, formatMinutes } from "@/lib/mock-data";

export function PlacementPanel({
  placement,
  explicitBacklog,
  reminderOnly,
  className = "",
}: {
  placement: PlacementResult;
  explicitBacklog: boolean;
  reminderOnly: boolean;
  className?: string;
}) {
  if (reminderOnly) {
    return (
      <p className={`text-xs text-app-muted ${className}`}>
        Reminder only — no schedule or budget impact.
      </p>
    );
  }

  if (explicitBacklog) {
    return (
      <p className={`text-xs text-app-muted ${className}`}>
        Someday — not scheduled on your calendar.
      </p>
    );
  }

  const blocked = placement.status === "unachievable";
  const tone = blocked
    ? "border-app-warning bg-app-warning text-app-warning-soft"
    : placement.status === "shifted"
      ? "border-app bg-app-card text-app-secondary"
      : "border-app bg-app-card text-app-secondary";

  return (
    <div className={`rounded-xl border p-2.5 ${tone} ${className}`}>
      <p className="text-xs leading-relaxed">{placement.explanation}</p>
      {blocked && placement.blockedDays.length > 0 && (
        <ul className="mt-2 space-y-1 text-[11px] opacity-90">
          {placement.blockedDays.slice(0, 4).map((day) => (
            <li key={day.dateKey}>
              {formatDateLabel(day.dateKey)}:{" "}
              {day.outsideWindow
                ? "outside life-area hours"
                : `${formatMinutes(day.loadMinutes)} / ${formatMinutes(day.capacityMinutes)} planned`}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
