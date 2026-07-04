"use client";

import { useTheme } from "./ThemeProvider";

export function ThemeToggle({
  className = "",
  compact = false,
}: {
  className?: string;
  compact?: boolean;
}) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`flex h-9 items-center justify-center gap-1.5 rounded-full border border-app bg-app-card text-[11px] font-medium text-app-secondary transition active:scale-95 ${
        compact ? "w-9 px-0" : "px-2.5"
      } ${className}`}
      aria-label={isDark ? "Switch to day mode" : "Switch to night mode"}
      title={isDark ? "Day mode" : "Night mode"}
    >
      {isDark ? <SunIcon /> : <MoonIcon />}
      {!compact && <span>{isDark ? "Day" : "Night"}</span>}
    </button>
  );
}

function SunIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M21 14.5A8.5 8.5 0 1110.5 3a7 7 0 0010.5 11.5z" />
    </svg>
  );
}
