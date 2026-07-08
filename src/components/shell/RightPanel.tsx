"use client";

import { useEffect, useState, type ReactNode } from "react";
import {
  RECURRENCE_OPTIONS,
  dueLabel,
  scheduleOptions,
  todayKey,
  type AreaDef,
  type Recurrence,
  type Reminder,
  type Task,
  type UsualWeekBlock,
} from "@/lib/mock-data";
import { ReminderPicker } from "@/components/ui/ReminderPicker";
import {
  CaptureSheet,
  type CaptureConfirm,
} from "@/components/screens/CaptureSheet";
import {
  ManualTaskSheet,
  type ManualTaskInput,
} from "@/components/screens/ManualTaskSheet";
import { PanelHeader } from "@/components/ui/Panel";
import type { RightPanelMode } from "./types";

type RightPanelProps = {
  mode: RightPanelMode;
  selectedTask: Task | null;
  selectedArea: AreaDef | null;
  onSchedule: (taskId: string, scheduledDate: string | null) => void;
  onRecurrence: (taskId: string, recurrence: Recurrence) => void;
  onReminder: (taskId: string, reminder: Reminder) => void;
  onMarkDone: (taskId: string) => void;
  onDelete: (taskId: string) => void;
  areas: AreaDef[];
  usualWeek: UsualWeekBlock[];
  tasks: Task[];
  protectedIds: string[];
  defaultAreaId?: string | null;
  onClose: () => void;
  onConfirmCapture: (payload: CaptureConfirm) => void;
  onSaveManual: (input: ManualTaskInput) => void;
  onSwitchAddMode: (mode: "ai" | "manual") => void;
  embedded?: boolean;
};

function TaskSelect({
  value,
  options,
  onChange,
}: {
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full cursor-pointer appearance-none bg-transparent py-0.5 pr-7 text-base font-medium text-app outline-none transition hover:text-accent-text focus:text-accent-text"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      <span
        aria-hidden
        className="pointer-events-none absolute right-0 top-1/2 -translate-y-1/2 text-sm text-app-muted"
      >
        ▾
      </span>
    </div>
  );
}

function TaskField({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs text-app-muted">{label}</span>
      {children}
    </label>
  );
}

