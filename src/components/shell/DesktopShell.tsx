"use client";

import type { ReactNode } from "react";
import { IconRail } from "./IconRail";
import { MobileShell } from "./MobileShell";
import { NavSidebar } from "./NavSidebar";
import { RightPanel } from "./RightPanel";
import { BackButton } from "@/components/ui/BackButton";
import type { AreaDef, Recurrence, Reminder, Task, UsualWeekBlock } from "@/lib/mock-data";
import type { CaptureConfirm } from "@/components/screens/CaptureSheet";
import type { ManualTaskInput } from "@/components/screens/ManualTaskSheet";
import type {
  MainSection,
  RightPanelMode,
  WorkspaceView,
} from "./types";
import { isRightPanelOpen } from "./types";

type DesktopShellProps = {
  mainSection: MainSection;
  workspaceView: WorkspaceView;
  areas: AreaDef[];
  tasks: Task[];
  rightPanel: RightPanelMode;
  usualWeek: UsualWeekBlock[];
  protectedIds: string[];
  userEmail?: string;
  status?: ReactNode;
  mainTitle: string;
  headerSubtitle?: ReactNode;
  headerActions?: ReactNode;
  headerBack?: () => void;
  children: ReactNode;
  overlay?: ReactNode;
  defaultAreaId?: string | null;
  onNavigate: (section: MainSection) => void;
  onWorkspaceView: (view: WorkspaceView) => void;
  onCapture: () => void;
  onAccount: () => void;
  onSettings: () => void;
  onLogout: () => void;
  onClosePanel: () => void;
  onSchedule: (taskId: string, scheduledDate: string | null) => void;
  onRecurrence: (taskId: string, recurrence: Recurrence) => void;
  onReminder: (taskId: string, reminder: Reminder) => void;
  onMarkDone: (taskId: string) => void;
  onDelete: (taskId: string) => void;
  onConfirmCapture: (payload: CaptureConfirm) => void;
  onSaveManual: (input: ManualTaskInput) => void;
  onSwitchAddMode: (mode: "ai" | "manual") => void;
};

export function DesktopShell(props: DesktopShellProps) {
  const {
    mainSection,
    workspaceView,
    areas,
    tasks,
    rightPanel,
    usualWeek,
    protectedIds,
    userEmail,
    status,
    mainTitle,
    headerSubtitle,
    headerActions,
    headerBack,
    children,
    overlay,
    defaultAreaId,
    onNavigate,
    onWorkspaceView,
    onCapture,
    onAccount,
    onSettings,
    onLogout,
    onClosePanel,
    onSchedule,
    onRecurrence,
    onReminder,
    onMarkDone,
    onDelete,
    onConfirmCapture,
    onSaveManual,
    onSwitchAddMode,
  } = props;

  const selectedTask =
    rightPanel.kind === "task"
      ? (tasks.find((t) => t.id === rightPanel.taskId) ?? null)
      : null;
  const selectedArea = selectedTask
    ? (areas.find((a) => a.id === selectedTask.areaId) ?? null)
    : null;
  const userInitial = userEmail?.charAt(0).toUpperCase();
  const panelOpen = isRightPanelOpen(rightPanel);

  const shellProps = {
    mainSection,
    workspaceView,
    areas,
    tasks,
    rightPanel,
    usualWeek,
    protectedIds,
    mainTitle,
    headerSubtitle,
    headerActions,
    headerBack,
    children,
    defaultAreaId,
    onNavigate,
    onWorkspaceView,
    onCapture,
    onAccount,
    onSettings,
    onLogout,
    onClosePanel,
    onSchedule,
    onRecurrence,
    onReminder,
    onMarkDone,
    onDelete,
    onConfirmCapture,
    onSaveManual,
    onSwitchAddMode,
  };

  return (
    <>
      <MobileShell {...shellProps} />

      <div className="hidden h-dvh flex-col overflow-hidden bg-app-shell lg:flex">
        {status && (
          <div className="shrink-0 border-b border-app bg-app-card/80 px-4 py-2 text-center text-xs text-app-muted">
            {status}
          </div>
        )}

        <div className="flex min-h-0 flex-1 overflow-hidden">
          <IconRail
            activeSection={mainSection}
            onNavigate={onNavigate}
            onCapture={onCapture}
            onAccount={onAccount}
            onSettings={onSettings}
            onLogout={onLogout}
            userInitial={userInitial}
          />

          <NavSidebar
            activeView={workspaceView}
            areas={areas}
            onSelect={onWorkspaceView}
            hidden={mainSection !== "workspace"}
          />

          <div className="relative flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
            <div className="flex min-h-0 flex-1 overflow-hidden">
              <section className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-app">
                <header className="flex shrink-0 items-center justify-between gap-3 border-b border-app px-5 py-3.5">
                  <div className="flex min-w-0 flex-1 items-center gap-2">
                    {headerBack ? <BackButton onClick={headerBack} /> : null}
                    <div className="min-w-0 flex-1">
                      {mainTitle ? (
                        <>
                          <h1 className="truncate text-base font-semibold text-app">
                            {mainTitle}
                          </h1>
                          {headerSubtitle ? (
                            <div className="mt-0.5">{headerSubtitle}</div>
                          ) : null}
                        </>
                      ) : (
                        headerSubtitle
                      )}
                    </div>
                  </div>
                  {headerActions ? (
                    <div className="shrink-0">{headerActions}</div>
                  ) : null}
                </header>

                <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
                  {children}
                </div>
              </section>

              {panelOpen && (
                <RightPanel
                  mode={rightPanel}
                  selectedTask={selectedTask}
                  selectedArea={selectedArea}
                  onSchedule={onSchedule}
                  onRecurrence={onRecurrence}
                  onReminder={onReminder}
                  onMarkDone={onMarkDone}
                  onDelete={onDelete}
                  areas={areas}
                  usualWeek={usualWeek}
                  tasks={tasks}
                  protectedIds={protectedIds}
                  defaultAreaId={defaultAreaId}
                  onClose={onClosePanel}
                  onConfirmCapture={onConfirmCapture}
                  onSaveManual={onSaveManual}
                  onSwitchAddMode={onSwitchAddMode}
                />
              )}
            </div>

            {overlay ? (
              <div className="absolute inset-0 z-50 overflow-hidden">{overlay}</div>
            ) : null}
          </div>
        </div>
      </div>

      {overlay ? (
        <div className="fixed inset-0 z-50 overflow-hidden lg:hidden">{overlay}</div>
      ) : null}
    </>
  );
}
