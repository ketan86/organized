"use client";

import { useEffect, useState, type ReactNode } from "react";
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

type MobileShellProps = {
  mainSection: MainSection;
  workspaceView: WorkspaceView;
  areas: AreaDef[];
  tasks: Task[];
  rightPanel: RightPanelMode;
  usualWeek: UsualWeekBlock[];
  protectedIds: string[];
  mainTitle: string;
  headerSubtitle?: ReactNode;
  headerActions?: ReactNode;
  headerBack?: () => void;
  children: ReactNode;
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

function MenuIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  );
}

export function MobileShell({
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
}: MobileShellProps) {
  const [navOpen, setNavOpen] = useState(false);

  const selectedTask =
    rightPanel.kind === "task"
      ? (tasks.find((t) => t.id === rightPanel.taskId) ?? null)
      : null;
  const selectedArea = selectedTask
    ? (areas.find((a) => a.id === selectedTask.areaId) ?? null)
    : null;

  const panelVisible = isRightPanelOpen(rightPanel);

  useEffect(() => {
    setNavOpen(false);
  }, [mainSection, workspaceView]);

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-app-shell lg:hidden">
      <header className="sticky top-0 z-30 flex shrink-0 items-center gap-2 border-b border-app bg-app-elevated px-3 py-2.5 pt-[max(0.625rem,env(safe-area-inset-top))]">
        {headerBack ? (
          <BackButton onClick={headerBack} />
        ) : mainSection === "workspace" ? (
          <button
            type="button"
            onClick={() => setNavOpen(true)}
            className="btn-icon"
            aria-label="Open menu"
          >
            <MenuIcon />
          </button>
        ) : (
          <BackButton
            onClick={() => onNavigate("workspace")}
            label="Back to tasks"
          />
        )}
        <div className="min-w-0 flex-1">
          {mainTitle ? (
            <>
              <h1 className="truncate text-[15px] font-semibold text-app">
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
        {headerActions ? <div className="shrink-0">{headerActions}</div> : null}
      </header>

      <main className="min-h-0 flex-1 overflow-y-auto overscroll-contain pb-24">
        {children}
      </main>

      {!navOpen && !panelVisible && (
        <button
          type="button"
          onClick={onCapture}
          className="fab-float"
          aria-label="Capture"
        >
          +
        </button>
      )}

      <nav className="relative z-30 flex shrink-0 items-stretch border-t border-app bg-app-elevated pb-[max(0.375rem,env(safe-area-inset-bottom))] pt-1">
        <MobileTab
          label="Tasks"
          active={mainSection === "workspace"}
          onClick={() => onNavigate("workspace")}
          icon="☑"
        />
        <MobileTab
          label="Calendar"
          active={mainSection === "calendar"}
          onClick={() => onNavigate("calendar")}
          icon="▦"
        />
        <MobileTab
          label="Life Area"
          active={mainSection === "life-map"}
          onClick={() => onNavigate("life-map")}
          icon="◫"
        />
      </nav>

      {navOpen && (
        <div className="fixed inset-0 z-50 flex">
          <div className="flex h-full w-[min(280px,85vw)] flex-col bg-app-elevated shadow-xl">
            <div className="border-b border-app px-4 py-4">
              <p className="text-xs font-medium uppercase tracking-wider text-app-faint">
                Views
              </p>
            </div>
            <NavSidebar
              activeView={workspaceView}
              areas={areas}
              onSelect={(view) => {
                onWorkspaceView(view);
                setNavOpen(false);
              }}
              embedded
            />
            <div className="mt-auto border-t border-app">
              <button
                type="button"
                onClick={() => {
                  onNavigate("reminders");
                  setNavOpen(false);
                }}
                className="w-full px-4 py-3.5 text-left text-sm text-app-secondary"
              >
                Reminders
              </button>
              <button
                type="button"
                onClick={() => {
                  onSettings();
                  setNavOpen(false);
                }}
                className="w-full border-t border-app px-4 py-3.5 text-left text-sm text-app-secondary"
              >
                Settings
              </button>
              <button
                type="button"
                onClick={() => {
                  onAccount();
                  setNavOpen(false);
                }}
                className="w-full border-t border-app px-4 py-3.5 text-left text-sm text-app-secondary"
              >
                Account
              </button>
              <button
                type="button"
                onClick={() => {
                  onLogout();
                  setNavOpen(false);
                }}
                className="w-full border-t border-app px-4 py-3.5 text-left text-sm text-red-400"
              >
                Sign out
              </button>
            </div>
          </div>
          <button
            type="button"
            className="sheet-backdrop flex-1"
            aria-label="Close menu"
            onClick={() => setNavOpen(false)}
          />
        </div>
      )}

      {panelVisible && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end">
          <button
            type="button"
            className="sheet-backdrop absolute inset-0"
            aria-label="Close panel"
            onClick={onClosePanel}
          />
          <div className="sheet-panel max-h-[90%] min-h-0 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
            <div className="sheet-panel-surface">
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
              embedded
            />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function MobileTab({
  label,
  active,
  onClick,
  icon,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  icon: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-1 flex-col items-center justify-center gap-0.5 py-2 text-[10px] font-medium transition ${
        active ? "text-app-accent" : "text-app-muted"
      }`}
    >
      <span className="text-base leading-none">{icon}</span>
      {label}
    </button>
  );
}
