"use client";

import { OnboardingChrome } from "@/components/onboarding/OnboardingChrome";
import { INTENTS, type IntentId } from "@/lib/mock-data";

type IntentScreenProps = {
  selected: IntentId[];
  onChange: (ids: IntentId[]) => void;
  onNext: () => void;
  onBack: () => void;
  onSkip: () => void;
};

export function IntentScreen({
  selected,
  onChange,
  onNext,
  onBack,
  onSkip,
}: IntentScreenProps) {
  function toggle(id: IntentId) {
    if (selected.includes(id)) {
      onChange(selected.filter((x) => x !== id));
    } else {
      onChange([...selected, id]);
    }
  }

  return (
    <OnboardingChrome
      step={1}
      totalSteps={4}
      title="What do you want more of?"
      subtitle="Pick what matters most. We’ll use this when life gets out of balance."
      onBack={onBack}
      footer={
        <div className="flex flex-col gap-3">
          <button
            type="button"
            onClick={onNext}
            className="w-full rounded-2xl bg-gradient-to-r from-violet-500 to-violet-400 py-3.5 text-[15px] font-semibold text-white shadow-lg shadow-violet-500/25 active:scale-[0.98]"
          >
            Continue
          </button>
          <button
            type="button"
            onClick={onSkip}
            className="text-center text-sm text-app-muted"
          >
            Skip for now
          </button>
        </div>
      }
    >
      <div className="flex flex-wrap gap-2.5">
        {INTENTS.map((intent) => {
          const active = selected.includes(intent.id);
          return (
            <button
              key={intent.id}
              type="button"
              onClick={() => toggle(intent.id)}
              className={`rounded-2xl border px-4 py-3 text-left transition active:scale-[0.98] ${
                active
                  ? "border-app-accent bg-app-accent-soft text-app"
                  : "border-app bg-app-card text-app-secondary"
              }`}
            >
              <span className="block text-sm font-medium">{intent.label}</span>
              <span className="mt-0.5 block text-xs text-app-muted">
                {intent.hint}
              </span>
            </button>
          );
        })}
      </div>
    </OnboardingChrome>
  );
}
