"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { AppShell } from "@/components/AppShell";
import { LoginScreen } from "@/components/screens/LoginScreen";
import { IntentScreen } from "@/components/screens/onboarding/IntentScreen";
import { AreasScreen } from "@/components/screens/onboarding/AreasScreen";
import {
  WeightageScreen,
  type AreaWeight,
} from "@/components/screens/onboarding/WeightageScreen";
import { ReviewScreen } from "@/components/screens/onboarding/ReviewScreen";
import { LifeOrbitScreen } from "@/components/screens/LifeOrbitScreen";
import { AreaDetailScreen } from "@/components/screens/AreaDetailScreen";
import {
  CaptureSheet,
  type CaptureConfirm,
} from "@/components/screens/CaptureSheet";
import { CalendarScreen } from "@/components/screens/CalendarScreen";
import { RebalanceSheet } from "@/components/screens/RebalanceSheet";
import { SwitchSheet } from "@/components/screens/SwitchSheet";
import {
  ManualTaskSheet,
  type ManualTaskInput,
} from "@/components/screens/ManualTaskSheet";
import { LifeMapScreen } from "@/components/screens/LifeMapScreen";
import { AccountScreen } from "@/components/screens/AccountScreen";
import { SettingsScreen } from "@/components/screens/SettingsScreen";
import { RemindersScreen } from "@/components/screens/RemindersScreen";
import { LifePartScheduleScreen } from "@/components/screens/LifePartScheduleScreen";
import { WorkspaceTaskList } from "@/components/screens/WorkspaceTaskList";
import { DesktopShell } from "@/components/shell/DesktopShell";
import { ReminderAppShell } from "@/components/notifications/ReminderAppShell";
import { TimeWindowToggle } from "@/components/shell/TimeWindowToggle";
import { ShieldIcon } from "@/components/ui/ShieldIcon";
import type {
  MainSection,
  RightPanelMode,
  WorkspaceView,
} from "@/components/shell/types";
import {
  selectedTaskIdFromPanel,
  workspaceViewLabel,
} from "@/components/shell/types";
import {
  absoluteToRelativeReminder,
  areaScheduleLabel,
  buildRebalanceOffer,
  createDefaultUsualWeek,
  createInitialAreas,
  formatHours,
  formatMarkDoneNotice,
  getAreaProgress,
  getRunningSession,
  isAbsoluteReminder,
  isRelativeClockReminder,
  isRecurring,
  plannedHoursForArea,
  relativeToAbsoluteReminder,
  resolvePreferredTime,
  todayKey,
  usualWeekBudgetErrorMessage,
  validateUsualWeekBudget,
  type AreaDef,
  type BuyTimeOption,
  type IntentId,
  type RebalanceOffer,
  type Recurrence,
  type Reminder,
  type Session,
  type Task,
  type TimeWindow,
  type UsualWeekBlock,
} from "@/lib/mock-data";
import { api } from "@/lib/api";
import { useAuth, useBootstrap } from "@/hooks/useAppPersistence";
import {
  placeTask,
  scheduledDateFromPlacement,
  scheduledTimeFromPlacement,
} from "@/lib/scheduling/placement";

type Screen =
  | "intent"
  | "areas"
  | "weightage"
  | "review"
  | "orbit"
  | "calendar"
  | "life-map"
  | "account"
  | "life-part-schedule"
  | "area"
  | "task";

function defaultSelectedIds(areas: AreaDef[]) {
  return areas.filter((a) => a.defaultSelected).map((a) => a.id);
}

function defaultProtectedIds(areas: AreaDef[], selectedIds: string[]) {
  return areas
    .filter((a) => a.defaultProtected && selectedIds.includes(a.id))
    .map((a) => a.id);
}

function weightsForSelection(
  areas: AreaDef[],
  selectedIds: string[],
  prev: AreaWeight[],
): AreaWeight[] {
  return selectedIds.map((id) => {
    const existing = prev.find((w) => w.id === id);
    if (existing) return existing;
    const area = areas.find((a) => a.id === id);
    return { id, hours: area?.defaultHours ?? 1 };
  });
}

