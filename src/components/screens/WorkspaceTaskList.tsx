"use client";

import { useMemo } from "react";
import {
  dueLabel,
  formatDateLabel,
  scheduleLabel,
  todayKey,
  type AreaDef,
  type Task,
} from "@/lib/mock-data";
import type { WorkspaceView } from "@/components/shell/types";

type WorkspaceTaskListProps = {
  view: WorkspaceView;
  tasks: Task[];
  areas: AreaDef[];
  selectedTaskId: string | null;
  onSelectTask: (taskId: string | null) => void;
};

function filterTasks(
  view: WorkspaceView,
  tasks: Task[],
): Task[] {
  const today = todayKey();

  if (typeof view === "object") {
    return tasks.filter((t) => t.areaId === view.id && t.status !== "done");
  }

  switch (view) {
    case "all":
      return tasks.filter((t) => t.status !== "done");
    case "today":
      return tasks.filter(
        (t) =>
          t.status !== "done" &&
          (t.scheduledDate === today ||
            t.dueDate === today ||
            (!t.scheduledDate && !t.dueDate)),
      );
    case "completed":
      return tasks.filter((t) => t.status === "done");
    case "trash":
      return [];
    default:
      return tasks.filter((t) => t.status !== "done");
  }
}

export function WorkspaceTaskList({
  view,
  tasks,
  areas,
  selectedTaskId,
  onSelectTask,
}: WorkspaceTaskListProps) {
  const areaMap = useMemo(
    () => new Map(areas.map((a) => [a.id, a])),
    [areas],
  );

  const filtered = useMemo(
    () => filterTasks(view, tasks),
    [view, tasks],
  );

  if (filtered.length === 0) {
    const emptyMessage =
      view === "trash"
        ? "Trash is empty. Open a task and use Delete in the editor — tasks are removed immediately."
        : "No tasks here yet.";
    return (
      <div className="flex h-full min-h-[200px] items-center justify-center px-6 text-center text-sm text-app-muted">
        {emptyMessage}
      </div>
    );
  }

  return (
    <ul className="divide-y divide-[var(--border)]">
      {filtered.map((task) => {
        const area = areaMap.get(task.areaId);
        const due = dueLabel(task);
        const selected = selectedTaskId === task.id;
        return (
          <li key={task.id}>
            <button
              type="button"
              onClick={() => onSelectTask(selected ? null : task.id)}
              className={`flex w-full items-start gap-3 px-6 py-3.5 text-left transition ${
                selected ? "bg-app-card" : "hover:bg-app-card/60"
              }`}
            >
              <span
                className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: area?.color ?? "#8b7cf6" }}
              />
              <div className="min-w-0 flex-1">
                <p
                  className={`text-sm font-medium ${
                    task.status === "done"
                      ? "text-app-muted line-through"
                      : "text-app"
                  }`}
                >
                  {task.title}
                </p>
                <p className="mt-0.5 text-xs text-app-muted">
                  {area?.name}
                  {task.scheduledDate &&
                    ` · ${formatDateLabel(task.scheduledDate)}`}
                  {!task.scheduledDate &&
                    task.status !== "done" &&
                    ` · ${scheduleLabel(task)}`}
                  {due && ` · Due ${due}`}
                </p>
              </div>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
