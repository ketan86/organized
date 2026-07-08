"use client";

import { useNotifications } from "@/contexts/NotificationsContext";

function permissionLabel(permission: NotificationPermission | "unsupported") {
  switch (permission) {
    case "granted":
      return "Enabled";
    case "denied":
      return "Blocked in browser";
    case "default":
      return "Not enabled";
    default:
      return "Unsupported";
  }
}

export function NotificationSettingsPanel() {
  const {
    support,
    pushConfigured,
    enabling,
    enableError,
    testFeedback,
    enableNotifications,
    disableNotifications,
    sendTestNotification,
  } = useNotifications();

  if (!support.supported) {
    return (
      <p className="px-3 py-2 text-xs text-app-muted">
        Notifications are not available in this browser view. Open the app in
        Chrome, Safari, or Edge (not an embedded preview) to enable alerts.
      </p>
    );
  }

  return (
    <div className="space-y-3 px-1">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm text-app-secondary">Status</p>
          <p className="text-xs text-app-muted">
            {permissionLabel(support.permission)}
            {!pushConfigured ? " · push keys not configured" : ""}
          </p>
        </div>
        {support.permission === "granted" ? (
          <button
            type="button"
            onClick={() => void disableNotifications()}
            className="text-sm font-medium text-app-muted transition hover:text-app-secondary"
          >
            Turn off
          </button>
        ) : support.permission === "default" ? (
          <button
            type="button"
            disabled={enabling}
            onClick={() => void enableNotifications()}
            className="btn-primary btn-sm"
          >
            {enabling ? "Enabling…" : "Enable"}
          </button>
        ) : null}
      </div>

      {enableError && (
        <p className="text-xs text-app-warning">{enableError}</p>
      )}

      {support.permission === "denied" && (
        <p className="text-xs leading-relaxed text-app-muted">
          Notifications are blocked. Re-enable them in your browser site settings,
          then return here.
        </p>
      )}

      {support.permission === "granted" && (
        <div className="space-y-2">
          <button
            type="button"
            onClick={() => void sendTestNotification()}
            className="text-sm font-medium text-app-accent transition hover:text-app-accent-soft"
          >
            Send test notification
          </button>
          {testFeedback && (
            <p className="text-xs text-app-success">{testFeedback}</p>
          )}
        </div>
      )}

      <p className="text-xs leading-relaxed text-app-faint">
        Task reminders and life area start/stop alerts show in-app while Organized
        is open. On localhost, system notifications work in Chrome, Firefox, and Edge.
      </p>
    </div>
  );
}
