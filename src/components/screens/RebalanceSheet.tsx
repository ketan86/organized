"use client";

import { formatHours, type RebalanceOffer } from "@/lib/mock-data";

type RebalanceSheetProps = {
  offer: RebalanceOffer;
  onStartArea: (areaId: string) => void;
  onDismiss: () => void;
};

export function RebalanceSheet({
  offer,
  onStartArea,
  onDismiss,
}: RebalanceSheetProps) {
  return (
    <div className="flex h-full w-full flex-col justify-end bg-app-overlay backdrop-blur-[2px]">
      <button
        type="button"
        className="min-h-0 flex-1 cursor-default"
        aria-label="Dismiss"
        onClick={onDismiss}
      />
      <div className="relative z-10 max-h-[85%] overflow-y-auto rounded-t-3xl border border-app bg-app-elevated px-5 pb-8 pt-4">
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-app-chip" />

        <p className="text-[11px] font-medium uppercase tracking-wider text-app-accent-soft">
          Free time
        </p>
        <h2 className="mt-1 text-xl font-semibold text-app">
          {offer.fromAreaName} has time left today
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-app-muted">
          You’re past {offer.fromAreaName}’s planned hours on the clock, with
          about{" "}
          <span className="font-semibold text-app">
            {formatHours(offer.freeHours)}
          </span>{" "}
          still unused vs today’s plan. Put it toward something that still needs
          time?
        </p>

        <div className="mt-5 flex flex-col gap-2">
          {offer.suggestions.map((s) => (
            <button
              key={s.areaId}
              type="button"
              onClick={() => onStartArea(s.areaId)}
              className="flex items-center gap-3 rounded-2xl border border-app bg-app-card px-4 py-3.5 text-left transition active:scale-[0.99]"
            >
              <span
                className="h-3 w-3 shrink-0 rounded-full"
                style={{ backgroundColor: s.color }}
              />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-app">
                  Start {s.name}
                  {s.isProtected ? (
                    <span className="ml-1.5 text-[10px] font-medium text-app-success">
                      protected
                    </span>
                  ) : null}
                </p>
                <p className="mt-0.5 text-xs text-app-muted">
                  {s.shortfallHours > 0.15
                    ? `Still short ~${formatHours(s.shortfallHours)} today`
                    : "Use free time here"}
                </p>
              </div>
              <span className="text-sm font-medium text-app-accent">Start</span>
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={onDismiss}
          className="mt-4 w-full rounded-2xl border border-app py-3.5 text-sm font-medium text-app-secondary"
        >
          Keep free for now
        </button>
      </div>
    </div>
  );
}
