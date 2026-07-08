"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { playReminderSound, unlockReminderAudio, armReminderAudioUnlock, type ReminderSoundId } from "@/lib/notifications/reminder-sound";
import {
  loadReminderSoundPrefs,
  saveReminderSoundPrefs,
  type ReminderSoundPrefs,
} from "@/lib/notifications/reminder-sound-prefs";
import { api } from "@/lib/api";
import {
  getNotificationSupport,
  hasLocalReminderFired,
  markLocalReminderFired,
  registerServiceWorker,
  showLocalNotification,
  subscribeToPush,
  subscriptionToJson,
} from "@/lib/notifications/client";
import {
  loadAreaBoundaryPrefs,
  saveAreaBoundaryPrefs,
  type AreaBoundaryPrefs,
} from "@/lib/notifications/area-boundary-prefs";
import {
  boundaryBody,
  boundaryTitle,
  collectDueAreaBoundaries,
} from "@/lib/notifications/area-boundary-schedule";
import { getNextNotificationFireAt } from "@/lib/notifications/notification-schedule";
import { collectDueReminders } from "@/lib/notifications/reminder-schedule";
import type { AreaDef, Reminder, Task, UsualWeekBlock } from "@/lib/mock-data";

export type ReminderToast = {
  id: string;
  title: string;
  body: string;
  taskId?: string;
  areaId?: string;
  kind: "task" | "area-boundary";
};

type NotificationsContextValue = {
  support: ReturnType<typeof getNotificationSupport>;
  pushConfigured: boolean;
  enabling: boolean;
  enableError: string | null;
  testFeedback: string | null;
  enableNotifications: () => Promise<boolean>;
  disableNotifications: () => Promise<void>;
  sendTestNotification: () => Promise<boolean>;
  toasts: ReminderToast[];
  dismissToast: (id: string) => void;
  promptEnableAfterReminder: (reminder: Reminder) => void;
  showEnablePrompt: boolean;
  dismissEnablePrompt: () => void;
  reminderSoundEnabled: boolean;
  reminderSoundId: ReminderSoundId;
  setReminderSoundEnabled: (enabled: boolean) => void;
  setReminderSoundId: (soundId: ReminderSoundId) => void;
  previewReminderSound: () => void;
  areaBoundariesEnabled: boolean;
  setAreaBoundariesEnabled: (enabled: boolean) => void;
};

const NotificationsContext = createContext<NotificationsContextValue | null>(
  null,
);

