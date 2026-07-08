"use client";

import { formatHours, type RebalanceOffer } from "@/lib/mock-data";
import { Sheet, SheetBody, SheetHeader } from "@/components/ui/Sheet";

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
    <Sheet onClose={onDismiss}>
      <SheetHeader
        eyebrow="Free time"
        title={`${offer.fromAreaName} has time left today`}
        subtitle={
          <>
            You’re past {offer.fromAreaName}’s planned hours on the clock, with
            about{" "}
            <span className="font-semibold text-app">
              {formatHours(offer.freeHours)}
            </span>{" "}
            still unused vs today’s plan. Put it toward something that still needs
            time?
          </>
        }
      />

      <SheetBody className="space-y-2 pt-2">
        {offer.suggestions.map((s) => (
          <button
            key={s.areaId}
            type="button"
            onClick={() => onStartArea(s.areaId)}
            className="card-app flex w-full items-center gap-3 px-4 py-3.5 text-left transition active:scale-[0.99]"
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

        <button
          type="button"
          onClick={onDismiss}
          className="btn-secondary btn-lg mt-2 w-full"
        >
          Keep free for now
        </button>
      </SheetBody>
    </Sheet>
  );
}
