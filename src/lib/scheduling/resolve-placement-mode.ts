import { addDays, parseAbsoluteReminder, todayKey, type Reminder } from "@/lib/mock-data";
import type { PlacementMode } from "@/lib/scheduling/placement";
import type { TaskDraft } from "@/server/ai/schemas";

export function resolvePlacementMode(
  draft: TaskDraft,
  reminder: Reminder,
): { mode: PlacementMode; pinnedDate: string | null } {
  if (draft.pinnedDate) {
    return { mode: "pinned", pinnedDate: draft.pinnedDate };
  }

  const absolute = parseAbsoluteReminder(reminder);
  if (absolute) {
    return { mode: "pinned", pinnedDate: absolute.dateKey };
  }

  const today = todayKey();
  if (draft.defaultSchedule === "tomorrow") {
    return { mode: "pinned", pinnedDate: addDays(today, 1) };
  }
  if (draft.defaultSchedule === "due" && draft.dueDate) {
    return { mode: "pinned", pinnedDate: draft.dueDate };
  }
  if (draft.defaultSchedule === "today") {
    return { mode: "pinned", pinnedDate: today };
  }

  return { mode: "auto", pinnedDate: null };
}
