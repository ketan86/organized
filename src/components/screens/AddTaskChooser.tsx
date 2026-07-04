"use client";

type AddTaskChooserProps = {
  onChooseManual: () => void;
  onChooseAi: () => void;
  onClose: () => void;
};

export function AddTaskChooser({
  onChooseManual,
  onChooseAi,
  onClose,
}: AddTaskChooserProps) {
  return (
    <div className="flex h-full w-full flex-col justify-end bg-app-overlay backdrop-blur-[2px]">
      <button
        type="button"
        className="min-h-0 flex-1 cursor-default"
        aria-label="Close"
        onClick={onClose}
      />
      <div className="relative z-10 rounded-t-3xl border border-app bg-app-elevated px-5 pb-8 pt-4">
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-app-chip" />

        <h2 className="text-xl font-semibold text-app">Add a task</h2>
        <p className="mt-1 text-sm text-app-muted">
          Set it up yourself, or describe it and let AI sort it.
        </p>

        <div className="mt-5 flex flex-col gap-3">
          <button
            type="button"
            onClick={onChooseManual}
            className="rounded-2xl border border-app bg-app-card px-4 py-4 text-left transition active:scale-[0.99]"
          >
            <p className="text-sm font-semibold text-app">Create manually</p>
            <p className="mt-1 text-xs leading-relaxed text-app-muted">
              Pick the life part, time estimate, schedule, and reminder yourself.
            </p>
          </button>

          <button
            type="button"
            onClick={onChooseAi}
            className="rounded-2xl border border-app-accent bg-app-accent-soft px-4 py-4 text-left transition active:scale-[0.99]"
          >
            <p className="text-sm font-semibold text-app">Ask AI</p>
            <p className="mt-1 text-xs leading-relaxed text-app-muted">
              Describe what’s on your mind in plain language. AI places it and
              estimates time.
            </p>
          </button>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="mt-4 w-full rounded-2xl border border-app py-3.5 text-sm font-medium text-app-secondary"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
