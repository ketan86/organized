"use client";

import { useMemo, useState } from "react";
import {
  absoluteToRelativeReminder,
  formatMinutes,
  formatDateLabel,
  isAbsoluteReminder,
  isRelativeClockReminder,
  parseAbsoluteReminder,
  relativeToAbsoluteReminder,
  RECURRENCE_OPTIONS,
  resolvePreferredTime,
  todayKey,
  type AreaDef,
  type Recurrence,
  type Reminder,
  type Task,
  type UsualWeekBlock,
} from "@/lib/mock-data";
import {
  canConfirmPlacement,
  placeTask,
  scheduledDateFromPlacement,
  scheduledTimeFromPlacement,
} from "@/lib/scheduling/placement";
import {
  formatAreaWindowsOnDate,
  formatTimeForDisplay,
} from "@/lib/scheduling/block-time";
import {
  checkProtectedAreaFit,
  type ProtectedAreaCheck,
} from "@/lib/scheduling/protected-area";
import { PlacementPanel } from "@/components/scheduling/PlacementPanel";
import {
  ProtectedAreaPrompt,
  resolveProtectedAreaOption,
} from "@/components/scheduling/ProtectedAreaPrompt";
import { ReminderPicker } from "@/components/ui/ReminderPicker";
import { PanelBody, PanelFooter } from "@/components/ui/Panel";
import { Sheet, SheetBody, SheetFooter, SheetHeader } from "@/components/ui/Sheet";

export type ManualTaskInput = {
  title: string;
  areaId: string;
  estimateMinutes: number;
  scheduledDate: string | null;
  scheduledTime: string | null;
  recurrence: Recurrence;
  reminder: Reminder;
  notes: string;
};

type ManualTaskSheetProps = {
  areas: AreaDef[];
  usualWeek: UsualWeekBlock[];
  tasks: Task[];
  protectedIds: string[];
  defaultAreaId?: string | null;
  embedded?: boolean;
  onClose: () => void;
  onSave: (input: ManualTaskInput) => void;
  onOpenCapture?: () => void;
};

const ESTIMATE_PRESETS = [15, 30, 45, 60, 90, 120, 180];

