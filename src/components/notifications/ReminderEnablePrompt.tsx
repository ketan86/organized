"use client";

import { useNotifications } from "@/contexts/NotificationsContext";

export function ReminderEnablePrompt() {
  const {
    showEnablePrompt,
    dismissEnablePrompt,
    enableNotifications,
    enabling,
    enableError,
    pushConfigured,
    support,
  } = useNotifications();

  if (!showEnablePrompt || !support.supported) return null;

  return (
    <div className="fixed inset-x-0 bottom-[max(5.5rem,env(safe-area-inset-bottom))] z-[60] flex justify-center px-4 lg:bottom-6">
      <div className="w-full max-w-md rounded-2xl bg-app-elevated px-4 py-4 shadow-lg shadow-black/20">
        <p className="text-sm font-semibold text-app">Get reminded on time?</p>
        <p className="mt-1 text-xs leading-relaxed text-app-muted">
          Enable notifications so Organized can alert you when a task reminder is
          due. You&apos;ll get a browser prompt next.
          {!pushConfigured
            ? " Background push needs VAPID keys in .env.local (in-app alerts still work)."
            : ""}
        </p>
        {enableError && (
          <p className="mt-2 text-xs text-app-warning">{enableError}</p>
        )}
        <div className="mt-4 flex items-center gap-3">
          <button
            type="button"
            onClick={dismissEnablePrompt}
            className="text-sm font-medium text-app-muted transition hover:text-app-secondary"
          >
            Not now
          </button>
          <button
            type="button"
            disabled={enabling}
            onClick={() => void enableNotifications()}
            className="btn-primary btn-sm ml-auto"
          >
            {enabling ? "Enabling…" : "Enable notifications"}
          </button>
        </div>
      </div>
    </div>
  );
}
