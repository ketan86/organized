"use client";

import { useNotifications } from "@/contexts/NotificationsContext";
import { REMINDER_SOUND_OPTIONS, type ReminderSoundId } from "@/lib/notifications/reminder-sound";
import { SettingsRow } from "@/components/ui/SettingsRows";

export function ReminderSoundSettings() {
  const {
    reminderSoundEnabled,
    reminderSoundId,
    setReminderSoundEnabled,
    setReminderSoundId,
    previewReminderSound,
  } = useNotifications();

  return (
    <div className="settings-group">
      <SettingsRow label="Reminder sound">
        <div className="btn-segment">
          <button
            type="button"
            onClick={() => setReminderSoundEnabled(true)}
            className={`btn-segment-item ${
              reminderSoundEnabled ? "btn-segment-item-active" : ""
            }`}
          >
            On
          </button>
          <button
            type="button"
            onClick={() => setReminderSoundEnabled(false)}
            className={`btn-segment-item ${
              !reminderSoundEnabled ? "btn-segment-item-active" : ""
            }`}
          >
            Off
          </button>
        </div>
      </SettingsRow>

      {reminderSoundEnabled && (
        <>
          <SettingsRow label="Sound style" hint="Custom chime while this tab is open">
            <select
              value={reminderSoundId}
              onChange={(e) => setReminderSoundId(e.target.value as ReminderSoundId)}
              className="settings-select"
            >
              {REMINDER_SOUND_OPTIONS.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.label}
                </option>
              ))}
            </select>
          </SettingsRow>

          <SettingsRow
            label="Preview"
            hint="Tap once so the browser allows reminder sound"
            onClick={() => previewReminderSound()}
          >
            <span className="text-sm font-medium text-app-accent">Play</span>
          </SettingsRow>
        </>
      )}
    </div>
  );
}
