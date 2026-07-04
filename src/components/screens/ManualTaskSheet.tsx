"use client";

import { useState } from "react";
import {
  formatMinutes,
  RECURRENCE_OPTIONS,
  REMINDER_OPTIONS,
  scheduleOptions,
  todayKey,
  type AreaDef,
  type Recurrence,
  type Reminder,
} from "@/lib/mock-data";

export type ManualTaskInput = {
  title: string;
  areaId: string;
  estimateMinutes: number;
  scheduledDate: string | null;
  recurrence: Recurrence;
  reminder: Reminder;
  notes: string;
};

type ManualTaskSheetProps = {
  areas: AreaDef[];
  defaultAreaId?: string | null;
  onClose: () => void;
  onSave: (input: ManualTaskInput) => void;
};

const ESTIMATE_PRESETS = [15, 30, 45, 60, 90, 120, 180];

export function ManualTaskSheet({
  areas,
  defaultAreaId,
  onClose,
  onSave,
}: ManualTaskSheetProps) {
  const [title, setTitle] = useState("");
  const [areaId, setAreaId] = useState(
    defaultAreaId && areas.some((a) => a.id === defaultAreaId)
      ? defaultAreaId
      : (areas[0]?.id ?? ""),
  );
  const [estimateMinutes, setEstimateMinutes] = useState(30);
  const [scheduledDate, setScheduledDate] = useState<string | null>(todayKey());
  const [recurrence, setRecurrence] = useState<Recurrence>("none");
  const [reminder, setReminder] = useState<Reminder>("none");
  const [notes, setNotes] = useState("");

  const canSave = title.trim().length > 0 && areaId;

  function handleSave() {
    if (!canSave) return;
    onSave({
      title: title.trim(),
      areaId,
      estimateMinutes,
      scheduledDate: recurrence === "none" ? scheduledDate : scheduledDate ?? todayKey(),
      recurrence,
      reminder,
      notes: notes.trim(),
    });
  }

  return (
    <div className="flex h-full w-full flex-col justify-end bg-app-overlay backdrop-blur-[2px]">
      <button
        type="button"
        className="min-h-0 flex-1 cursor-default"
        aria-label="Close"
        onClick={onClose}
      />
      <div className="relative z-10 flex max-h-[90%] flex-col rounded-t-3xl border border-app bg-app-elevated">
        <div className="px-5 pt-4">
          <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-app-chip" />
          <h2 className="text-xl font-semibold text-app">Create manually</h2>
          <p className="mt-1 text-sm text-app-muted">
            You set every field. No AI.
          </p>
        </div>

        <div className="mt-4 flex-1 space-y-4 overflow-y-auto px-5 pb-4">
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-app-muted">
              What needs doing?
            </span>
            <input
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Call the dentist"
              className="w-full rounded-2xl border border-app bg-app-input px-4 py-3.5 text-[15px] text-app outline-none placeholder-app focus:border-violet-400/50"
            />
          </label>

          <div>
            <p className="mb-1.5 text-xs font-medium text-app-muted">Life part</p>
            <div className="flex flex-wrap gap-2">
              {areas.map((area) => {
                const active = area.id === areaId;
                return (
                  <button
                    key={area.id}
                    type="button"
                    onClick={() => setAreaId(area.id)}
                    className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition ${
                      active
                        ? "bg-violet-500 text-white"
                        : "border border-app bg-app-card text-app-secondary"
                    }`}
                  >
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: area.color }}
                    />
                    {area.name}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <p className="mb-1.5 text-xs font-medium text-app-muted">
              How long? · {formatMinutes(estimateMinutes)}
            </p>
            <div className="flex flex-wrap gap-2">
              {ESTIMATE_PRESETS.map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setEstimateMinutes(m)}
                  className={`rounded-full px-3 py-1.5 text-xs font-medium ${
                    estimateMinutes === m
                      ? "bg-violet-500 text-white"
                      : "border border-app bg-app-card text-app-secondary"
                  }`}
                >
                  {formatMinutes(m)}
                </button>
              ))}
            </div>
          </div>

          {recurrence === "none" && (
            <div>
              <p className="mb-1.5 text-xs font-medium text-app-muted">
                When (schedule)
              </p>
              <div className="flex flex-wrap gap-2">
                {scheduleOptions().map((opt) => {
                  const active =
                    opt.key === null
                      ? scheduledDate === null
                      : scheduledDate === opt.key;
                  return (
                    <button
                      key={opt.label}
                      type="button"
                      onClick={() => setScheduledDate(opt.key)}
                      className={`rounded-full px-3 py-1.5 text-xs font-medium ${
                        active
                          ? "bg-violet-500 text-white"
                          : "border border-app bg-app-card text-app-secondary"
                      }`}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div>
            <p className="mb-1.5 text-xs font-medium text-app-muted">Repeat</p>
            <div className="flex flex-wrap gap-2">
              {RECURRENCE_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setRecurrence(opt.id)}
                  className={`rounded-full px-3 py-1.5 text-xs font-medium ${
                    recurrence === opt.id
                      ? "bg-violet-500 text-white"
                      : "border border-app bg-app-card text-app-secondary"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-1.5 text-xs font-medium text-app-muted">Reminder</p>
            <div className="flex flex-wrap gap-2">
              {REMINDER_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setReminder(opt.id)}
                  className={`rounded-full px-3 py-1.5 text-xs font-medium ${
                    reminder === opt.id
                      ? "bg-violet-500 text-white"
                      : "border border-app bg-app-card text-app-secondary"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-app-muted">
              Notes (optional)
            </span>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Anything else to remember"
              className="w-full resize-none rounded-2xl border border-app bg-app-input px-4 py-3 text-[15px] text-app outline-none placeholder-app focus:border-violet-400/50"
            />
          </label>
        </div>

        <div className="flex gap-3 border-t border-app px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-2xl border border-app py-3.5 text-sm font-medium text-app-secondary"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!canSave}
            onClick={handleSave}
            className="flex-[1.4] rounded-2xl bg-gradient-to-r from-violet-500 to-violet-400 py-3.5 text-sm font-semibold text-white disabled:opacity-40"
          >
            Add task
          </button>
        </div>
      </div>
    </div>
  );
}