export default function Home() {
  const { user, loading: authLoading, login, register, logout } = useAuth();
  const {
    data: bootstrap,
    loading: dataLoading,
    error: dataError,
    reload,
  } = useBootstrap(!!user);

  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [authSubmitting, setAuthSubmitting] = useState(false);
  const [authFormError, setAuthFormError] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);

  const [hydrated, setHydrated] = useState(false);
  const [onboardingComplete, setOnboardingComplete] = useState(false);
  const [screen, setScreen] = useState<Screen>("intent");
  const [intents, setIntents] = useState<IntentId[]>(["family", "rest"]);
  const [areas, setAreas] = useState<AreaDef[]>(() => createInitialAreas());
  const [selectedIds, setSelectedIds] = useState<string[]>(() =>
    defaultSelectedIds(createInitialAreas()),
  );
  const [weights, setWeights] = useState<AreaWeight[]>(() =>
    weightsForSelection(
      createInitialAreas(),
      defaultSelectedIds(createInitialAreas()),
      [],
    ),
  );
  const [protectedIds, setProtectedIds] = useState<string[]>(() =>
    defaultProtectedIds(
      createInitialAreas(),
      defaultSelectedIds(createInitialAreas()),
    ),
  );
  const [tasks, setTasks] = useState<Task[]>([]);
  const [usualWeek, setUsualWeek] = useState<UsualWeekBlock[]>(() =>
    createDefaultUsualWeek(),
  );
  const [sessions, setSessions] = useState<Session[]>([]);
  const [timeWindow, setTimeWindow] = useState<TimeWindow>("today");
  const [activeAreaId, setActiveAreaId] = useState<string | null>(null);
  const [scheduleAreaId, setScheduleAreaId] = useState<string | null>(null);
  const [scheduleBack, setScheduleBack] = useState<"life-map" | "area">(
    "life-map",
  );
  const [lifeAreaAddOpen, setLifeAreaAddOpen] = useState(false);
  const [accountBack, setAccountBack] = useState<"orbit" | "calendar" | "life-map">(
    "orbit",
  );
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const [occurrenceDate, setOccurrenceDate] = useState<string | null>(null);
  const [rightPanel, setRightPanel] = useState<RightPanelMode>({ kind: "closed" });
  const [rebalanceOffer, setRebalanceOffer] = useState<RebalanceOffer | null>(
    null,
  );
  const [showSwitchSheet, setShowSwitchSheet] = useState(false);
  const [switchNotice, setSwitchNotice] = useState<string | null>(null);
  const [progressNotice, setProgressNotice] = useState<string | null>(null);
  const [returnTo, setReturnTo] = useState<"orbit" | "area" | "calendar">(
    "orbit",
  );
  const [mainSection, setMainSection] = useState<MainSection>("workspace");
  const [workspaceView, setWorkspaceView] = useState<WorkspaceView>("orbit");

  useEffect(() => {
    if (mainSection !== "life-map" || screen === "life-part-schedule") {
      setLifeAreaAddOpen(false);
    }
  }, [mainSection, screen]);

  const reportApiError = useCallback((err: unknown) => {
    setApiError(err instanceof Error ? err.message : "Something went wrong");
  }, []);

  const persistAreas = useCallback(
    async (
      next: {
        areas: AreaDef[];
        selectedIds: string[];
        weights: AreaWeight[];
        protectedIds: string[];
      },
    ) => {
      try {
        await api.areas.put(next);
      } catch (err) {
        reportApiError(err);
      }
    },
    [reportApiError],
  );

  useEffect(() => {
    if (!bootstrap) return;
    setIntents(bootstrap.intents);
    setAreas(bootstrap.areas);
    setSelectedIds(bootstrap.selectedIds);
    setWeights(bootstrap.weights);
    setProtectedIds(bootstrap.protectedIds);
    setTasks(bootstrap.tasks);
    setUsualWeek(bootstrap.usualWeek);
    setSessions(bootstrap.sessions);
    setTimeWindow(bootstrap.timeWindow);
    setOnboardingComplete(bootstrap.onboardingComplete);
    setScreen(bootstrap.onboardingComplete ? "orbit" : "intent");
    if (bootstrap.onboardingComplete) {
      setMainSection("workspace");
      setWorkspaceView("orbit");
    }
    setHydrated(true);
  }, [bootstrap]);

  async function handleLogout() {
    await logout();
    setHydrated(false);
  }

  const selectedAreas = useMemo(
    () => areas.filter((a) => selectedIds.includes(a.id)),
    [areas, selectedIds],
  );

  const activeWeights = weights.filter((w) => selectedIds.includes(w.id));

  const activeArea = selectedAreas.find((a) => a.id === activeAreaId);
  const activeTask = tasks.find((t) => t.id === activeTaskId);
  const taskArea = activeTask
    ? selectedAreas.find((a) => a.id === activeTask.areaId)
    : undefined;
  const runningSession = getRunningSession(sessions);

  async function handleLogin(email: string, password: string) {
    setAuthSubmitting(true);
    setAuthFormError(null);
    try {
      await login(email, password);
    } catch (err) {
      setAuthFormError(
        err instanceof Error ? err.message : "Could not sign in",
      );
    } finally {
      setAuthSubmitting(false);
    }
  }

  async function handleRegister(email: string, password: string) {
    setAuthSubmitting(true);
    setAuthFormError(null);
    try {
      await register(email, password);
    } catch (err) {
      setAuthFormError(
        err instanceof Error ? err.message : "Could not create account",
      );
    } finally {
      setAuthSubmitting(false);
    }
  }

  function stopTracking() {
    const running = getRunningSession(sessions);
    if (!running) return;
    const now = Date.now();
    const nextSessions = sessions.map((s) =>
      s.endedAt === null ? { ...s, endedAt: now } : s,
    );
    setSessions(nextSessions);

    const offer = buildRebalanceOffer(
      running.areaId,
      selectedAreas,
      usualWeek,
      nextSessions,
      protectedIds,
      now,
    );
    if (offer) setRebalanceOffer(offer);

    void api.sessions
      .stop()
      .then(({ sessions: serverSessions }) => setSessions(serverSessions))
      .catch(reportApiError);
  }

  function startAreaTracking(
    areaId: string,
    options?: { navigate?: boolean; fromSwitch?: boolean },
  ) {
    const running = getRunningSession(sessions);
    const nextArea = selectedAreas.find((a) => a.id === areaId);
    const prevArea = running
      ? selectedAreas.find((a) => a.id === running.areaId)
      : null;

    setRebalanceOffer(null);
    setShowSwitchSheet(false);

    void api.sessions
      .start({ targetType: "area", targetId: areaId, areaId })
      .then(({ sessions: serverSessions }) => setSessions(serverSessions))
      .catch(reportApiError);

    if (
      options?.fromSwitch &&
      prevArea &&
      nextArea &&
      prevArea.id !== nextArea.id
    ) {
      setSwitchNotice(`Switched ${prevArea.name} → ${nextArea.name}`);
      globalThis.setTimeout(() => setSwitchNotice(null), 3500);
    }

    if (options?.navigate !== false) {
      setActiveAreaId(areaId);
      setScreen("area");
    } else {
      setScreen("orbit");
    }
  }

  function openSwitchSheet() {
    setRebalanceOffer(null);
    setShowSwitchSheet(true);
  }

  function startTaskTracking(taskId: string) {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;
    setRebalanceOffer(null);

    void api.sessions
      .start({
        targetType: "task",
        targetId: taskId,
        areaId: task.areaId,
      })
      .then(({ sessions: serverSessions }) => setSessions(serverSessions))
      .catch(reportApiError);
  }

  function toggleArea(id: string) {
    setSelectedIds((prev) => {
      const next = prev.includes(id)
        ? prev.filter((x) => x !== id)
        : [...prev, id];
      setWeights((w) => weightsForSelection(areas, next, w));
      setProtectedIds((p) => p.filter((x) => next.includes(x)));
      return next;
    });
  }

  function addCustomArea(area: AreaDef) {
    setAreas((prev) => [...prev, area]);
    setSelectedIds((prev) => {
      const next = [...prev, area.id];
      setWeights((w) =>
        weightsForSelection([...areas, area], next, [
          ...w,
          { id: area.id, hours: area.defaultHours },
        ]),
      );
      return next;
    });
  }

  function addAreaFromLifeMap(area: AreaDef) {
    const nextAreas = [...areas, area];
    const nextSelected = [...selectedIds, area.id];
    const nextWeights = [
      ...weights,
      { id: area.id, hours: area.defaultHours },
    ];
    setAreas(nextAreas);
    setSelectedIds(nextSelected);
    setWeights(nextWeights);
    setScheduleAreaId(area.id);
    setScreen("life-part-schedule");
    void persistAreas({
      areas: nextAreas,
      selectedIds: nextSelected,
      weights: nextWeights,
      protectedIds,
    });
  }

  function changeHours(id: string, hours: number) {
    setWeights((prev) =>
      prev.map((w) => (w.id === id ? { ...w, hours } : w)),
    );
  }

  function toggleProtected(id: string) {
    setProtectedIds((prev) => {
      const next = prev.includes(id)
        ? prev.filter((x) => x !== id)
        : [...prev, id];
      if (onboardingComplete) {
        void persistAreas({
          areas,
          selectedIds,
          weights,
          protectedIds: next,
        });
      }
      return next;
    });
  }

  function closeRightPanel() {
    setRightPanel({ kind: "closed" });
  }

  function handleSelectTask(taskId: string | null) {
    if (taskId === null) closeRightPanel();
    else setRightPanel({ kind: "task", taskId });
  }

  function openArea(areaId: string) {
    setActiveAreaId(areaId);
    setReturnTo("orbit");
    if (onboardingComplete) {
      setMainSection("workspace");
      setWorkspaceView({ type: "area", id: areaId });
      closeRightPanel();
      return;
    }
    setScreen("area");
  }

  function openTask(taskId: string, occurrence?: string) {
    setActiveTaskId(taskId);
    setOccurrenceDate(occurrence ?? todayKey());
    const opensInPanel =
      mainSection === "workspace" ||
      mainSection === "calendar" ||
      mainSection === "life-map";
    if (onboardingComplete && opensInPanel) {
      setRightPanel({ kind: "task", taskId });
      return;
    }
    if (screen === "area") setReturnTo("area");
    else if (screen === "calendar") setReturnTo("calendar");
    else setReturnTo("orbit");
    setScreen("task");
  }

  function openAreaFromBoundary(areaId: string) {
    setScheduleAreaId(areaId);
    setMainSection("life-map");
    setScreen("life-part-schedule");
    closeRightPanel();
  }

  function openTaskFromReminder(taskId: string, dateKey?: string) {
    const occurrence = dateKey ?? todayKey();
    setActiveTaskId(taskId);
    setOccurrenceDate(occurrence);

    if (onboardingComplete) {
      const task = tasks.find((t) => t.id === taskId);
      setMainSection("workspace");
      setScreen("orbit");
      if (occurrence === todayKey()) {
        setWorkspaceView("today");
      } else if (task) {
        setWorkspaceView({ type: "area", id: task.areaId });
      } else {
        setWorkspaceView("all");
      }
      setRightPanel({ kind: "task", taskId });
      return;
    }

    setReturnTo("orbit");
    setScreen("task");
  }

  function confirmCapture(payload: CaptureConfirm) {
    switch (payload.action) {
      case "create_task": {
        const { draft, scheduledDate, scheduledTime, dueDate } = payload;
        void api.tasks
          .create({
            areaId: draft.suggestion.areaId,
            title: draft.suggestion.title,
            notes: draft.suggestion.notes,
            estimateMinutes: draft.suggestion.estimateMinutes,
            scheduledDate,
            scheduledTime,
            dueDate,
            recurrence: draft.recurrence,
            reminder: draft.reminder,
          })
          .then(({ task }) => {
            setTasks((prev) => {
              const duplicate = prev.find(
                (t) =>
                  t.title === task.title &&
                  t.areaId === task.areaId &&
                  t.status === "open",
              );
              if (duplicate) {
                return prev.map((t) => (t.id === duplicate.id ? task : t));
              }
              return [task, ...prev];
            });
            finishCapture(draft.suggestion.areaId);
          })
          .catch(reportApiError);
        break;
      }
      case "create_tasks": {
        void (async () => {
          try {
            const created: Task[] = [];
            for (const item of payload.drafts) {
              const { task } = await api.tasks.create({
                areaId: item.draft.suggestion.areaId,
                title: item.draft.suggestion.title,
                notes: item.draft.suggestion.notes,
                estimateMinutes: item.draft.suggestion.estimateMinutes,
                scheduledDate: item.scheduledDate,
                scheduledTime: item.scheduledTime,
                dueDate: item.dueDate,
                recurrence: item.draft.recurrence,
                reminder: item.draft.reminder,
              });
              created.push(task);
            }
            setTasks((prev) => [...created, ...prev]);
            const lastArea =
              payload.drafts[payload.drafts.length - 1]?.draft.suggestion
                .areaId;
            if (lastArea) finishCapture(lastArea);
          } catch (err) {
            reportApiError(err);
          }
        })();
        break;
      }
      case "schedule_task": {
        const { taskId, scheduledDate } = payload;
        setTasks((prev) =>
          prev.map((t) => (t.id === taskId ? { ...t, scheduledDate } : t)),
        );
        void api.tasks
          .update(taskId, { scheduledDate })
          .then(({ task }) => {
            setTasks((prev) => prev.map((t) => (t.id === taskId ? task : t)));
            finishCapture(task.areaId);
          })
          .catch(reportApiError);
        break;
      }
      case "complete_task": {
        const { taskId, occurrenceDate } = payload;
        const task = tasks.find((t) => t.id === taskId);
        markDone(taskId, occurrenceDate);
        if (task) finishCapture(task.areaId);
        break;
      }
      case "update_task": {
        const { taskId, preview } = payload;
        const updates = {
          title: preview.title,
          areaId: preview.areaId,
          estimateMinutes: preview.estimateMinutes,
          notes: preview.notes ?? null,
          scheduledDate: preview.scheduledDate,
          dueDate: preview.dueDate,
          recurrence: preview.recurrence,
          reminder: preview.reminder,
        };
        setTasks((prev) =>
          prev.map((t) => (t.id === taskId ? { ...t, ...preview } : t)),
        );
        void api.tasks
          .update(taskId, updates)
          .then(({ task }) => {
            setTasks((prev) => prev.map((t) => (t.id === taskId ? task : t)));
            finishCapture(task.areaId);
          })
          .catch(reportApiError);
        break;
      }
      case "delete_task": {
        deleteTaskById(payload.taskId);
        break;
      }
    }
  }

  function finishCapture(areaId: string) {
    setRightPanel({ kind: "closed" });
    setActiveAreaId(areaId);
    if (onboardingComplete) {
      setMainSection("workspace");
      setWorkspaceView({ type: "area", id: areaId });
    } else {
      setScreen("area");
    }
  }

  function confirmManualTask(input: ManualTaskInput) {
    void api.tasks
      .create({
        areaId: input.areaId,
        title: input.title,
        notes: input.notes || undefined,
        estimateMinutes: input.estimateMinutes,
        scheduledDate: input.scheduledDate,
        scheduledTime: input.scheduledTime,
        dueDate: null,
        recurrence: input.recurrence,
        reminder: input.reminder,
      })
      .then(({ task }) => {
        setTasks((prev) => [task, ...prev]);
        setRightPanel({ kind: "closed" });
        setActiveAreaId(input.areaId);
        if (onboardingComplete) {
          setMainSection("workspace");
          setWorkspaceView({ type: "area", id: input.areaId });
        } else {
          setScreen("area");
        }
      })
      .catch(reportApiError);
  }

  function openAddTask() {
    setRebalanceOffer(null);
    setShowSwitchSheet(false);
    setRightPanel({ kind: "add", mode: "ai" });
  }

  function scheduleTask(taskId: string, scheduledDate: string | null) {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    if (!scheduledDate) {
      setTasks((prev) =>
        prev.map((t) =>
          t.id === taskId
            ? { ...t, scheduledDate: null, scheduledTime: null }
            : t,
        ),
      );
      void api.tasks
        .update(taskId, { scheduledDate: null, scheduledTime: null })
        .then(({ task: updated }) =>
          setTasks((prev) => prev.map((t) => (t.id === taskId ? updated : t))),
        )
        .catch(reportApiError);
      return;
    }

    const area = areas.find((a) => a.id === task.areaId);
    if (!area) return;

    const preferredTime =
      task.scheduledTime ??
      resolvePreferredTime({
        title: task.title,
        reminder: task.reminder ?? "none",
        recurrence: task.recurrence,
        scheduledDate,
      });

    const placement = placeTask({
      usualWeek,
      tasks,
      areaId: task.areaId,
      areaName: area.name,
      estimateMinutes: task.estimateMinutes,
      dueDate: task.dueDate,
      mode: "pinned",
      pinnedDate: scheduledDate,
      preferredTime,
      excludeTaskId: taskId,
    });

    const nextDate =
      scheduledDateFromPlacement(placement) ?? scheduledDate;
    const nextTime = scheduledTimeFromPlacement(placement);

    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId
          ? { ...t, scheduledDate: nextDate, scheduledTime: nextTime }
          : t,
      ),
    );
    void api.tasks
      .update(taskId, { scheduledDate: nextDate, scheduledTime: nextTime })
      .then(({ task: updated }) =>
        setTasks((prev) => prev.map((t) => (t.id === taskId ? updated : t))),
      )
      .catch(reportApiError);
  }

  function setRecurrence(taskId: string, recurrence: Recurrence) {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;
    const scheduledDate =
      recurrence !== "none" && !task.scheduledDate
        ? todayKey()
        : (task.scheduledDate ?? null);
    let reminder = task.reminder ?? "none";
    if (recurrence !== "none" && isAbsoluteReminder(reminder)) {
      reminder = absoluteToRelativeReminder(reminder);
    } else if (recurrence === "none" && isRelativeClockReminder(reminder)) {
      reminder = relativeToAbsoluteReminder(
        reminder,
        scheduledDate ?? task.dueDate ?? todayKey(),
      );
    }
    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId ? { ...t, recurrence, scheduledDate, reminder } : t,
      ),
    );
    void api.tasks
      .update(taskId, { recurrence, scheduledDate, reminder })
      .then(({ task: updated }) =>
        setTasks((prev) => prev.map((t) => (t.id === taskId ? updated : t))),
      )
      .catch(reportApiError);
  }

  function setReminder(taskId: string, reminder: Reminder) {
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, reminder } : t)),
    );
    void api.tasks
      .update(taskId, { reminder })
      .then(({ task }) =>
        setTasks((prev) => prev.map((t) => (t.id === taskId ? task : t))),
      )
      .catch(reportApiError);
  }

  function buyTime(taskId: string, option: BuyTimeOption) {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;
    const notes = `Bought time: ${option.title} (${option.costLabel})`;
    const estimateMinutes = Math.max(
      15,
      task.estimateMinutes - option.timeSavedMinutes,
    );
    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId
          ? {
              ...t,
              status: "bought_time" as const,
              estimateMinutes,
              notes,
            }
          : t,
      ),
    );
    void api.tasks
      .update(taskId, {
        status: "bought_time",
        estimateMinutes,
        notes,
      })
      .then(({ task: updated }) =>
        setTasks((prev) => prev.map((t) => (t.id === taskId ? updated : t))),
      )
      .catch(reportApiError);
  }

  function markDone(taskId: string, occurrence?: string) {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id !== taskId) return t;
        if (isRecurring(t) && occurrence) {
          const completedDates = [
            ...(t.completedDates ?? []),
            occurrence,
          ].filter((d, i, arr) => arr.indexOf(d) === i);
          return { ...t, completedDates };
        }
        return { ...t, status: "done" as const };
      }),
    );
    void api.tasks
      .complete(taskId, occurrence)
      .then(({ task }) =>
        setTasks((prev) => prev.map((t) => (t.id === taskId ? task : t))),
      )
      .catch(reportApiError);
  }

  function navigateBackFromTask() {
    if (returnTo === "area" && activeAreaId) setScreen("area");
    else if (returnTo === "calendar") setScreen("calendar");
    else setScreen("orbit");
  }

  function deleteTaskById(taskId: string) {
    const running = getRunningSession(sessions);
    if (running?.targetType === "task" && running.targetId === taskId) {
      stopTracking();
    }
    const removed = tasks.find((t) => t.id === taskId);
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
    setActiveTaskId(null);
    closeRightPanel();
    navigateBackFromTask();
    void api.tasks.delete(taskId).catch((err) => {
      const message = err instanceof Error ? err.message : "";
      const alreadyGone =
        message.includes("Task not found") || message.includes("(404)");
      if (alreadyGone) return;
      reportApiError(err);
      if (removed) {
        setTasks((prev) => [removed, ...prev]);
      }
    });
  }

  function markDoneWithNotice(taskId: string, occurrence?: string) {
    const task = tasks.find((t) => t.id === taskId);
    const area = task
      ? selectedAreas.find((a) => a.id === task.areaId)
      : undefined;
    if (task && area && task.status === "open") {
      const progress = getAreaProgress(
        area,
        usualWeek,
        tasks,
        sessions,
        timeWindow,
      );
      setProgressNotice(formatMarkDoneNotice(task, area, progress, timeWindow));
      globalThis.setTimeout(() => setProgressNotice(null), 4000);
    }
    markDone(taskId, occurrence);
    navigateBackFromTask();
  }

  function handleTimeWindowChange(next: TimeWindow) {
    setTimeWindow(next);
    void api.profile.patch({ timeWindow: next }).catch(reportApiError);
  }

  function handleUsualWeekChange(blocks: UsualWeekBlock[]) {
    const budget = validateUsualWeekBudget(blocks);
    if (!budget.ok) {
      setApiError(usualWeekBudgetErrorMessage(budget.overDays));
      return;
    }
    setUsualWeek(blocks);
    if (onboardingComplete) {
      void api.usualWeek.put(blocks).catch(reportApiError);
    }
  }

  async function handleResetToDefault() {
    await api.profile.reset();
    closeRightPanel();
    setRebalanceOffer(null);
    setShowSwitchSheet(false);
    setScheduleAreaId(null);
    setOnboardingComplete(false);
    setScreen("intent");
    setHydrated(false);
    await reload();
  }

  async function finishOnboarding() {
    const week = createDefaultUsualWeek(selectedAreas);
    setTasks([]);
    setSessions([]);
    setUsualWeek(week);
    setOnboardingComplete(true);
    setScreen("orbit");
    setMainSection("workspace");
    setWorkspaceView("orbit");
    try {
      await Promise.all([
        api.profile.patch({ onboardingComplete: true }),
        api.areas.put({ areas, selectedIds, weights, protectedIds }),
        api.usualWeek.put(week),
      ]);
    } catch (err) {
      reportApiError(err);
    }
  }

  function openAccount(from: "orbit" | "calendar" | "life-map") {
    setAccountBack(from);
    if (onboardingComplete) {
      setMainSection("account");
      return;
    }
    setScreen("account");
  }

  const showOrbitChrome =
    onboardingComplete ||
    screen === "orbit" ||
    screen === "calendar" ||
    screen === "life-map" ||
    screen === "account" ||
    screen === "life-part-schedule" ||
    screen === "area" ||
    screen === "task";

  const scheduleArea =
    selectedAreas.find((a) => a.id === scheduleAreaId) ??
    areas.find((a) => a.id === scheduleAreaId);

  const headerSubtitle = useMemo((): ReactNode | undefined => {
    if (screen !== "life-part-schedule" || !scheduleArea) return undefined;

    const label = areaScheduleLabel(usualWeek, scheduleArea.id, {
      includeWeekTotal: true,
    });
    const isProtected = protectedIds.includes(scheduleArea.id);

    return (
      <span className="flex min-w-0 items-center gap-1.5 truncate text-[15px] lg:text-base">
        <span
          className="h-2.5 w-2.5 shrink-0 rounded-full"
          style={{ backgroundColor: scheduleArea.color }}
        />
        <span className="shrink-0 font-semibold text-app">{scheduleArea.name}</span>
        <span className="min-w-0 truncate text-app-muted">{label}</span>
        {isProtected && (
          <ShieldIcon filled className="shrink-0 text-app-success" />
        )}
      </span>
    );
  }, [screen, scheduleArea, usualWeek, protectedIds]);

  const overlay =
    showOrbitChrome &&
    !onboardingComplete &&
    rightPanel.kind === "add" &&
    rightPanel.mode === "manual" ? (
      <ManualTaskSheet
        areas={selectedAreas}
        usualWeek={usualWeek}
        tasks={tasks}
        protectedIds={protectedIds}
        defaultAreaId={activeAreaId}
        onClose={closeRightPanel}
        onSave={confirmManualTask}
        onOpenCapture={() => setRightPanel({ kind: "add", mode: "ai" })}
      />
    ) : showOrbitChrome &&
      !onboardingComplete &&
      rightPanel.kind === "add" &&
      rightPanel.mode === "ai" ? (
      <CaptureSheet
        areas={selectedAreas}
        usualWeek={usualWeek}
        tasks={tasks}
        protectedIds={protectedIds}
        onClose={closeRightPanel}
        onConfirm={confirmCapture}
        onOpenManual={() => setRightPanel({ kind: "add", mode: "manual" })}
      />
    ) : showOrbitChrome && rebalanceOffer ? (
      <RebalanceSheet
        offer={rebalanceOffer}
        onDismiss={() => setRebalanceOffer(null)}
        onStartArea={(id) => startAreaTracking(id)}
      />
    ) : showOrbitChrome && showSwitchSheet && runningSession ? (
      <SwitchSheet
        fromName={
          selectedAreas.find((a) => a.id === runningSession.areaId)?.name ??
          "current"
        }
        areas={selectedAreas}
        currentAreaId={runningSession.areaId}
        onDismiss={() => setShowSwitchSheet(false)}
        onSwitch={(id) =>
          startAreaTracking(id, {
            navigate: screen !== "orbit",
            fromSwitch: true,
          })
        }
      />
    ) : undefined;

  const statusMessage = apiError;

  function mainPanelTitle(): string {
    if (screen === "life-part-schedule" && scheduleArea) {
      return "";
    }
    if (mainSection === "calendar") return "Calendar";
    if (mainSection === "life-map") return "Life Area";
    if (mainSection === "reminders") return "Reminders";
    if (mainSection === "account") return "Account";
    if (mainSection === "settings") return "Settings";
    if (typeof workspaceView === "object") {
      return (
        selectedAreas.find((a) => a.id === workspaceView.id)?.name ?? "Life area"
      );
    }
    return workspaceViewLabel(workspaceView);
  }

  function renderWorkspaceMain() {
    const areaFromView =
      typeof workspaceView === "object"
        ? selectedAreas.find((a) => a.id === workspaceView.id)
        : activeArea;

    if (typeof workspaceView === "object" && areaFromView) {
      return (
        <AreaDetailScreen
          area={areaFromView}
          usualWeek={usualWeek}
          isProtected={protectedIds.includes(areaFromView.id)}
          tasks={tasks}
          sessions={sessions}
          runningSession={runningSession}
          window={timeWindow}
          onBack={() => setWorkspaceView("orbit")}
          onOpenTask={openTask}
          onCapture={openAddTask}
          onOpenSchedule={() => {
            setScheduleAreaId(areaFromView.id);
            setScheduleBack("area");
            setScreen("life-part-schedule");
          }}
          progressNotice={progressNotice}
          embedded
        />
      );
    }

    if (workspaceView === "orbit") {
      return (
        <LifeOrbitScreen
          areas={selectedAreas}
          usualWeek={usualWeek}
          intents={intents}
          tasks={tasks}
          sessions={sessions}
          runningSession={runningSession}
          window={timeWindow}
          onWindowChange={handleTimeWindowChange}
          onOpenArea={openArea}
          onCapture={openAddTask}
          onOpenCalendar={() => {
            setMainSection("calendar");
            setScreen("calendar");
          }}
          onOpenAccount={() => openAccount("orbit")}
          onOpenTask={openTask}
          onStartTracking={(id) => startAreaTracking(id, { navigate: false })}
          onStopTracking={stopTracking}
          onSwitchTracking={openSwitchSheet}
          switchNotice={switchNotice}
          progressNotice={progressNotice}
          embedded
        />
      );
    }

    return (
      <WorkspaceTaskList
        view={workspaceView}
        tasks={tasks}
        areas={selectedAreas}
        selectedTaskId={selectedTaskIdFromPanel(rightPanel)}
        onSelectTask={handleSelectTask}
      />
    );
  }

  function renderDesktopMain() {
    if (screen === "life-part-schedule" && scheduleArea) {
      return (
        <LifePartScheduleScreen
          area={scheduleArea}
          usualWeek={usualWeek}
          isProtected={protectedIds.includes(scheduleArea.id)}
          onToggleProtected={() => toggleProtected(scheduleArea.id)}
          onChange={handleUsualWeekChange}
          embedded
          onBack={() => {
            setScreen("orbit");
            setMainSection(scheduleBack === "area" ? "workspace" : "life-map");
          }}
        />
      );
    }

    if (mainSection === "calendar") {
      return (
        <CalendarScreen
          areas={selectedAreas}
          usualWeek={usualWeek}
          tasks={tasks}
          onOpenTask={openTask}
          onScheduleTask={scheduleTask}
          onCapture={openAddTask}
          onOpenOrbit={() => {
            setMainSection("workspace");
            setWorkspaceView("orbit");
            setScreen("orbit");
          }}
          onOpenAccount={() => openAccount("calendar")}
          embedded
        />
      );
    }

    if (mainSection === "life-map") {
      return (
        <LifeMapScreen
          areas={selectedAreas}
          usualWeek={usualWeek}
          protectedIds={protectedIds}
          showAdd={lifeAreaAddOpen}
          onShowAddChange={setLifeAreaAddOpen}
          onOpenSchedule={(id) => {
            setScheduleAreaId(id);
            setScheduleBack("life-map");
            setScreen("life-part-schedule");
          }}
          onAddArea={addAreaFromLifeMap}
          onOpenAccount={() => openAccount("life-map")}
          embedded
        />
      );
    }

    if (mainSection === "reminders") {
      return (
        <RemindersScreen
          tasks={tasks}
          areas={selectedAreas}
          usualWeek={usualWeek}
          onOpenTask={openTaskFromReminder}
          onOpenArea={openAreaFromBoundary}
          embedded
        />
      );
    }

    if (mainSection === "account") {
      return <AccountScreen userEmail={user?.email} embedded />;
    }

    if (mainSection === "settings") {
      return (
        <SettingsScreen
          embedded
          onReset={handleResetToDefault}
          onOpenReminders={() => setMainSection("reminders")}
        />
      );
    }

    return renderWorkspaceMain();
  }

  if (authLoading) {
    return (
      <AppShell>
        <div className="flex min-h-[60dvh] items-center justify-center px-6 text-sm text-app-muted">
          Loading…
        </div>
      </AppShell>
    );
  }

  if (!user) {
    return (
      <AppShell>
        <LoginScreen
          mode={authMode}
          loading={authSubmitting}
          error={authFormError}
          onLogin={handleLogin}
          onRegister={handleRegister}
          onToggleMode={() => {
            setAuthFormError(null);
            setAuthMode((m) => (m === "login" ? "register" : "login"));
          }}
        />
      </AppShell>
    );
  }

  if (dataLoading || !hydrated) {
    return (
      <AppShell>
        <div className="flex min-h-[60dvh] items-center justify-center px-6 text-sm text-app-muted">
          Loading your orbit…
        </div>
      </AppShell>
    );
  }

  if (dataError) {
    return (
      <AppShell>
        <div className="flex min-h-[60dvh] flex-col items-center justify-center gap-4 px-6 text-center">
          <p className="text-sm text-app-warning">{dataError}</p>
          <button
            type="button"
            onClick={() => void reload()}
            className="rounded-xl bg-app-chip px-4 py-2 text-sm font-medium text-app"
          >
            Retry
          </button>
        </div>
      </AppShell>
    );
  }

  if (!onboardingComplete) {
    return (
      <AppShell status={statusMessage} overlay={overlay}>
        {screen === "intent" && (
          <IntentScreen
            selected={intents}
            onChange={setIntents}
            onNext={() => {
              setScreen("areas");
              void api.profile.patch({ intents }).catch(reportApiError);
            }}
            onBack={() => setScreen("intent")}
            onSkip={() => {
              setIntents([]);
              setScreen("areas");
              void api.profile.patch({ intents: [] }).catch(reportApiError);
            }}
          />
        )}

        {screen === "areas" && (
          <AreasScreen
            areas={areas}
            selectedIds={selectedIds}
            onToggle={toggleArea}
            onAddCustom={addCustomArea}
            onNext={() => {
              setWeights((w) => weightsForSelection(areas, selectedIds, w));
              setProtectedIds((p) => {
                const defaults = defaultProtectedIds(areas, selectedIds);
                const kept = p.filter((id) => selectedIds.includes(id));
                return Array.from(new Set([...kept, ...defaults]));
              });
              setScreen("weightage");
            }}
            onBack={() => setScreen("intent")}
          />
        )}

        {screen === "weightage" && (
          <WeightageScreen
            areas={selectedAreas}
            weights={activeWeights}
            onChangeHours={changeHours}
            onNext={() => setScreen("review")}
            onBack={() => setScreen("areas")}
          />
        )}

        {screen === "review" && (
          <ReviewScreen
            areas={selectedAreas}
            weights={activeWeights}
            protectedIds={protectedIds}
            onToggleProtected={toggleProtected}
            onEditAreas={() => setScreen("areas")}
            onEditWeights={() => setScreen("weightage")}
            onFinish={() => void finishOnboarding()}
            onBack={() => setScreen("weightage")}
          />
        )}
      </AppShell>
    );
  }

  const showTimeWindowToggle =
    mainSection === "workspace" && workspaceView === "orbit";

  const headerActions =
    showTimeWindowToggle ? (
      <TimeWindowToggle
        value={timeWindow}
        onChange={handleTimeWindowChange}
      />
    ) : mainSection === "life-map" && screen !== "life-part-schedule" ? (
      <button
        type="button"
        onClick={() => setLifeAreaAddOpen(true)}
        className="btn-primary btn-sm whitespace-nowrap"
      >
        + Add life area
      </button>
    ) : undefined;

  const headerBack =
    screen === "life-part-schedule"
      ? () => {
          setScreen("orbit");
          setMainSection(scheduleBack === "area" ? "workspace" : "life-map");
        }
      : undefined;

  return (
    <ReminderAppShell
      tasks={tasks}
      usualWeek={usualWeek}
      areas={selectedAreas}
      setReminder={setReminder}
      onOpenTask={(taskId) => openTaskFromReminder(taskId)}
      onOpenArea={openAreaFromBoundary}
    >
      {(onReminder) => (
    <DesktopShell
      mainSection={mainSection}
      workspaceView={workspaceView}
      areas={selectedAreas}
      tasks={tasks}
      rightPanel={rightPanel}
      usualWeek={usualWeek}
      protectedIds={protectedIds}
      userEmail={user?.email}
      status={statusMessage}
      mainTitle={mainPanelTitle()}
      headerSubtitle={headerSubtitle}
      headerActions={headerActions}
      headerBack={headerBack}
      overlay={overlay}
      defaultAreaId={activeAreaId}
      onNavigate={(section) => {
        setMainSection(section);
        if (section === "workspace") {
          setScreen("orbit");
        } else if (section === "calendar") {
          setScreen("calendar");
        } else if (section === "life-map") {
          setScreen("life-map");
        } else if (section === "reminders") {
          setScreen("orbit");
        }
        closeRightPanel();
      }}
      onWorkspaceView={(view) => {
        setWorkspaceView(view);
        closeRightPanel();
        if (typeof view === "object") {
          setActiveAreaId(view.id);
        }
      }}
      onCapture={openAddTask}
      onAccount={() => openAccount("orbit")}
      onSettings={() => setMainSection("settings")}
      onLogout={() => void handleLogout()}
      onClosePanel={closeRightPanel}
      onSchedule={scheduleTask}
      onRecurrence={setRecurrence}
      onReminder={onReminder}
      onMarkDone={(id) => markDoneWithNotice(id)}
      onDelete={deleteTaskById}
      onConfirmCapture={confirmCapture}
      onSaveManual={confirmManualTask}
      onSwitchAddMode={(mode) => setRightPanel({ kind: "add", mode })}
    >
      {renderDesktopMain()}
    </DesktopShell>
      )}
    </ReminderAppShell>
  );
}
