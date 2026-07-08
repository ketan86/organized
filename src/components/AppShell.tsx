"use client";

import type { ReactNode } from "react";

type NavItem = {
  id: string;
  label: string;
  icon: string;
  active?: boolean;
  onClick: () => void;
};

type AppShellProps = {
  children: ReactNode;
  overlay?: ReactNode;
  navItems?: NavItem[];
  title?: string;
  status?: ReactNode;
};

export function AppShell({
  children,
  overlay,
  navItems,
  title = "Organized",
  status,
}: AppShellProps) {
  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-app">
      <div className="flex min-h-0 flex-1 w-full overflow-hidden">
        {navItems && navItems.length > 0 && (
          <aside className="hidden w-56 shrink-0 flex-col bg-app-elevated lg:flex">
            <div className="px-5 py-6">
              <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-app-faint">
                Life Orbit
              </p>
              <h1 className="mt-1 text-lg font-semibold text-app">{title}</h1>
            </div>
            <nav className="flex flex-1 flex-col gap-1 px-3">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={item.onClick}
                  className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition ${
                    item.active
                      ? "bg-app-chip text-app"
                      : "text-app-muted hover:bg-app-card hover:text-app"
                  }`}
                >
                  <span className="text-base">{item.icon}</span>
                  {item.label}
                </button>
              ))}
            </nav>
          </aside>
        )}

        <main className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
          {status && (
            <div className="shrink-0 border-b border-app bg-app-card/80 px-4 py-2 text-center text-xs text-app-muted backdrop-blur sm:px-6">
              {status}
            </div>
          )}

          <div className="mx-auto flex min-h-0 w-full flex-1 flex-col overflow-hidden lg:max-w-3xl lg:px-10 xl:max-w-4xl xl:px-12">
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
              {children}
            </div>
          </div>

          {overlay ? (
            <div className="absolute inset-0 z-50 overflow-hidden">{overlay}</div>
          ) : null}
        </main>
      </div>
    </div>
  );
}
