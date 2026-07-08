"use client";

import { SettingsRow, SettingsSection } from "@/components/ui/SettingsRows";

type AccountScreenProps = {
  userEmail?: string;
  embedded?: boolean;
  onBack?: () => void;
};

export function AccountScreen({
  userEmail,
  embedded = false,
  onBack,
}: AccountScreenProps) {
  return (
    <div className={`panel-page flex flex-col gap-5 ${embedded ? "" : "pt-14"}`}>
      {!embedded && (
        <div className="mb-1 flex items-center gap-3">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="btn-icon -ml-1"
              aria-label="Back"
            >
              ←
            </button>
          )}
          <div>
            <h1 className="text-lg font-semibold text-app">Account</h1>
            <p className="text-xs text-app-muted">Profile and AI status</p>
          </div>
        </div>
      )}

      <SettingsSection title="Profile">
        <SettingsRow label="Email">
          <span>{userEmail ?? "—"}</span>
        </SettingsRow>
      </SettingsSection>

      <SettingsSection title="AI">
        <SettingsRow label="Status">
          <span>Connected</span>
        </SettingsRow>
        <SettingsRow label="Model">
          <span>Claude</span>
        </SettingsRow>
      </SettingsSection>
    </div>
  );
}
