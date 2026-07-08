"use client";

import type { ReactNode } from "react";
import type { AreaDef } from "@/lib/mock-data";
import { workspaceViewKey, workspaceViewLabel, type WorkspaceView } from "./types";

type NavSidebarProps = {
  activeView: WorkspaceView;
  areas: AreaDef[];
  onSelect: (view: WorkspaceView) => void;
  hidden?: boolean;
  embedded?: boolean;
};

const PRIMARY_VIEWS: { view: WorkspaceView; icon: string }[] = [
  { view: "orbit", icon: "◎" },
  { view: "today", icon: "☀" },
  { view: "all", icon: "☰" },
];

function NavRow({
  label,
  icon,
  active,
  onClick,
}: {
  label: string;
  icon?: ReactNode;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm transition ${
        active
          ? "bg-app-chip font-medium text-app"
          : "text-app-secondary hover:bg-app-card hover:text-app"
      }`}
    >
      {icon != null && (
        <span className="flex h-5 w-5 shrink-0 items-center justify-center text-[13px] text-app-muted">
          {icon}
        </span>
      )}
      <span className="min-w-0 flex-1 truncate">{label}</span>
    </button>
  );
}

export function NavSidebar({
  activeView,
  areas,
  onSelect,
  hidden,
  embedded,
}: NavSidebarProps) {
  if (hidden) return null;

  const activeKey = workspaceViewKey(activeView);

  return (
    <aside
      className={
        embedded
          ? "flex min-h-0 flex-1 flex-col overflow-hidden"
          : "hidden h-full min-h-0 w-[220px] shrink-0 flex-col overflow-hidden border-r border-app bg-app-elevated lg:flex"
      }
    >
      <nav className="flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain px-2 py-4">
        <div className="space-y-0.5">
          {PRIMARY_VIEWS.map(({ view, icon }) => {
            const key = workspaceViewKey(view);
            return (
              <NavRow
                key={key}
                label={workspaceViewLabel(view)}
                icon={icon}
                active={activeKey === key}
                onClick={() => onSelect(view)}
              />
            );
          })}
        </div>

        <div className="mt-6 px-3">
          <p className="text-xs font-medium text-app-muted">Life areas</p>
        </div>
        <div className="mt-1 space-y-0.5">
          {areas.map((area) => {
            const view: WorkspaceView = { type: "area", id: area.id };
            const key = workspaceViewKey(view);
            return (
              <NavRow
                key={area.id}
                label={area.name}
                icon={
                  <span
                    className="inline-block h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: area.color }}
                  />
                }
                active={activeKey === key}
                onClick={() => onSelect(view)}
              />
            );
          })}
        </div>

        <div className="mt-auto space-y-0.5 pt-6">
          <NavRow
            label="Completed"
            icon="✓"
            active={activeKey === "completed"}
            onClick={() => onSelect("completed")}
          />
          <NavRow
            label="Trash"
            icon="⌫"
            active={activeKey === "trash"}
            onClick={() => onSelect("trash")}
          />
        </div>
      </nav>
    </aside>
  );
}
