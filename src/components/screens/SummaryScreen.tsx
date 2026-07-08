"use client";

import { useMemo } from "react";
import {
  addDays,
  isCompletedOnDate,
  parseDateKey,
  todayKey,
  weekRange,
  type AreaDef,
  type Task,
} from "@/lib/mock-data";
import type { SummaryFilters } from "@/components/shell/types";

type SummaryScreenProps = {
  tasks: Task[];
  areas: AreaDef[];
  filters: SummaryFilters;
};

function formatWeekHeading(start: string, end: string): string {
  const s = parseDateKey(start);
  const e = parseDateKey(end);
  const fmt = (d: Date) =>
    d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  return `${fmt(s)} - ${fmt(e)}`;
}

function formatShortDate(key: string): string {
  return parseDateKey(key).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

function getRange(filters: SummaryFilters): { start: string; end: string } {
  const today = todayKey();
  if (filters.dateRange === "last-week") {
    const { start } = weekRange(today);
    const lastStart = addDays(start, -7);
    return weekRange(lastStart);
  }
  if (filters.dateRange === "this-month") {
    const d = parseDateKey(today);
    const start = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
    const endDay = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
    const end = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(endDay).padStart(2, "0")}`;
    return { start, end };
  }
  return weekRange(today);
}

type CompletedItem = {
  task: Task;
  date: string;
  areaName: string;
};

export function SummaryScreen({ tasks, areas, filters }: SummaryScreenProps) {
  const areaMap = useMemo(
    () => new Map(areas.map((a) => [a.id, a.name])),
    [areas],
  );

  const { start, end } = getRange(filters);
  const heading = formatWeekHeading(start, end);

  const completed = useMemo(() => {
    const items: CompletedItem[] = [];

    for (const task of tasks) {
      if (filters.listFilter !== "all" && task.areaId !== filters.listFilter) {
        continue;
      }
      if (filters.statusFilter === "open") continue;

      if (task.status === "done") {
        const date = task.scheduledDate ?? task.dueDate ?? todayKey();
        if (date >= start && date <= end) {
          items.push({
            task,
            date,
            areaName: areaMap.get(task.areaId) ?? "Unknown",
          });
        }
      }

      if (task.completedDates) {
        for (const date of task.completedDates) {
          if (date >= start && date <= end) {
            items.push({
              task,
              date,
              areaName: areaMap.get(task.areaId) ?? "Unknown",
            });
          }
        }
      }
    }

    if (filters.grouping === "area") {
      items.sort((a, b) => a.areaName.localeCompare(b.areaName));
    } else if (filters.grouping === "date") {
      items.sort((a, b) => a.date.localeCompare(b.date));
    }

    return items;
  }, [tasks, filters, start, end, areaMap]);

  return (
    <div className="px-4 py-5 sm:px-6 sm:py-6">
      <h2 className="text-base font-medium text-app">{heading}</h2>

      <h3 className="mt-6 text-sm font-medium text-app-muted">
        Completed
      </h3>

      {completed.length === 0 ? (
        <p className="mt-4 text-sm text-app-muted">
          No completed tasks in this period.
        </p>
      ) : (
        <ul className="mt-3 space-y-2">
          {completed.map(({ task, date, areaName }) => (
            <li
              key={`${task.id}-${date}`}
              className="flex items-start gap-2 text-sm text-app-secondary"
            >
              <span className="text-app-faint">•</span>
              <span>
                <span className="text-app-muted">[{formatShortDate(date)}]</span>{" "}
                {task.title}
                {filters.grouping === "area" && (
                  <span className="ml-1 text-xs text-app-faint">
                    · {areaName}
                  </span>
                )}
              </span>
            </li>
          ))}
        </ul>
      )}

      {filters.showNextPeriod && (
        <>
          <h3 className="mt-8 text-sm font-semibold text-app-secondary">
            Next period
          </h3>
          <ul className="mt-3 space-y-2">
            {tasks
              .filter(
                (t) =>
                  t.status === "open" &&
                  t.scheduledDate &&
                  t.scheduledDate > end,
              )
              .slice(0, 8)
              .map((task) => (
                <li
                  key={task.id}
                  className="flex items-start gap-2 text-sm text-app-muted"
                >
                  <span className="text-app-faint">•</span>
                  <span>{task.title}</span>
                </li>
              ))}
          </ul>
        </>
      )}
    </div>
  );
}

export function summaryWeekLabel(): string {
  const { start, end } = weekRange(todayKey());
  return formatWeekHeading(start, end);
}
