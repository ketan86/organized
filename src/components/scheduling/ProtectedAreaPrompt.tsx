import type { AreaDef } from "@/lib/mock-data";
import type { ProtectedAreaCheck } from "@/lib/scheduling/protected-area";

type FailedCheck = Extract<ProtectedAreaCheck, { ok: false }>;

export function ProtectedAreaPrompt({
  check,
  onSelect,
}: {
  check: FailedCheck;
  onSelect: (option: string) => void;
}) {
  return (
    <div className="rounded-xl border border-app-warning bg-app-warning p-3">
      <p className="text-sm leading-relaxed text-app-warning-soft">{check.question}</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {check.options.map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => onSelect(option)}
            className="btn-chip px-3 py-1.5 text-xs"
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  );
}

export function resolveProtectedAreaOption(
  option: string,
  areas: AreaDef[],
  currentAreaId: string,
): { areaId?: string; keepAnyway: boolean } {
  const currentArea = areas.find((a) => a.id === currentAreaId);
  const keepLabel = `Keep ${currentArea?.name ?? currentAreaId} anyway`;
  if (option === keepLabel) return { keepAnyway: true };
  const matched = areas.find((a) => a.name === option);
  if (matched) return { areaId: matched.id, keepAnyway: false };
  return { keepAnyway: false };
}
