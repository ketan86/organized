"use client";

import type { ReactNode } from "react";

export function PanelHeader({
  title,
  subtitle,
  onClose,
  divider = true,
}: {
  title: string;
  subtitle?: string;
  onClose: () => void;
  divider?: boolean;
}) {
  return (
    <div
      className={`flex shrink-0 items-start justify-between gap-2 bg-app-elevated px-5 py-4 ${divider ? "border-b border-app" : ""}`}
    >
      <div className="min-w-0">
        <h2 className="text-sm font-semibold text-app">{title}</h2>
        {subtitle && (
          <p className="mt-0.5 text-xs text-app-muted">{subtitle}</p>
        )}
      </div>
      <button
        type="button"
        onClick={onClose}
        className="btn-icon shrink-0"
        aria-label="Close panel"
      >
        ×
      </button>
    </div>
  );
}

export function PanelBody({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4 ${className}`}>
      {children}
    </div>
  );
}

export function PanelFooter({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`flex shrink-0 gap-2 border-t border-app px-4 py-3.5 ${className}`}
    >
      {children}
    </div>
  );
}
