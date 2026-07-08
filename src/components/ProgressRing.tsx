"use client";

import type { ReactNode } from "react";

type ProgressRingProps = {
  size: number;
  strokeWidth?: number;
  progressPct: number;
  trackColor?: string;
  fillColor: string;
  className?: string;
  children?: ReactNode;
};

export function ProgressRing({
  size,
  strokeWidth = 6,
  progressPct,
  trackColor = "var(--ring-track)",
  fillColor,
  className = "",
  children,
}: ProgressRingProps) {
  const r = (size - strokeWidth) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const circumference = 2 * Math.PI * r;
  const clamped = Math.min(Math.max(progressPct, 0), 100);
  const isComplete = clamped >= 100;
  const offset = circumference * (1 - clamped / 100);

  const strokeProps = {
    cx,
    cy,
    r,
    fill: "none" as const,
    strokeWidth,
    transform: `rotate(-90 ${cx} ${cy})`,
  };

  return (
    <div
      className={`relative inline-flex shrink-0 items-center justify-center ${className}`}
      style={{ width: size, height: size }}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="block overflow-visible"
        aria-hidden={!children}
      >
        <circle
          {...strokeProps}
          stroke={trackColor}
        />
        {clamped > 0 &&
          (isComplete ? (
            <circle {...strokeProps} stroke={fillColor} />
          ) : (
            <circle
              {...strokeProps}
              stroke={fillColor}
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              className="progress-ring-stroke"
            />
          ))}
      </svg>
      {children && (
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center px-2 text-center">
          {children}
        </div>
      )}
    </div>
  );
}
