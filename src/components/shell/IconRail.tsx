"use client";

import type { MainSection } from "./types";

type IconRailItem = {
  id: string;
  label: string;
  icon: React.ReactNode;
  active?: boolean;
  onClick: () => void;
  variant?: "default" | "danger";
};

type IconRailProps = {
  activeSection: MainSection;
  onNavigate: (section: MainSection) => void;
  onCapture: () => void;
  onAccount: () => void;
  onSettings: () => void;
  onLogout: () => void;
  userInitial?: string;
};

function TasksIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <path d="M9 11l3 3L22 4" />
      <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
    </svg>
  );
}

function MapIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <path d="M3 6l6-2 6 2 6-2v14l-6 2-6-2-6 2V6z" />
      <path d="M9 4v14M15 6v14" />
    </svg>
  );
}

function BellIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 01-3.46 0" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c0-4 4-6 8-6s8 2 8 6" />
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
    </svg>
  );
}

function LogOutIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" />
    </svg>
  );
}

function RailButton({ item }: { item: IconRailItem }) {
  const danger = item.variant === "danger";
  return (
    <button
      type="button"
      onClick={item.onClick}
      title={item.label}
      aria-label={item.label}
      className={`flex h-9 w-9 items-center justify-center rounded-[var(--radius-control)] transition ${
        item.active
          ? "bg-app-chip text-app-accent"
          : danger
            ? "text-app-muted hover:bg-red-500/10 hover:text-red-400"
            : "text-app-muted hover:bg-app-card hover:text-app"
      }`}
    >
      {item.icon}
    </button>
  );
}

export function IconRail({
  activeSection,
  onNavigate,
  onCapture,
  onAccount,
  onSettings,
  onLogout,
  userInitial,
}: IconRailProps) {
  const navItems: IconRailItem[] = [
    {
      id: "workspace",
      label: "Tasks",
      icon: <TasksIcon />,
      active: activeSection === "workspace",
      onClick: () => onNavigate("workspace"),
    },
    {
      id: "calendar",
      label: "Calendar",
      icon: <CalendarIcon />,
      active: activeSection === "calendar",
      onClick: () => onNavigate("calendar"),
    },
    {
      id: "life-map",
      label: "Life Area",
      icon: <MapIcon />,
      active: activeSection === "life-map",
      onClick: () => onNavigate("life-map"),
    },
    {
      id: "reminders",
      label: "Reminders",
      icon: <BellIcon />,
      active: activeSection === "reminders",
      onClick: () => onNavigate("reminders"),
    },
    {
      id: "capture",
      label: "Add task",
      icon: <PlusIcon />,
      onClick: onCapture,
    },
  ];

  const bottomItems: IconRailItem[] = [
    {
      id: "settings",
      label: "Settings",
      icon: <SettingsIcon />,
      active: activeSection === "settings",
      onClick: onSettings,
    },
    {
      id: "logout",
      label: "Sign out",
      icon: <LogOutIcon />,
      onClick: onLogout,
      variant: "danger",
    },
  ];

  return (
    <aside className="hidden h-full w-[52px] shrink-0 flex-col items-center border-r border-app bg-app-elevated py-3 lg:flex">
      <button
        type="button"
        onClick={onAccount}
        title="Account"
        aria-label="Account"
        className={`mb-4 flex h-8 w-8 items-center justify-center rounded-[var(--radius-control)] text-xs font-semibold transition ${
          activeSection === "account"
            ? "bg-app-chip text-app-accent ring-2 ring-app-accent/30"
            : "bg-app-chip text-app-secondary hover:text-app"
        }`}
      >
        {userInitial ?? <UserIcon />}
      </button>

      <div className="flex flex-1 flex-col items-center gap-1">
        {navItems.map((item) => (
          <RailButton key={item.id} item={item} />
        ))}
      </div>

      <div className="mt-auto flex flex-col items-center gap-1 pb-1">
        {bottomItems.map((item) => (
          <RailButton key={item.id} item={item} />
        ))}
      </div>
    </aside>
  );
}
