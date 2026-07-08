"use client";

import type { ReactNode } from "react";

type MainPanelProps = {
  title: string;
  toolbar?: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
};

export function MainPanel({ title, toolbar, footer, children }: MainPanelProps) {
  return (
    <section className="flex min-w-0 flex-1 flex-col bg-app">
      <header className="flex shrink-0 items-center gap-3 border-b border-app px-5 py-3.5">
        <h1 className="text-base font-semibold text-app">{title}</h1>
      </header>

      {toolbar && (
        <div className="flex shrink-0 flex-wrap items-center gap-0.5 border-b border-app px-4 py-2">
          {toolbar}
        </div>
      )}

      <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>

      {footer && (
        <footer className="flex shrink-0 items-center justify-end gap-2 border-t border-app px-5 py-2.5">
          {footer}
        </footer>
      )}
    </section>
  );
}

export function ToolbarButton({
  children,
  title,
  active,
  onClick,
}: {
  children: ReactNode;
  title: string;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className={`flex h-8 min-w-8 items-center justify-center rounded-[var(--radius-control)] px-2 text-sm transition ${
        active
          ? "bg-app-chip text-app"
          : "text-app-muted hover:bg-app-card hover:text-app"
      }`}
    >
      {children}
    </button>
  );
}

export function PanelFooterButton({
  children,
  onClick,
}: {
  children: ReactNode;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-1.5 rounded-[var(--radius-control)] px-3 py-1.5 text-xs font-medium text-app-muted transition hover:bg-app-card hover:text-app"
    >
      {children}
    </button>
  );
}
