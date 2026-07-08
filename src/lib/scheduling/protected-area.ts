import type { AreaDef } from "@/lib/mock-data";

export type ProtectedAreaCheck =
  | { ok: true }
  | {
      ok: false;
      question: string;
      options: string[];
      suggestedAreaId: string;
    };

const ADMIN_KEYWORDS =
  /\b(invoice|claim|bill|form|paperwork|admin|errand|vhs|insurance|reimburse|tax|email|call|phone|submit|file|deadline)\b/i;

const WORK_KEYWORDS =
  /\b(meeting|report|deadline|client|project|slide|deck|quarterly|work|office)\b/i;

const FAMILY_KEYWORDS =
  /\b(family|kids?|child|partner|spouse|parent|mom|dad|school pickup|date night|birthday)\b/i;

const SLEEP_KEYWORDS =
  /\b(sleep|bed|wind down|rest|nap|meditat)\b/i;

function suggestAreaForTitle(
  title: string,
  areas: AreaDef[],
): AreaDef | undefined {
  const t = title.toLowerCase();
  const byId = (id: string) => areas.find((a) => a.id === id);

  if (ADMIN_KEYWORDS.test(t)) return byId("chores") ?? areas[0];
  if (WORK_KEYWORDS.test(t)) return byId("work") ?? areas[0];
  if (FAMILY_KEYWORDS.test(t)) return byId("family") ?? areas[0];
  if (SLEEP_KEYWORDS.test(t)) return byId("sleep") ?? areas[0];

  return byId("personal") ?? byId("chores") ?? areas[0];
}

function mismatchReason(areaId: string, title: string): string | null {
  const t = title.toLowerCase();

  if (areaId === "family") {
    if (ADMIN_KEYWORDS.test(t) && !FAMILY_KEYWORDS.test(t)) {
      return "Family is protected for people time — this looks like an errand or admin task.";
    }
    if (WORK_KEYWORDS.test(t) && !FAMILY_KEYWORDS.test(t)) {
      return "Family is protected for people time — this looks like work.";
    }
  }

  if (areaId === "sleep") {
    if (!SLEEP_KEYWORDS.test(t) && (ADMIN_KEYWORDS.test(t) || WORK_KEYWORDS.test(t))) {
      return "Sleep is protected for rest — this doesn't look like a sleep or wind-down task.";
    }
  }

  return null;
}

export function checkProtectedAreaFit(
  areaId: string,
  title: string,
  areas: AreaDef[],
  protectedIds: string[],
): ProtectedAreaCheck {
  if (!protectedIds.includes(areaId)) return { ok: true };

  const reason = mismatchReason(areaId, title);
  if (!reason) return { ok: true };

  const area = areas.find((a) => a.id === areaId);
  const suggested = suggestAreaForTitle(title, areas);
  if (!suggested || suggested.id === areaId) return { ok: true };

  const options = [
    suggested.name,
    ...areas
      .filter((a) => a.id !== areaId && a.id !== suggested.id)
      .slice(0, 2)
      .map((a) => a.name),
    `Keep ${area?.name ?? areaId} anyway`,
  ];

  return {
    ok: false,
    question: `${reason} Put it in ${suggested.name} instead?`,
    options,
    suggestedAreaId: suggested.id,
  };
}