function TaskSettings({
  task,
  area,
  onSchedule,
  onRecurrence,
  onReminder,
  onMarkDone,
  onDelete,
}: {
  task: Task;
  area: AreaDef;
  onSchedule: (taskId: string, scheduledDate: string | null) => void;
  onRecurrence: (taskId: string, recurrence: Recurrence) => void;
  onReminder: (taskId: string, reminder: Reminder) => void;
  onMarkDone: (taskId: string) => void;
  onDelete: (taskId: string) => void;
}) {
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    setConfirmDelete(false);
  }, [task.id]);

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h3 className="text-xl font-semibold tracking-tight text-app">
          {task.title}
        </h3>
        <p className="mt-1.5 text-sm text-app-muted">{area.name}</p>
      </div>

      <div className="flex flex-col gap-5">
        <TaskField label="Schedule">
          <TaskSelect
            value={task.scheduledDate ?? ""}
            onChange={(v) => onSchedule(task.id, v || null)}
            options={scheduleOptions().map((o) => ({
              value: o.key ?? "",
              label: o.label,
            }))}
          />
        </TaskField>
        <TaskField label="Repeat">
          <TaskSelect
            value={task.recurrence}
            onChange={(v) => onRecurrence(task.id, v as Recurrence)}
            options={RECURRENCE_OPTIONS.map((o) => ({
              value: o.id,
              label: o.label,
            }))}
          />
        </TaskField>
        <TaskField label="Reminder">
        <ReminderPicker
          variant="panel"
          value={task.reminder}
          recurring={(task.recurrence ?? "none") !== "none"}
          defaultDateKey={task.scheduledDate ?? task.dueDate ?? todayKey()}
            onChange={(r) => onReminder(task.id, r)}
          />
        </TaskField>
        {dueLabel(task) && (
          <TaskField label="Due">
            <span className="text-base font-medium text-app">{dueLabel(task)}</span>
          </TaskField>
        )}
      </div>

      <div className="flex flex-col gap-3">
        {task.status !== "done" && (
          <button
            type="button"
            onClick={() => onMarkDone(task.id)}
            className="btn-primary btn-lg w-full"
          >
            Mark done
          </button>
        )}
        {!confirmDelete ? (
          <button
            type="button"
            onClick={() => setConfirmDelete(true)}
            className="py-2 text-sm font-medium text-app-warning transition hover:text-app-warning/80"
          >
            Delete
          </button>
        ) : (
          <div className="rounded-xl border border-app-warning bg-app-warning px-3 py-3">
            <p className="text-sm text-app-warning-soft">
              Delete this task permanently?
            </p>
            <div className="mt-3 flex gap-2">
              <button
                type="button"
                onClick={() => setConfirmDelete(false)}
                className="flex-1 rounded-xl border border-app py-2.5 text-sm font-medium text-app-secondary"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => onDelete(task.id)}
                className="flex-1 rounded-xl bg-red-500/90 py-2.5 text-sm font-semibold text-white"
              >
                Delete
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function panelTitle(mode: RightPanelMode): { title: string; subtitle?: string } {
  switch (mode.kind) {
    case "task":
      return { title: "Edit task" };
    case "add":
      return mode.mode === "ai"
        ? { title: "Capture", subtitle: "Quickly add tasks with AI" }
        : { title: "Create task", subtitle: "Add your task details" };
    default:
      return { title: "" };
  }
}

export function RightPanel({
  mode,
  selectedTask,
  selectedArea,
  onSchedule,
  onRecurrence,
  onReminder,
  onMarkDone,
  onDelete,
  areas,
  usualWeek,
  tasks,
  protectedIds,
  defaultAreaId,
  onClose,
  onConfirmCapture,
  onSaveManual,
  onSwitchAddMode,
  embedded,
}: RightPanelProps) {
  useEffect(() => {
    if (mode.kind === "closed") return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    globalThis.addEventListener("keydown", onKeyDown);
    return () => globalThis.removeEventListener("keydown", onKeyDown);
  }, [mode, onClose]);

  if (mode.kind === "closed") return null;

  const { title, subtitle } = panelTitle(mode);
  const isTaskPanel = mode.kind === "task";

  const body = (() => {
    if (mode.kind === "task" && selectedTask && selectedArea) {
      return (
        <TaskSettings
          task={selectedTask}
          area={selectedArea}
          onSchedule={onSchedule}
          onRecurrence={onRecurrence}
          onReminder={onReminder}
          onMarkDone={onMarkDone}
          onDelete={onDelete}
        />
      );
    }
    if (mode.kind === "add" && mode.mode === "ai") {
      return (
        <CaptureSheet
          embedded
          areas={areas}
          usualWeek={usualWeek}
          tasks={tasks}
          protectedIds={protectedIds}
          onClose={onClose}
          onConfirm={onConfirmCapture}
          onOpenManual={() => onSwitchAddMode("manual")}
        />
      );
    }
    if (mode.kind === "add" && mode.mode === "manual") {
      return (
        <ManualTaskSheet
          embedded
          areas={areas}
          usualWeek={usualWeek}
          tasks={tasks}
          protectedIds={protectedIds}
          defaultAreaId={defaultAreaId}
          onClose={onClose}
          onSave={onSaveManual}
          onOpenCapture={() => onSwitchAddMode("ai")}
        />
      );
    }
    return null;
  })();

  if (embedded) {
    return (
      <div className="flex w-full flex-col">
        <PanelHeader
          title={title}
          subtitle={subtitle}
          onClose={onClose}
          divider={!isTaskPanel}
        />
        {mode.kind === "add" ? (
          body
        ) : (
          <div className="px-5 pb-8 pt-2">{body}</div>
        )}
      </div>
    );
  }

  return (
    <aside className="panel-shell hidden h-full min-h-0 w-[var(--shell-panel)] shrink-0 flex-col overflow-hidden bg-app-elevated lg:flex">
      <PanelHeader
        title={title}
        subtitle={subtitle}
        onClose={onClose}
        divider={!isTaskPanel}
      />
      {mode.kind === "add" ? (
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">{body}</div>
      ) : (
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-8 pt-2">
          {body}
        </div>
      )}
    </aside>
  );
}