export function NotificationsProvider({
  children,
  tasks,
  usualWeek,
  areas,
  enabled,
}: {
  children: ReactNode;
  tasks: Task[];
  usualWeek: UsualWeekBlock[];
  areas: AreaDef[];
  enabled: boolean;
}) {
  const [support, setSupport] = useState(getNotificationSupport);
  const [pushConfigured, setPushConfigured] = useState(false);
  const [vapidPublicKey, setVapidPublicKey] = useState<string | null>(null);
  const [enabling, setEnabling] = useState(false);
  const [enableError, setEnableError] = useState<string | null>(null);
  const [testFeedback, setTestFeedback] = useState<string | null>(null);
  const [toasts, setToasts] = useState<ReminderToast[]>([]);
  const [showEnablePrompt, setShowEnablePrompt] = useState(false);
  const [soundPrefs, setSoundPrefs] = useState<ReminderSoundPrefs>(() =>
    loadReminderSoundPrefs(),
  );
  const [boundaryPrefs, setBoundaryPrefs] = useState<AreaBoundaryPrefs>(() =>
    loadAreaBoundaryPrefs(),
  );

  useEffect(() => {
    setSoundPrefs(loadReminderSoundPrefs());
    setBoundaryPrefs(loadAreaBoundaryPrefs());
  }, []);

  useEffect(() => {
    setSupport(getNotificationSupport());
  }, []);

  useEffect(() => {
    if (!enabled) return;
    armReminderAudioUnlock();
    void registerServiceWorker().catch(() => undefined);
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return;
    const onVisible = () => {
      if (document.visibilityState === "visible") unlockReminderAudio();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return;
    void api.push
      .config()
      .then((config) => {
        setPushConfigured(config.configured);
        setVapidPublicKey(config.publicKey);
      })
      .catch(() => {
        setPushConfigured(false);
        setVapidPublicKey(null);
      });
  }, [enabled]);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const setReminderSoundEnabled = useCallback((enabled: boolean) => {
    setSoundPrefs((prev) => {
      const next = { ...prev, enabled };
      saveReminderSoundPrefs(next);
      return next;
    });
    if (enabled) unlockReminderAudio();
  }, []);

  const setReminderSoundId = useCallback((soundId: ReminderSoundId) => {
    setSoundPrefs((prev) => {
      const next = { ...prev, soundId };
      saveReminderSoundPrefs(next);
      return next;
    });
  }, []);

  const previewReminderSound = useCallback(() => {
    unlockReminderAudio();
    playReminderSound(soundPrefs.soundId);
  }, [soundPrefs.soundId]);

  const setAreaBoundariesEnabled = useCallback((enabled: boolean) => {
    setBoundaryPrefs((prev) => {
      const next = { ...prev, enabled };
      saveAreaBoundaryPrefs(next);
      return next;
    });
  }, []);

  const fireReminder = useCallback((task: Task, dedupeKey: string) => {
    if (hasLocalReminderFired(dedupeKey)) return;
    markLocalReminderFired(dedupeKey);

    const visible =
      typeof document !== "undefined" && document.visibilityState === "visible";

    if (soundPrefs.enabled && visible) {
      playReminderSound(soundPrefs.soundId);
    }

    const toast: ReminderToast = {
      id: dedupeKey,
      title: task.title,
      body: "Reminder",
      taskId: task.id,
      kind: "task",
    };
    setToasts((prev) => [...prev, toast]);
    showLocalNotification(task.title, {
      body: "Reminder",
      tag: dedupeKey,
      silent: visible,
      data: { url: "/", taskId: task.id, kind: "task" },
    });
  }, [soundPrefs.enabled, soundPrefs.soundId]);

  const fireAreaBoundary = useCallback(
    (
      area: AreaDef,
      block: UsualWeekBlock,
      kind: "start" | "stop",
      dedupeKey: string,
    ) => {
      if (hasLocalReminderFired(dedupeKey)) return;
      markLocalReminderFired(dedupeKey);

      const visible =
        typeof document !== "undefined" && document.visibilityState === "visible";

      if (soundPrefs.enabled && visible) {
        playReminderSound(soundPrefs.soundId);
      }

      const title = boundaryTitle(area, kind);
      const body = boundaryBody(block, kind);
      const toast: ReminderToast = {
        id: dedupeKey,
        title,
        body,
        areaId: area.id,
        kind: "area-boundary",
      };
      setToasts((prev) => [...prev, toast]);
      showLocalNotification(title, {
        body,
        tag: dedupeKey,
        silent: visible,
        data: { url: "/", areaId: area.id, kind: "area-boundary" },
      });
    },
    [soundPrefs.enabled, soundPrefs.soundId],
  );

  useEffect(() => {
    if (!enabled) return;

    let timeoutId: number | undefined;
    let intervalId: number | undefined;

    function runCheck() {
      const now = new Date();
      const dueTasks = collectDueReminders(tasks, now);
      for (const { task, dedupeKey } of dueTasks) {
        fireReminder(task, dedupeKey);
      }

      const dueBoundaries = boundaryPrefs.enabled
        ? collectDueAreaBoundaries(usualWeek, areas, now)
        : [];
      for (const { area, block, kind, dedupeKey } of dueBoundaries) {
        fireAreaBoundary(area, block, kind, dedupeKey);
      }

      if (
        (dueTasks.length > 0 || dueBoundaries.length > 0) &&
        support.permission === "granted" &&
        pushConfigured
      ) {
        void api.reminders.dispatch().catch(() => undefined);
      }

      scheduleNext();
    }

    function scheduleNext() {
      if (timeoutId !== undefined) window.clearTimeout(timeoutId);
      const next = getNextNotificationFireAt(tasks, usualWeek, {
        areaBoundariesEnabled: boundaryPrefs.enabled,
        now: new Date(),
      });
      if (!next) return;
      const delay = Math.max(1000, next.getTime() - Date.now());
      timeoutId = window.setTimeout(runCheck, delay);
    }

    runCheck();
    intervalId = window.setInterval(runCheck, 30_000);

    return () => {
      if (timeoutId !== undefined) window.clearTimeout(timeoutId);
      if (intervalId !== undefined) window.clearInterval(intervalId);
    };
  }, [
    enabled,
    tasks,
    usualWeek,
    areas,
    boundaryPrefs.enabled,
    fireReminder,
    fireAreaBoundary,
    support.permission,
    pushConfigured,
  ]);

  const enableNotifications = useCallback(async () => {
    setEnabling(true);
    setEnableError(null);
    try {
      // Gesture chain: SW register → permission → unlock audio → push subscribe.
      await registerServiceWorker().catch(() => null);

      const permission = await Notification.requestPermission();
      const nextSupport = getNotificationSupport();
      setSupport(nextSupport);

      if (permission !== "granted") {
        setEnableError(
          permission === "denied"
            ? "Blocked in browser. Allow notifications in site settings."
            : "Permission was not granted.",
        );
        return false;
      }

      unlockReminderAudio();
      showLocalNotification("Organized", {
        body: "Notifications enabled.",
        tag: "organized-enabled",
        data: { url: "/", kind: "test" },
      });

      if (pushConfigured && vapidPublicKey && nextSupport.pushSupported) {
        try {
          const subscription = await subscribeToPush(vapidPublicKey);
          if (subscription) {
            await api.push.subscribe(subscriptionToJson(subscription));
          }
        } catch (error) {
          setEnableError(
            error instanceof Error
              ? `Alerts enabled in-app. Background push failed: ${error.message}`
              : "Alerts enabled in-app. Background push could not be set up.",
          );
        }
      }

      setShowEnablePrompt(false);
      return true;
    } catch (error) {
      setEnableError(
        error instanceof Error
          ? error.message
          : "Could not enable notifications.",
      );
      return false;
    } finally {
      setEnabling(false);
    }
  }, [pushConfigured, vapidPublicKey]);

  const disableNotifications = useCallback(async () => {
    if ("serviceWorker" in navigator) {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      if (subscription) {
        await api.push.unsubscribe({ endpoint: subscription.endpoint }).catch(
          () => undefined,
        );
        await subscription.unsubscribe();
      }
    }
    setSupport(getNotificationSupport());
  }, []);

  const sendTestNotification = useCallback(async () => {
    setTestFeedback(null);
    if (support.permission !== "granted") {
      const ok = await enableNotifications();
      if (!ok) return false;
    }

    showLocalNotification("Organized", { body: "Notifications are working." });
    setToasts((prev) => [
      ...prev,
      {
        id: `test-${Date.now()}`,
        title: "Organized",
        body: "Test notification",
        kind: "task",
      },
    ]);

    try {
      if (pushConfigured && vapidPublicKey && getNotificationSupport().pushSupported) {
        const subscription = await subscribeToPush(vapidPublicKey);
        if (subscription) {
          await api.push.subscribe(subscriptionToJson(subscription));
        } else {
          setTestFeedback(
            "Alert shown. Could not register this browser for background push.",
          );
          return true;
        }
      }
      const result = await api.push.test();
      if (result.ok) {
        setTestFeedback("Alert shown. Background push sent as well.");
      } else if (!result.configured) {
        setTestFeedback(
          `Alert shown. ${result.error ?? "Server push is not configured — restart npm run dev after adding VAPID keys."}`,
        );
      } else if (result.subscriptionCount === 0) {
        setTestFeedback(
          `Alert shown. ${result.error ?? "Background push is not registered for this browser yet."}`,
        );
      } else {
        setTestFeedback(
          `Alert shown. ${result.error ?? "Background push could not be delivered."}`,
        );
      }
    } catch (error) {
      setTestFeedback(
        error instanceof Error
          ? `Alert shown. Push test failed: ${error.message}`
          : "Alert shown. Push test failed.",
      );
    }
    return true;
  }, [enableNotifications, pushConfigured, support.permission, vapidPublicKey]);

  const promptEnableAfterReminder = useCallback(
    (reminder: Reminder) => {
      if (reminder === "none") return;
      if (!support.supported || support.permission !== "default") return;
      setShowEnablePrompt(true);
    },
    [support],
  );

  const value = useMemo(
    () => ({
      support,
      pushConfigured,
      enabling,
      enableError,
      testFeedback,
      enableNotifications,
      disableNotifications,
      sendTestNotification,
      toasts,
      dismissToast,
      promptEnableAfterReminder,
      showEnablePrompt,
      dismissEnablePrompt: () => {
        setShowEnablePrompt(false);
        setEnableError(null);
      },
      reminderSoundEnabled: soundPrefs.enabled,
      reminderSoundId: soundPrefs.soundId,
      setReminderSoundEnabled,
      setReminderSoundId,
      previewReminderSound,
      areaBoundariesEnabled: boundaryPrefs.enabled,
      setAreaBoundariesEnabled,
    }),
    [
      support,
      pushConfigured,
      enabling,
      enableError,
      testFeedback,
      enableNotifications,
      disableNotifications,
      sendTestNotification,
      toasts,
      dismissToast,
      promptEnableAfterReminder,
      showEnablePrompt,
      soundPrefs.enabled,
      soundPrefs.soundId,
      setReminderSoundEnabled,
      setReminderSoundId,
      previewReminderSound,
      boundaryPrefs.enabled,
      setAreaBoundariesEnabled,
    ],
  );

  return (
    <NotificationsContext.Provider value={value}>
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationsContext);
  if (!ctx) {
    throw new Error("useNotifications must be used within NotificationsProvider");
  }
  return ctx;
}
