"use client";

type AreaProgressBarProps = {
  progressPct: number;
  color: string;
  goalMet?: boolean;
  overloaded?: boolean;
  size?: "sm" | "md";
  animate?: boolean;
  className?: string;
};

export function AreaProgressBar({
  progressPct,
  color,
  goalMet,
  overloaded,
  size = "sm",
  animate = true,
  className = "",
}: AreaProgressBarProps) {
  const height = size === "sm" ? "h-1.5" : "h-2.5";
  const fillColor = goalMet
    ? "var(--success-text)"
    : overloaded
      ? "#fbbf24"
      : color;

  return (
    <div className={`${height} overflow-hidden rounded-full bg-app-track ${className}`}>
      <div
        className={`progress-bar-fill h-full rounded-full ${
          animate ? "transition-all duration-700 ease-out" : "transition-all"
        }`}
        style={{
          width: `${Math.min(progressPct, 100)}%`,
          backgroundColor: fillColor,
        }}
      />
    </div>
  );
}
