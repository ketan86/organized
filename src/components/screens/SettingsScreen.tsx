"use client";

import { useState } from "react";
import { useTheme } from "@/components/ThemeProvider";
import { NotificationSettingsPanel } from "@/components/notifications/NotificationSettingsPanel";
import { AreaBoundarySettings } from "@/components/notifications/AreaBoundarySettings";
import { ReminderSoundSettings } from "@/components/notifications/ReminderSoundSettings";
import { SettingsRow, SettingsSection } from "@/components/ui/SettingsRows";

type SettingsScreenProps = {
  embedded?: boolean;
  onReset?: () => void | Promise<void>;
  onOpenReminders?: () => void;
};

export function SettingsScreen({ embedded = false, onReset, onOpenReminders }: SettingsScreenProps) {
  const { theme, setTheme } = useTheme();
  const [resetting, setResetting] = useState(false);

  async function handleReset() {
    if (!onReset) return;
    const confirmed = window.confirm(
      "Reset everything and restart setup? Your life areas, schedule, tasks, and tracking will be cleared.",
    );
    if (!confirmed) return;
    setResetting(true);
    try {
      await onReset();
    } finally {
      setResetting(false);
    }
  }

  return (
    <div className={`panel-page flex flex-col gap-5 ${embedded ? "" : "pt-14"}`}>
      {!embedded && (
        <div className="mb-1">
          <h1 className="text-lg font-semibold text-app">Settings</h1>
          <p className="text-xs text-app-muted">Appearance and preferences</p>
        </div>
      )}

      <SettingsSection title="Appearance">
        <SettingsRow label="Theme">
          <div className="btn-segment">
            {(["light", "dark"] as const).map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setTheme(value)}
                className={`btn-segment-item capitalize ${
                  theme === value ? "btn-segment-item-active" : ""
                }`}
              >
                {value === "light" ? "Day" : "Night"}
              </button>
            ))}
          </div>
        </SettingsRow>
      </SettingsSection>

      <SettingsSection title="Notifications" variant="plain">
        <NotificationSettingsPanel />
        <AreaBoundarySettings />
      </SettingsSection>

      <SettingsSection title="Reminder sound">
        <ReminderSoundSettings />
      </SettingsSection>

      {onOpenReminders && (
        <SettingsSection title="Reminders">
          <SettingsRow
            label="All reminders"
            hint="View upcoming task reminders and life area boundaries"
            onClick={onOpenReminders}
          />
        </SettingsSection>
      )}

      {onReset && (
        <SettingsSection title="Setup">
          <SettingsRow
            label="Reset to defaults"
            hint="Clears your setup and restarts onboarding"
            onClick={() => void handleReset()}
          >
            <span className={`text-sm ${resetting ? "text-app-muted" : "text-red-400"}`}>
              {resetting ? "Resetting…" : "Reset"}
            </span>
          </SettingsRow>
        </SettingsSection>
      )}
    </div>
  );
}
