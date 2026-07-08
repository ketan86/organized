"use client";

import { useCallback, type ReactNode } from "react";
import { NotificationsProvider, useNotifications } from "@/contexts/NotificationsContext";
import { ReminderEnablePrompt } from "@/components/notifications/ReminderEnablePrompt";
import { ReminderToastStack } from "@/components/notifications/ReminderToastStack";
import type { AreaDef, Reminder, Task, UsualWeekBlock } from "@/lib/mock-data";

type ReminderAppShellProps = {
  tasks: Task[];
  usualWeek: UsualWeekBlock[];
  areas: AreaDef[];
  setReminder: (taskId: string, reminder: Reminder) => void;
  onOpenTask?: (taskId: string) => void;
  onOpenArea?: (areaId: string) => void;
  children: (onReminder: (taskId: string, reminder: Reminder) => void) => ReactNode;
};

function ReminderHandlerBridge({
  setReminder,
  children,
}: {
  setReminder: (taskId: string, reminder: Reminder) => void;
  children: (onReminder: (taskId: string, reminder: Reminder) => void) => ReactNode;
}) {
  const { promptEnableAfterReminder } = useNotifications();
  const onReminder = useCallback(
    (taskId: string, reminder: Reminder) => {
      setReminder(taskId, reminder);
      promptEnableAfterReminder(reminder);
    },
    [setReminder, promptEnableAfterReminder],
  );
  return <>{children(onReminder)}</>;
}

export function ReminderAppShell({
  tasks,
  usualWeek,
  areas,
  setReminder,
  onOpenTask,
  onOpenArea,
  children,
}: ReminderAppShellProps) {
  return (
    <NotificationsProvider
      tasks={tasks}
      usualWeek={usualWeek}
      areas={areas}
      enabled
    >
      <ReminderToastStack onOpenTask={onOpenTask} onOpenArea={onOpenArea} />
      <ReminderEnablePrompt />
      <ReminderHandlerBridge setReminder={setReminder}>
        {children}
      </ReminderHandlerBridge>
    </NotificationsProvider>
  );
}
