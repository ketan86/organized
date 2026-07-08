"use client";

import {
  listAllReminderEntries,
  splitReminderEntries,
  type ReminderEntry,
} from "@/lib/notifications/reminder-entries";
import type { AreaDef, Task, UsualWeekBlock } from "@/lib/mock-data";

type RemindersScreenProps = {
  tasks: Task[];
  areas: AreaDef[];
  usualWeek: UsualWeekBlock[];
  onOpenTask: (taskId: string, dateKey: string) => void;
  onOpenArea: (areaId: string) => void;
  embedded?: boolean;
};

function ReminderRow({
  entry,
  onOpen,
}: {
  entry: ReminderEntry;
  onOpen: () => void;
}) {
  return (
    <li>
      <button
        type="button"
        onClick={onOpen}
        className="flex w-full items-center gap-3 py-3 text-left transition hover:bg-app-card/50"
      >
        <span
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-app-card text-sm"
          aria-hidden
        >
          {entry.kind === "area-boundary" ? "⏱" : "🔔"}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-app">{entry.taskTitle}</p>
          <p className="mt-0.5 flex min-w-0 items-center gap-1.5 truncate text-xs text-app-muted">
            <span
              className="h-2 w-2 shrink-0 rounded-full"
              style={{ backgroundColor: entry.areaColor }}
            />
            <span className="truncate">
              {entry.kind === "area-boundary"
                ? entry.whenLabel
                : `${entry.areaName} · ${entry.whenLabel}`}
            </span>
          </p>
        </div>
        <span className="shrink-0 text-xs text-app-faint">{entry.reminderText}</span>
      </button>
    </li>
  );
}

export function RemindersScreen({
  tasks,
  areas,
  usualWeek,
  onOpenTask,
  onOpenArea,
  embedded = false,
}: RemindersScreenProps) {
  const now = new Date();
  const entries = listAllReminderEntries(tasks, areas, usualWeek, now, {
    includeAreaBoundaries: true,
  });
  const { upcoming, past } = splitReminderEntries(entries, now);

  return (
    <div className={`panel-page flex flex-col gap-5 ${embedded ? "" : "pt-14"}`}>
      {!embedded && (
        <div>
          <h1 className="text-lg font-semibold text-app">Reminders</h1>
          <p className="mt-1 text-xs text-app-muted">
            Task reminders and life area start/stop alerts
          </p>
        </div>
      )}

      {embedded && (
        <p className="text-xs text-app-muted">
          Tap a task reminder to open it, or a boundary to edit that life area
        </p>
      )}

      {entries.length === 0 ? (
        <p className="py-12 text-center text-sm text-app-muted">
          No reminders yet. Add task reminders or set life area hours in your usual week.
        </p>
      ) : (
        <>
          {upcoming.length > 0 && (
            <section>
              <h2 className="mb-1 text-xs font-medium uppercase tracking-wide text-app-muted">
                Upcoming · {upcoming.length}
              </h2>
              <ul>
                {upcoming.map((entry) => (
                  <ReminderRow
                    key={entry.id}
                    entry={entry}
                    onOpen={() =>
                      entry.kind === "area-boundary"
                        ? onOpenArea(entry.areaId)
                        : onOpenTask(entry.taskId, entry.dateKey)
                    }
                  />
                ))}
              </ul>
            </section>
          )}

          {past.length > 0 && (
            <section>
              <h2 className="mb-1 text-xs font-medium uppercase tracking-wide text-app-muted">
                Earlier · {past.length}
              </h2>
              <ul className="opacity-80">
                {past.map((entry) => (
                  <ReminderRow
                    key={entry.id}
                    entry={entry}
                    onOpen={() =>
                      entry.kind === "area-boundary"
                        ? onOpenArea(entry.areaId)
                        : onOpenTask(entry.taskId, entry.dateKey)
                    }
                  />
                ))}
              </ul>
            </section>
          )}
        </>
      )}
    </div>
  );
}
