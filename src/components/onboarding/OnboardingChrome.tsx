import type { ReactNode } from "react";
import { ThemeToggle } from "@/components/ThemeToggle";

type OnboardingChromeProps = {
  step: number;
  totalSteps: number;
  title: string;
  subtitle?: string;
  onBack?: () => void;
  children: ReactNode;
  footer?: ReactNode;
};

export function OnboardingChrome({
  step,
  totalSteps,
  title,
  subtitle,
  onBack,
  children,
  footer,
}: OnboardingChromeProps) {
  return (
    <div className="flex min-h-full flex-col px-6 pb-8 pt-14 lg:px-0 lg:pt-16">
      <div className="mb-6 flex items-center gap-3">
        {onBack ? (
          <button
            type="button"
            onClick={onBack}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-app bg-app-card text-app-secondary"
            aria-label="Back"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
        ) : (
          <div className="w-9" />
        )}
        <div className="flex flex-1 gap-1.5">
          {Array.from({ length: totalSteps }, (_, i) => (
            <div
              key={i}
              className={`h-1 flex-1 rounded-full transition ${
                i < step ? "bg-violet-400" : i === step - 1 ? "bg-violet-400/80" : "bg-app-chip"
              }`}
            />
          ))}
        </div>
        <div className="flex items-center gap-1.5">
          <ThemeToggle compact />
          <span className="w-7 text-right text-xs text-app-faint">
            {step}/{totalSteps}
          </span>
        </div>
      </div>

      <div className="mb-6">
        <h1 className="text-[1.65rem] font-semibold leading-tight tracking-tight text-app">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-2 text-sm leading-relaxed text-app-muted">
            {subtitle}
          </p>
        )}
      </div>

      <div className="flex flex-1 flex-col">{children}</div>

      {footer && <div className="mt-6 shrink-0">{footer}</div>}
    </div>
  );
}
