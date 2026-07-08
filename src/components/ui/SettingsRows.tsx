"use client";

import type { ReactNode } from "react";

export function SettingsSection({
  title,
  children,
  className = "",
  variant = "card",
}: {
  title?: string;
  children: ReactNode;
  className?: string;
  variant?: "card" | "plain";
}) {
  return (
    <section className={className}>
      {title && (
        <h3 className="mb-1 px-1 text-xs font-medium text-app-muted">{title}</h3>
      )}
      <div className={variant === "plain" ? "settings-section-plain" : "settings-group"}>
        {children}
      </div>
    </section>
  );
}

export function SettingsRow({
  label,
  children,
  onClick,
  hint,
}: {
  label: string;
  children?: ReactNode;
  onClick?: () => void;
  hint?: string;
}) {
  const Tag = onClick ? "button" : "div";
  return (
    <Tag
      type={onClick ? "button" : undefined}
      onClick={onClick}
      className={`settings-row ${onClick ? "w-full text-left transition hover:bg-app-card/60" : ""}`}
    >
      <div className="min-w-0 flex-1">
        <span className="text-sm text-app-secondary">{label}</span>
        {hint && <p className="mt-0.5 text-xs text-app-muted">{hint}</p>}
      </div>
      {children != null && (
        <div className="shrink-0 pl-3 text-sm text-app">{children}</div>
      )}
    </Tag>
  );
}

export function SettingsSelect({
  value,
  options,
  onChange,
}: {
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="settings-select"
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}

export function SettingsValue({ children }: { children: ReactNode }) {
  return <span className="text-sm text-app">{children}</span>;
}