export function ManualTaskSheet({
  areas,
  usualWeek,
  tasks,
  protectedIds,
  defaultAreaId,
  embedded = false,
  onClose,
  onSave,
  onOpenCapture,
}: ManualTaskSheetProps) {
  const [title, setTitle] = useState("");
  const [areaId, setAreaId] = useState(
    defaultAreaId && areas.some((a) => a.id === defaultAreaId)
      ? defaultAreaId
      : (areas[0]?.id ?? ""),
  );
  const [estimateMinutes, setEstimateMinutes] = useState(30);
  const [explicitBacklog, setExplicitBacklog] = useState(false);
  const [pinnedDateOverride, setPinnedDateOverride] = useState<string | null>(
    null,
  );
  const [recurrence, setRecurrence] = useState<Recurrence>("none");
  const [reminder, setReminder] = useState<Reminder>("none");
  const [notes, setNotes] = useState("");
  const [areaMismatch, setAreaMismatch] =
    useState<Extract<ProtectedAreaCheck, { ok: false }> | null>(null);
  const [areaMismatchResolved, setAreaMismatchResolved] = useState(false);

  const area = areas.find((a) => a.id === areaId);
  const absoluteReminder = parseAbsoluteReminder(reminder);

  const preferredTime = useMemo(
    () =>
      resolvePreferredTime({
        title: title.trim(),
        reminder,
        recurrence,
        scheduledDate:
          pinnedDateOverride ?? absoluteReminder?.dateKey ?? null,
      }),
    [title, reminder, recurrence, pinnedDateOverride, absoluteReminder?.dateKey],
  );

  const placement = useMemo(() => {
    if (!area) return null;
    const pinned =
      pinnedDateOverride ?? absoluteReminder?.dateKey ?? null;
    return placeTask({
      usualWeek,
      tasks,
      areaId,
      areaName: area.name,
      estimateMinutes,
      dueDate: null,
      mode:
        recurrence !== "none"
          ? "auto"
          : explicitBacklog
            ? "backlog"
            : pinned
              ? "pinned"
              : "auto",
      pinnedDate: recurrence !== "none" ? null : pinned,
      preferredTime,
      reminderDateKey: absoluteReminder?.dateKey ?? null,
    });
  }, [
    area,
    areaId,
    estimateMinutes,
    explicitBacklog,
    pinnedDateOverride,
    absoluteReminder?.dateKey,
    recurrence,
    preferredTime,
    usualWeek,
    tasks,
  ]);

  const scheduleMode =
    recurrence !== "none"
      ? "recurring"
      : explicitBacklog
        ? "someday"
        : pinnedDateOverride !== null
          ? "pick"
          : "suggestion";

  const resolvedScheduledDate =
    recurrence !== "none"
      ? (placement ? scheduledDateFromPlacement(placement) : null) ?? todayKey()
      : explicitBacklog
        ? null
        : placement
          ? scheduledDateFromPlacement(placement)
          : null;

  function syncAreaGuard(nextTitle: string, nextAreaId: string) {
    const check = checkProtectedAreaFit(
      nextAreaId,
      nextTitle,
      areas,
      protectedIds,
    );
    if (!check.ok) {
      setAreaMismatch(check);
      setAreaMismatchResolved(false);
    } else {
      setAreaMismatch(null);
      setAreaMismatchResolved(false);
    }
  }

  function handleTitleChange(value: string) {
    setTitle(value);
    if (value.trim()) syncAreaGuard(value.trim(), areaId);
  }

  function handleAreaChange(nextAreaId: string) {
    setAreaId(nextAreaId);
    if (title.trim()) syncAreaGuard(title.trim(), nextAreaId);
  }

  function handleAreaMismatchOption(option: string) {
    if (!areaMismatch) return;
    const resolved = resolveProtectedAreaOption(option, areas, areaId);
    if (resolved.keepAnyway) {
      setAreaMismatchResolved(true);
      return;
    }
    if (resolved.areaId) {
      handleAreaChange(resolved.areaId);
    }
  }

  const placementOk =
    recurrence !== "none" ||
    !placement ||
    canConfirmPlacement(placement, explicitBacklog);
  const areaOk = !areaMismatch || areaMismatchResolved;
  const canSave =
    title.trim().length > 0 && areaId && placementOk && areaOk;

  function handleSave() {
    if (!canSave) return;
    onSave({
      title: title.trim(),
      areaId,
      estimateMinutes,
      scheduledDate: resolvedScheduledDate,
      scheduledTime: placement
        ? scheduledTimeFromPlacement(placement)
        : null,
      recurrence,
      reminder,
      notes: notes.trim(),
    });
  }

  const form = (
    <div className="space-y-4">
      <label className="block">
        <span className="mb-1.5 block text-xs font-medium text-app-muted">
          What needs doing?
        </span>
        <input
          autoFocus={!embedded}
          value={title}
          onChange={(e) => handleTitleChange(e.target.value)}
          placeholder="e.g. Call the dentist"
          className="input-app px-4 py-3.5 text-[15px]"
        />
      </label>

      <div>
        <p className="mb-1.5 text-xs font-medium text-app-muted">Life area</p>
        <div className="flex flex-wrap gap-2">
          {areas.map((item) => {
            const active = item.id === areaId;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleAreaChange(item.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 btn-chip ${
                  active ? "btn-chip-active" : ""
                }`}
              >
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
                {item.name}
              </button>
            );
          })}
        </div>
        {areaMismatch && !areaMismatchResolved && (
          <div className="mt-3">
            <ProtectedAreaPrompt
              check={areaMismatch}
              onSelect={handleAreaMismatchOption}
            />
          </div>
        )}
        {area && estimateMinutes > 0 && (
          <p className="mt-2 text-[11px] leading-relaxed text-app-muted">
            Today&apos;s {area.name} window:{" "}
            {formatAreaWindowsOnDate(usualWeek, area.id, todayKey())}
            {preferredTime
              ? ` · planning ${formatTimeForDisplay(preferredTime)}`
              : " · we'll pick a slot in that window"}
          </p>
        )}
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
              className={`px-3 py-1.5 btn-chip ${
                estimateMinutes === m ? "btn-chip-active" : ""
              }`}
            >
              {formatMinutes(m)}
            </button>
          ))}
        </div>
      </div>

      {recurrence === "none" && (
        <>
          <div>
            <p className="mb-1.5 text-xs font-medium text-app-muted">Schedule</p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => {
                  setExplicitBacklog(false);
                  setPinnedDateOverride(null);
                }}
                className={`px-3 py-1.5 btn-chip ${
                  scheduleMode === "suggestion" ? "btn-chip-active" : ""
                }`}
              >
                Use suggestion
              </button>
              <button
                type="button"
                onClick={() => {
                  setExplicitBacklog(false);
                  setPinnedDateOverride(
                    pinnedDateOverride ??
                      (placement
                        ? scheduledDateFromPlacement(placement)
                        : null) ??
                      todayKey(),
                  );
                }}
                className={`px-3 py-1.5 btn-chip ${
                  scheduleMode === "pick" ? "btn-chip-active" : ""
                }`}
              >
                Pick date
              </button>
              <button
                type="button"
                onClick={() => {
                  setExplicitBacklog(true);
                  setPinnedDateOverride(null);
                }}
                className={`px-3 py-1.5 btn-chip ${
                  scheduleMode === "someday" ? "btn-chip-active" : ""
                }`}
              >
                Someday
              </button>
            </div>
            {scheduleMode === "pick" && pinnedDateOverride && (
              <input
                type="date"
                value={pinnedDateOverride}
                min={todayKey()}
                onChange={(e) =>
                  setPinnedDateOverride(e.target.value || null)
                }
                className="input-app mt-2 w-full px-3 py-2 text-sm"
              />
            )}
          </div>

          {placement && (
            <PlacementPanel
              placement={placement}
              explicitBacklog={explicitBacklog}
              reminderOnly={false}
            />
          )}
        </>
      )}

      <div>
        <p className="mb-1.5 text-xs font-medium text-app-muted">Repeat</p>
        <div className="flex flex-wrap gap-2">
          {RECURRENCE_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => {
                setRecurrence(opt.id);
                if (opt.id !== "none") {
                  if (isAbsoluteReminder(reminder)) {
                    setReminder(absoluteToRelativeReminder(reminder));
                  }
                } else if (isRelativeClockReminder(reminder)) {
                  setReminder(
                    relativeToAbsoluteReminder(
                      reminder,
                      resolvedScheduledDate ?? todayKey(),
                    ),
                  );
                }
              }}
              className={`px-3 py-1.5 btn-chip ${
                recurrence === opt.id ? "btn-chip-active" : ""
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
        {recurrence !== "none" && placement && (
          <p className="mt-2 text-xs text-app-muted">
            First occurrence: {placement.explanation}
          </p>
        )}
      </div>

      <div>
        <p className="mb-1.5 text-xs font-medium text-app-muted">Reminder</p>
        <ReminderPicker
          value={reminder}
          recurring={recurrence !== "none"}
          defaultDateKey={resolvedScheduledDate ?? todayKey()}
          onChange={(next) => {
            setReminder(next);
            const absolute = parseAbsoluteReminder(next);
            if (absolute && recurrence === "none") {
              setExplicitBacklog(false);
              setPinnedDateOverride(absolute.dateKey);
            }
          }}
        />
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
          className="input-app resize-none px-4 py-3 text-[15px]"
        />
      </label>
    </div>
  );

  const saveLabel =
    placement?.status === "unachievable" && recurrence === "none" && !explicitBacklog
      ? "No room — adjust first"
      : areaMismatch && !areaMismatchResolved
        ? "Pick a life area first"
        : "Add task";

  const footer = (
    <>
      {onOpenCapture && (
        <button
          type="button"
          onClick={onOpenCapture}
          className="w-full py-2 text-sm text-app-accent"
        >
          Capture with AI instead
        </button>
      )}
      <div className="flex w-full gap-3">
        <button type="button" onClick={onClose} className="btn-secondary btn-lg flex-1">
          Cancel
        </button>
        <button
          type="button"
          disabled={!canSave}
          onClick={handleSave}
          className="btn-primary btn-lg flex-[1.4] disabled:opacity-50"
        >
          {saveLabel}
        </button>
      </div>
    </>
  );

  if (embedded) {
    return (
      <div className="flex min-h-0 flex-1 flex-col">
        <PanelBody>{form}</PanelBody>
        <PanelFooter className="flex-col gap-3">{footer}</PanelFooter>
      </div>
    );
  }

  return (
    <Sheet onClose={onClose}>
      <SheetHeader
        title="Create manually"
        subtitle="You set every field. No AI."
      />
      <SheetBody>{form}</SheetBody>
      <SheetFooter className="flex-col gap-3">{footer}</SheetFooter>
    </Sheet>
  );
}
