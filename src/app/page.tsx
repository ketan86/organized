"use client";

import { useMemo, useState } from "react";
import { PhoneShell } from "@/components/PhoneShell";
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
import { TaskDetailScreen } from "@/components/screens/TaskDetailScreen";
import { CalendarScreen } from "@/components/screens/CalendarScreen";
import { RebalanceSheet } from "@/components/screens/RebalanceSheet";
import { SwitchSheet } from "@/components/screens/SwitchSheet";
import { AddTaskChooser } from "@/components/screens/AddTaskChooser";
import {
  ManualTaskSheet,
  type ManualTaskInput,
} from "@/components/screens/ManualTaskSheet";
import {
  areaBlocksHours,
  buildRebalanceOffer,
  createInitialAreas,
  createSeedSessions,
  createSeedTasks,
  getRunningSession,
  isRecurring,
  todayKey,
  type AreaDef,
  type BuyTimeOption,
  type DaysPattern,
  type IntentId,
  type RebalanceOffer,
  type Recurrence,
  type Reminder,
  type Session,
  type Task,
  type TimeBlock,
  type TimeWindow,
} from "@/lib/mock-data";

type Screen =
  | "login"
  | "intent"
  | "areas"
  | "weightage"
  | "review"
  | "orbit"
  | "calendar"
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
  const [screen, setScreen] = useState<Screen>("login");
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
  const [tasks, setTasks] = useState<Task[]>(() => createSeedTasks());
  const [sessions, setSessions] = useState<Session[]>(() =>
    createSeedSessions(),
  );
  const [timeWindow, setTimeWindow] = useState<TimeWindow>("today");
  const [activeAreaId, setActiveAreaId] = useState<string | null>(null);
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const [occurrenceDate, setOccurrenceDate] = useState<string | null>(null);
  const [addTaskMode, setAddTaskMode] = useState<
    null | "chooser" | "manual" | "ai"
  >(null);
  const [rebalanceOffer, setRebalanceOffer] = useState<RebalanceOffer | null>(
    null,
  );
  const [showSwitchSheet, setShowSwitchSheet] = useState(false);
  const [switchNotice, setSwitchNotice] = useState<string | null>(null);
  const [returnTo, setReturnTo] = useState<"orbit" | "area" | "calendar">(
    "orbit",
  );

  const selectedAreas = useMemo(
    () => areas.filter((a) => selectedIds.includes(a.id)),
    [areas, selectedIds],
  );

  const activeWeights = weights.filter((w) => selectedIds.includes(w.id));

  const activeArea = selectedAreas.find((a) => a.id === activeAreaId);
  const activeAreaWeight = activeWeights.find((w) => w.id === activeAreaId);
  const activeTask = tasks.find((t) => t.id === activeTaskId);
  const taskArea = activeTask
    ? selectedAreas.find((a) => a.id === activeTask.areaId)
    : undefined;
  const runningSession = getRunningSession(sessions);

  function startOnboarding() {
    setScreen("intent");
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
      activeWeights,
      nextSessions,
      protectedIds,
      now,
    );
    if (offer) setRebalanceOffer(offer);
  }

  function startAreaTracking(
    areaId: string,
    options?: { navigate?: boolean; fromSwitch?: boolean },
  ) {
    const now = Date.now();
    const running = getRunningSession(sessions);
    const nextArea = selectedAreas.find((a) => a.id === areaId);
    const prevArea = running
      ? selectedAreas.find((a) => a.id === running.areaId)
      : null;

    setRebalanceOffer(null);
    setShowSwitchSheet(false);
    setSessions((prev) => [
      ...prev.map((s) =>
        s.endedAt === null ? { ...s, endedAt: now } : s,
      ),
      {
        id: `session-${now}`,
        targetType: "area" as const,
        targetId: areaId,
        areaId,
        startedAt: now,
        endedAt: null,
      },
    ]);

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
    const now = Date.now();
    setRebalanceOffer(null);
    setSessions((prev) => [
      ...prev.map((s) =>
        s.endedAt === null ? { ...s, endedAt: now } : s,
      ),
      {
        id: `session-${now}`,
        targetType: "task" as const,
        targetId: taskId,
        areaId: task.areaId,
        startedAt: now,
        endedAt: null,
      },
    ]);
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

  function changeHours(id: string, hours: number) {
    setWeights((prev) =>
      prev.map((w) => (w.id === id ? { ...w, hours } : w)),
    );
  }

  function updateAreaBlocks(areaId: string, blocks: TimeBlock[]) {
    const hours = areaBlocksHours(blocks);
    setAreas((prev) =>
      prev.map((a) =>
        a.id === areaId
          ? {
              ...a,
              blocks,
              defaultHours: hours > 0 ? hours : a.defaultHours,
            }
          : a,
      ),
    );
    if (hours > 0) {
      setWeights((prev) =>
        prev.map((w) => (w.id === areaId ? { ...w, hours } : w)),
      );
    }
  }

  function updateAreaDaysPattern(areaId: string, daysPattern: DaysPattern) {
    setAreas((prev) =>
      prev.map((a) => (a.id === areaId ? { ...a, daysPattern } : a)),
    );
  }

  function toggleProtected(id: string) {
    setProtectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  function openArea(areaId: string) {
    setActiveAreaId(areaId);
    setReturnTo("orbit");
    setScreen("area");
  }

  function openTask(taskId: string, occurrence?: string) {
    setActiveTaskId(taskId);
    setOccurrenceDate(occurrence ?? todayKey());
    if (screen === "area") setReturnTo("area");
    else if (screen === "calendar") setReturnTo("calendar");
    else setReturnTo("orbit");
    setScreen("task");
  }

  function confirmCapture({
    suggestion,
    scheduledDate,
    dueDate,
  }: CaptureConfirm) {
    const already = tasks.some(
      (t) =>
        t.title === suggestion.title &&
        t.areaId === suggestion.areaId &&
        t.status === "open",
    );
    if (!already) {
      const newTask: Task = {
        id: `task-${Date.now()}`,
        areaId: suggestion.areaId,
        title: suggestion.title,
        notes: suggestion.notes,
        estimateMinutes: suggestion.estimateMinutes,
        status: "open",
        scheduledDate,
        dueDate,
        recurrence: "none",
        reminder: "morning",
        completedDates: [],
      };
      setTasks((prev) => [newTask, ...prev]);
    } else {
      setTasks((prev) =>
        prev.map((t) =>
          t.title === suggestion.title &&
          t.areaId === suggestion.areaId &&
          t.status === "open"
            ? { ...t, scheduledDate, dueDate }
            : t,
        ),
      );
    }
    setAddTaskMode(null);
    setActiveAreaId(suggestion.areaId);
    setScreen("area");
  }

  function confirmManualTask(input: ManualTaskInput) {
    const newTask: Task = {
      id: `task-${Date.now()}`,
      areaId: input.areaId,
      title: input.title,
      notes: input.notes || undefined,
      estimateMinutes: input.estimateMinutes,
      status: "open",
      scheduledDate: input.scheduledDate,
      dueDate: null,
      recurrence: input.recurrence,
      reminder: input.reminder,
      completedDates: [],
    };
    setTasks((prev) => [newTask, ...prev]);
    setAddTaskMode(null);
    setActiveAreaId(input.areaId);
    setScreen("area");
  }

  function openAddTask() {
    setRebalanceOffer(null);
    setShowSwitchSheet(false);
    setAddTaskMode("chooser");
  }

  function scheduleTask(taskId: string, scheduledDate: string | null) {
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, scheduledDate } : t)),
    );
  }

  function setRecurrence(taskId: string, recurrence: Recurrence) {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id !== taskId) return t;
        const scheduledDate =
          recurrence !== "none" && !t.scheduledDate
            ? todayKey()
            : t.scheduledDate;
        return { ...t, recurrence, scheduledDate };
      }),
    );
  }

  function setReminder(taskId: string, reminder: Reminder) {
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, reminder } : t)),
    );
  }

  function buyTime(taskId: string, option: BuyTimeOption) {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId
          ? {
              ...t,
              status: "bought_time" as const,
              estimateMinutes: Math.max(
                15,
                t.estimateMinutes - option.timeSavedMinutes,
              ),
              notes: `Bought time: ${option.title} (${option.costLabel})`,
            }
          : t,
      ),
    );
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
  }

  const showOrbitChrome =
    screen === "orbit" ||
    screen === "calendar" ||
    screen === "area" ||
    screen === "task";

  const overlay =
    showOrbitChrome && addTaskMode === "chooser" ? (
      <AddTaskChooser
        onClose={() => setAddTaskMode(null)}
        onChooseManual={() => setAddTaskMode("manual")}
        onChooseAi={() => setAddTaskMode("ai")}
      />
    ) : showOrbitChrome && addTaskMode === "manual" ? (
      <ManualTaskSheet
        areas={selectedAreas}
        defaultAreaId={activeAreaId}
        onClose={() => setAddTaskMode(null)}
        onSave={confirmManualTask}
      />
    ) : showOrbitChrome && addTaskMode === "ai" ? (
      <CaptureSheet
        areas={selectedAreas}
        weights={activeWeights}
        tasks={tasks}
        onClose={() => setAddTaskMode(null)}
        onConfirm={confirmCapture}
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

  return (
    <PhoneShell overlay={overlay}>
      {screen === "login" && (
        <LoginScreen
          onContinue={startOnboarding}
          onCreateAccount={startOnboarding}
        />
      )}

      {screen === "intent" && (
        <IntentScreen
          selected={intents}
          onChange={setIntents}
          onNext={() => setScreen("areas")}
          onBack={() => setScreen("login")}
          onSkip={() => {
            setIntents([]);
            setScreen("areas");
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
          onFinish={() => {
            setTasks(createSeedTasks());
            setSessions(createSeedSessions());
            setScreen("orbit");
          }}
          onBack={() => setScreen("weightage")}
        />
      )}

      {screen === "orbit" && (
        <LifeOrbitScreen
          areas={selectedAreas}
          weights={activeWeights}
          protectedIds={protectedIds}
          intents={intents}
          tasks={tasks}
          sessions={sessions}
          runningSession={runningSession}
          window={timeWindow}
          onWindowChange={setTimeWindow}
          onOpenArea={openArea}
          onCapture={openAddTask}
          onOpenCalendar={() => setScreen("calendar")}
          onOpenTask={openTask}
          onStopTracking={stopTracking}
          onSwitchTracking={openSwitchSheet}
          switchNotice={switchNotice}
        />
      )}

      {screen === "calendar" && (
        <CalendarScreen
          areas={selectedAreas}
          weights={activeWeights}
          tasks={tasks}
          onOpenTask={openTask}
          onScheduleTask={scheduleTask}
          onCapture={openAddTask}
          onOpenOrbit={() => setScreen("orbit")}
        />
      )}

      {screen === "area" && activeArea && activeAreaWeight && (
        <AreaDetailScreen
          area={activeArea}
          budgetHours={activeAreaWeight.hours}
          isProtected={protectedIds.includes(activeArea.id)}
          tasks={tasks}
          sessions={sessions}
          runningSession={runningSession}
          window={timeWindow}
          onBack={() => setScreen("orbit")}
          onOpenTask={openTask}
          onCapture={openAddTask}
          onUpdateBlocks={updateAreaBlocks}
          onUpdateDaysPattern={updateAreaDaysPattern}
          onStartTracking={(id) => startAreaTracking(id)}
          onStopTracking={stopTracking}
          onSwitchTracking={openSwitchSheet}
        />
      )}

      {screen === "task" && activeTask && taskArea && (
        <TaskDetailScreen
          task={activeTask}
          area={taskArea}
          budgetHours={
            activeWeights.find((w) => w.id === taskArea.id)?.hours ?? 1
          }
          occurrenceDate={occurrenceDate}
          runningSession={runningSession}
          onBack={() => {
            if (returnTo === "area" && activeAreaId) setScreen("area");
            else if (returnTo === "calendar") setScreen("calendar");
            else setScreen("orbit");
          }}
          onSchedule={scheduleTask}
          onRecurrence={setRecurrence}
          onReminder={setReminder}
          onBuyTime={buyTime}
          onStartTracking={startTaskTracking}
          onStopTracking={stopTracking}
          onMarkDone={(id, occ) => {
            markDone(id, occ);
            if (returnTo === "area" && activeAreaId) setScreen("area");
            else if (returnTo === "calendar") setScreen("calendar");
            else setScreen("orbit");
          }}
        />
      )}

    </PhoneShell>
  );
}
