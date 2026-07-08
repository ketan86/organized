"use client";

import { useEffect, useRef } from "react";
import {
  REMINDER_PRESET_OPTIONS,
  absoluteToRelativeReminder,
  buildAbsoluteReminder,
  buildRelativeReminder,
  defaultDatetimeReminder,
  isAbsoluteReminder,
  isRelativeClockReminder,
  parseAbsoluteReminder,
  relativeToAbsoluteReminder,
  reminderClockTime,
  type Reminder,
} from "@/lib/mock-data";

const AT_TIME = "__at_time__";

type ReminderPickerProps = {
  value: Reminder;
  onChange: (reminder: Reminder) => void;
  defaultDateKey: string;
  variant?: "panel" | "chips";
  /** When true, reminder is time-of-day only (no date) — matches repeat schedule. */
  recurring?: boolean;
};

function pickerTime(value: Reminder, defaultDateKey: string): string {
  const clock = reminderClockTime(value);
  if (clock) {
    const hh = String(clock.hours).padStart(2, "0");
    const mm = String(clock.minutes).padStart(2, "0");
    const ss = String(clock.seconds).padStart(2, "0");
    return `${hh}:${mm}:${ss}`;
  }
  return defaultDatetimeReminder(value, defaultDateKey).time;
}

function isTimedReminder(value: Reminder): boolean {
  return isRelativeClockReminder(value) || isAbsoluteReminder(value);
}

export function ReminderPicker({
  value,
  onChange,
  defaultDateKey,
  variant = "chips",
  recurring = false,
}: ReminderPickerProps) {
  const prevRecurring = useRef(recurring);

  useEffect(() => {
    if (prevRecurring.current === recurring) return;
    prevRecurring.current = recurring;
    if (recurring && isAbsoluteReminder(value)) {
      onChange(absoluteToRelativeReminder(value));
    } else if (!recurring && isRelativeClockReminder(value)) {
      onChange(relativeToAbsoluteReminder(value, defaultDateKey));
    }
  }, [recurring, value, defaultDateKey, onChange]);

  const timedActive = recurring
    ? isTimedReminder(value)
    : isAbsoluteReminder(value);
  const presetValue = timedActive
    ? AT_TIME
    : value === "none" || value === "morning" || value === "evening"
      ? value
      : AT_TIME;

  const datetime = defaultDatetimeReminder(value, defaultDateKey);
  const time = pickerTime(value, defaultDateKey);

  function handlePresetChange(next: string) {
    if (next === AT_TIME) {
      onChange(
        recurring
          ? buildRelativeReminder(time)
          : buildAbsoluteReminder(datetime.dateKey, time),
      );
      return;
    }
    onChange(next as Reminder);
  }

  function handleTimeChange(nextTime: string) {
    onChange(
      recurring
        ? buildRelativeReminder(nextTime)
        : buildAbsoluteReminder(datetime.dateKey, nextTime),
    );
  }

  function handleDateChange(dateKey: string) {
    onChange(buildAbsoluteReminder(dateKey, time));
  }

  function selectAtTime() {
    onChange(
      recurring
        ? buildRelativeReminder(time)
        : buildAbsoluteReminder(datetime.dateKey, time),
    );
  }

  const timeField = timedActive && (
    <input
      type="time"
      step={1}
      value={time}
      onChange={(e) => handleTimeChange(e.target.value)}
      className="input-app min-h-10 w-full px-3 py-2 text-sm sm:max-w-xs"
    />
  );

  const dateTimeFields = timedActive && !recurring && (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
      <input
        type="date"
        value={datetime.dateKey}
        onChange={(e) => handleDateChange(e.target.value)}
        className="input-app min-h-10 w-full px-3 py-2 text-sm sm:flex-1"
      />
      <input
        type="time"
        step={1}
        value={time}
        onChange={(e) => handleTimeChange(e.target.value)}
        className="input-app min-h-10 w-full px-3 py-2 text-sm sm:flex-1"
      />
    </div>
  );

  const atTimeLabel = recurring ? "At time" : "On date & time";

  if (variant === "panel") {
    return (
      <div className="flex flex-col gap-3">
        <PanelSelect
          value={presetValue}
          onChange={handlePresetChange}
          options={[
            ...REMINDER_PRESET_OPTIONS.map((o) => ({
              value: o.id,
              label: o.label,
            })),
            {
              value: AT_TIME,
              label: recurring ? "At time…" : "On date & time…",
            },
          ]}
        />
        {recurring ? timeField : dateTimeFields}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {REMINDER_PRESET_OPTIONS.map((opt) => {
          const active = value === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => onChange(opt.id)}
              className={`px-3 py-1.5 btn-chip ${
                active ? "btn-chip-active" : ""
              }`}
            >
              {opt.label}
            </button>
          );
        })}
        <button
          type="button"
          onClick={selectAtTime}
          className={`px-3 py-1.5 btn-chip ${
            timedActive ? "btn-chip-active" : ""
          }`}
        >
          {atTimeLabel}
        </button>
      </div>
      {recurring ? timeField : dateTimeFields}
    </div>
  );
}

function PanelSelect({
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
