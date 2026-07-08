"use client";

import { useEffect } from "react";
import { useNotifications } from "@/contexts/NotificationsContext";

export function ReminderToastStack({
  onOpenTask,
  onOpenArea,
}: {
  onOpenTask?: (taskId: string) => void;
  onOpenArea?: (areaId: string) => void;
}) {
  const { toasts, dismissToast } = useNotifications();

  return (
    <div className="pointer-events-none fixed inset-x-0 top-[max(0.75rem,env(safe-area-inset-top))] z-[60] flex flex-col items-center gap-2 px-4">
      {toasts.map((toast) => (
        <ReminderToastItem
          key={toast.id}
          toast={toast}
          onOpen={() => {
            if (toast.kind === "area-boundary" && toast.areaId) {
              onOpenArea?.(toast.areaId);
            } else if (toast.taskId) {
              onOpenTask?.(toast.taskId);
            }
            dismissToast(toast.id);
          }}
          onDismiss={() => dismissToast(toast.id)}
        />
      ))}
    </div>
  );
}

function ReminderToastItem({
  toast,
  onOpen,
  onDismiss,
}: {
  toast: {
    id: string;
    title: string;
    body: string;
    kind: "task" | "area-boundary";
  };
  onOpen: () => void;
  onDismiss: () => void;
}) {
  useEffect(() => {
    const id = window.setTimeout(onDismiss, 8000);
    return () => window.clearTimeout(id);
  }, [onDismiss]);

  return (
    <button
      type="button"
      onClick={onOpen}
      className="pointer-events-auto flex w-full max-w-md items-start gap-3 rounded-2xl bg-app-elevated px-4 py-3 text-left shadow-lg shadow-black/20 transition hover:bg-app-card"
    >
      <span className="text-lg leading-none" aria-hidden>
        {toast.kind === "area-boundary" ? "⏱" : "🔔"}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-app">{toast.title}</p>
        <p className="text-xs text-app-muted">{toast.body}</p>
      </div>
      <span
        role="button"
        tabIndex={0}
        onClick={(e) => {
          e.stopPropagation();
          onDismiss();
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            e.stopPropagation();
            onDismiss();
          }
        }}
        className="btn-icon shrink-0"
        aria-label="Dismiss reminder"
      >
        ×
      </span>
    </button>
  );
}
