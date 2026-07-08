"use client";

import { useNotifications } from "@/contexts/NotificationsContext";
import { SettingsRow } from "@/components/ui/SettingsRows";

export function AreaBoundarySettings() {
  const { areaBoundariesEnabled, setAreaBoundariesEnabled } = useNotifications();

  return (
    <SettingsRow
      label="Life area boundaries"
      hint="Alert when a scheduled life area starts or ends"
    >
      <button
        type="button"
        role="switch"
        aria-checked={areaBoundariesEnabled}
        onClick={() => setAreaBoundariesEnabled(!areaBoundariesEnabled)}
        className={`relative h-7 w-12 rounded-full transition ${
          areaBoundariesEnabled ? "bg-violet-500" : "bg-app-input"
        }`}
      >
        <span
          className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition ${
            areaBoundariesEnabled ? "left-5" : "left-0.5"
          }`}
        />
      </button>
    </SettingsRow>
  );
}
