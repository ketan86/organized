"use client";

import type { ReactNode } from "react";

type SheetProps = {
  children: ReactNode;
  onClose: () => void;
  className?: string;
  maxHeight?: string;
};

export function Sheet({
  children,
  onClose,
  className = "",
  maxHeight = "max-h-[90%]",
}: SheetProps) {
  return (
    <div className="sheet-root flex h-full w-full flex-col justify-end md:items-center md:justify-center md:p-6">
      <button
        type="button"
        className="sheet-backdrop absolute inset-0 cursor-default"
        aria-label="Close"
        onClick={onClose}
      />
      <div className={`sheet-panel ${maxHeight} ${className} md:max-w-lg`}>
        <div className="sheet-panel-surface">
          <div className="sheet-handle" />
          {children}
        </div>
      </div>
    </div>
  );
}

export function SheetHeader({
  title,
  subtitle,
  eyebrow,
}: {
  title: string;
  subtitle?: React.ReactNode;
  eyebrow?: string;
}) {
  return (
    <div className="px-5 pt-1">
      {eyebrow && (
        <p className="text-[11px] font-medium uppercase tracking-wider text-app-accent-soft">
          {eyebrow}
        </p>
      )}
      <h2 className={`font-semibold text-app ${eyebrow ? "mt-1 text-xl" : "text-lg"}`}>
        {title}
      </h2>
      {subtitle && (
        <p className="mt-1 text-sm leading-relaxed text-app-muted">{subtitle}</p>
      )}
    </div>
  );
}

export function SheetBody({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`flex-1 overflow-y-auto px-5 py-4 ${className}`}>
      {children}
    </div>
  );
}

export function SheetFooter({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`flex shrink-0 gap-2 border-t border-app bg-app-elevated px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] ${className}`}
    >
      {children}
    </div>
  );
}
