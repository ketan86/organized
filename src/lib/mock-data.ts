export type IntentId =
  | "family"
  | "rest"
  | "focus"
  | "health"
  | "freedom";

export type AreaId = string;

/** Clock times as HH:mm. If end <= start, block spans midnight (e.g. sleep). */
export type TimeBlock = {
  id: string;
  start: string;
  end: string;
};

/** Which days this life part normally has planned time */
export type DaysPattern = "everyday" | "weekdays" | "weekends";

export type AreaDef = {
  id: AreaId;
  name: string;
  color: string;
  defaultHours: number;
  defaultSelected: boolean;
  defaultProtected: boolean;
  /** Daily start/stop windows (gaps = pause, e.g. lunch) */
  blocks: TimeBlock[];
  /** Weekdays / weekends / every day */
  daysPattern: DaysPattern;
  isCustom?: boolean;
};

export type TaskStatus = "open" | "done" | "delegated" | "bought_time";

export type Recurrence = "none" | "daily" | "weekdays" | "weekly";

/** none | morning | evening | HH:mm (24h) */
export type Reminder = "none" | "morning" | "evening" | string;

/** YYYY-MM-DD. null scheduledDate = week backlog (not on today's plate). */
export type Task = {
  id: string;
  areaId: AreaId;
  title: string;
  notes?: string;
  estimateMinutes: number;
  status: TaskStatus;
  /** When the hours count against the life-area budget (anchor for recurring) */
  scheduledDate: string | null;
  /** HH:mm:ss — when the task is planned within the life-area window */
  scheduledTime: string | null;
  /** Deadline — does not consume budget by itself */
  dueDate: string | null;
  recurrence: Recurrence;
  reminder: Reminder;
  /** Completed occurrence dates for recurring tasks */
  completedDates?: string[];
  /** Future: Google Calendar event id when synced */
  googleEventId?: string | null;
};

/** Live / completed time tracking for plan-vs-actual analysis */
export type Session = {
  id: string;
  targetType: "area" | "task";
  targetId: string;
  /** Parent life area (same as targetId when tracking an area) */
  areaId: AreaId;
  startedAt: number;
  endedAt: number | null;
};

export type PlanActualRow = {
  areaId: AreaId;
  plannedHours: number;
  actualHours: number;
  deltaHours: number;
};

export type RebalanceSuggestion = {
  areaId: AreaId;
  name: string;
  color: string;
  shortfallHours: number;
  isProtected: boolean;
};

/** Shown when user stops early and has free time vs today's plan */
export type RebalanceOffer = {
  fromAreaId: AreaId;
  fromAreaName: string;
  freeHours: number;
  suggestions: RebalanceSuggestion[];
};

export type PlanStep = {
  title: string;
  estimateMinutes: number;
  detail?: string;
};

export type BuyTimeOption = {
  id: string;
  title: string;
  costLabel: string;
  timeSavedMinutes: number;
  description: string;
};

export type ScheduleChoice = "today" | "tomorrow" | "due" | "backlog";

export type CaptureSuggestion = {
  title: string;
  areaId: AreaId;
  estimateMinutes: number;
  notes: string;
  planSteps: PlanStep[];
  buyTimeOptions: BuyTimeOption[];
  dueInDays: number | null;
  defaultSchedule: ScheduleChoice;
};

export const INTENTS: { id: IntentId; label: string; hint: string }[] = [
  { id: "family", label: "Family", hint: "People you love" },
  { id: "rest", label: "Rest", hint: "Sleep & recovery" },
  { id: "focus", label: "Focus", hint: "Deep work" },
  { id: "health", label: "Health", hint: "Body & mind" },
  { id: "freedom", label: "Freedom", hint: "Time that is yours" },
];

function block(id: string, start: string, end: string): TimeBlock {
  return { id, start, end };
}

export const PREDEFINED_AREAS: AreaDef[] = [
  {
    id: "work",
    name: "Work",
    color: "#8b7cf6",
    defaultHours: 6.5,
    defaultSelected: true,
    defaultProtected: false,
    daysPattern: "weekdays",
    // 9–12, pause for lunch, 12:30–4
    blocks: [
      block("work-am", "09:00", "12:00"),
      block("work-pm", "12:30", "16:00"),
    ],
  },
  {
    id: "family",
    name: "Family",
    color: "#2dd4bf",
    defaultHours: 3,
    defaultSelected: true,
    defaultProtected: true,
    daysPattern: "everyday",
    blocks: [block("family-eve", "18:00", "21:00")],
  },
  {
    id: "sleep",
    name: "Sleep",
    color: "#3b82f6",
    defaultHours: 8,
    defaultSelected: true,
    defaultProtected: true,
    daysPattern: "everyday",
    // Start sleep → wake (overnight)
    blocks: [block("sleep-night", "22:00", "06:00")],
  },
  {
    id: "health",
    name: "Health",
    color: "#34d399",
    defaultHours: 1,
    defaultSelected: false,
    defaultProtected: false,
    daysPattern: "weekdays",
    blocks: [block("health-am", "06:30", "07:30")],
  },
  {
    id: "chores",
    name: "Chores",
    color: "#fbbf24",
    defaultHours: 1,
    defaultSelected: true,
    defaultProtected: false,
    daysPattern: "weekdays",
    blocks: [block("chores-eve", "16:30", "17:30")],
  },
  {
    id: "cooking",
    name: "Cooking",
    color: "#fb923c",
    defaultHours: 1.5,
    defaultSelected: false,
    defaultProtected: false,
    daysPattern: "everyday",
    blocks: [
      block("cook-lunch", "12:00", "12:30"),
      block("cook-dinner", "17:30", "18:30"),
    ],
  },
  {
    id: "personal",
    name: "Personal",
    color: "#f472b6",
    defaultHours: 1.5,
    defaultSelected: true,
    defaultProtected: false,
    daysPattern: "everyday",
    blocks: [block("personal-eve", "21:00", "22:00")],
  },
  {
    id: "learning",
    name: "Learning",
    color: "#38bdf8",
    defaultHours: 3,
    defaultSelected: true,
    defaultProtected: false,
    // Dedicated weekend time (e.g. side project / courses)
    daysPattern: "weekends",
    blocks: [block("learn-weekend", "09:00", "12:00")],
  },
];

export const CUSTOM_AREA_COLORS = [
  "#c084fc",
  "#67e8f9",
  "#fcd34d",
  "#86efac",
  "#fda4af",
  "#a5b4fc",
];

export const DAY_HOURS = 24;

export function toDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function todayKey(): string {
  return toDateKey(new Date());
}

export function parseDateKey(key: string): Date {
  return new Date(`${key}T12:00:00`);
}

export function addDays(key: string, days: number): string {
  const d = parseDateKey(key);
  d.setDate(d.getDate() + days);
  return toDateKey(d);
}

export function formatDateLabel(key: string): string {
  const today = todayKey();
  if (key === today) return "Today";
  if (key === addDays(today, 1)) return "Tomorrow";
  return parseDateKey(key).toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

/** Monday-start week containing `key` */
export function weekRange(key: string): { start: string; end: string } {
  const d = parseDateKey(key);
  const day = d.getDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  const start = addDays(key, mondayOffset);
  const end = addDays(start, 6);
  return { start, end };
}

export function isInCurrentWeek(key: string): boolean {
  const { start, end } = weekRange(todayKey());
  return key >= start && key <= end;
}

export function scheduleOptions(): { key: string | null; label: string }[] {
  const today = todayKey();
  const options: { key: string | null; label: string }[] = [
    { key: today, label: "Today" },
    { key: addDays(today, 1), label: "Tomorrow" },
  ];
  for (let i = 2; i <= 6; i++) {
    const key = addDays(today, i);
    options.push({ key, label: formatDateLabel(key) });
  }
  options.push({ key: null, label: "Backlog" });
  return options;
}

export function resolveScheduleChoice(
  choice: ScheduleChoice,
  dueDate: string | null,
): string | null {
  const today = todayKey();
  if (choice === "today") return today;
  if (choice === "tomorrow") return addDays(today, 1);
  if (choice === "due") return dueDate ?? today;
  return null;
}

export function scheduleChoiceForDateKey(dateKey: string): ScheduleChoice {
  const today = todayKey();
  if (dateKey === today) return "today";
  if (dateKey === addDays(today, 1)) return "tomorrow";
  return "due";
}

/** Reminder nudges with no work duration — excluded from life-area time budget. */
export function isReminderOnlyTask(
  estimateMinutes: number,
  reminder: Reminder,
): boolean {
  return estimateMinutes === 0 && reminder !== "none";
}

export type InferredReminder = {
  reminder: Reminder;
  defaultSchedule: ScheduleChoice;
};

/** Parse "remind me tomorrow at 5pm" style phrases when the model omits reminder. */
export function inferReminderFromText(
  text: string,
  today: string = todayKey(),
): InferredReminder | null {
  const t = text.toLowerCase();

  const patterns: Array<[RegExp, number]> = [
    [
      /\bremind(?:\s+me)?\s+(?:on\s+)?tomorrow(?:\s+at)?\s*(\d{1,2})(?::(\d{2}))?\s*(am|pm)?\b/,
      1,
    ],
    [/\btomorrow(?:\s+at)?\s*(\d{1,2})(?::(\d{2}))?\s*(am|pm)\b/, 1],
    [/\bat\s+(\d{1,2})(?::(\d{2}))?\s*(am|pm)\s+tomorrow\b/, 1],
    [/\b(\d{1,2})(?::(\d{2}))?\s*(am|pm)\s+tomorrow\b/, 1],
    [
      /\bremind(?:\s+me)?\s+(?:on\s+)?today(?:\s+at)?\s*(\d{1,2})(?::(\d{2}))?\s*(am|pm)?\b/,
      0,
    ],
    [/\btoday(?:\s+at)?\s*(\d{1,2})(?::(\d{2}))?\s*(am|pm)\b/, 0],
  ];

  for (const [regex, dayOffset] of patterns) {
    const match = t.match(regex);
    if (!match) continue;
    const time = clockFromCaptureMatch(match[1], match[2], match[3]);
    if (!time) continue;
    const dateKey = addDays(today, dayOffset);
    return {
      reminder: buildAbsoluteReminder(dateKey, time),
      defaultSchedule:
        dayOffset === 1 ? "tomorrow" : dayOffset === 0 ? "today" : "due",
    };
  }

  return null;
}

function clockFromCaptureMatch(
  hourStr: string,
  minuteStr?: string,
  ampm?: string,
): string | null {
  let hours = parseInt(hourStr, 10);
  if (Number.isNaN(hours) || hours < 0 || hours > 23) return null;
  const minutes = minuteStr ? parseInt(minuteStr, 10) : 0;
  if (ampm === "pm" && hours < 12) hours += 12;
  if (ampm === "am" && hours === 12) hours = 0;
  if (!ampm && hours >= 1 && hours <= 11) hours += 12;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:00`;
}

/** Parse clock time from free text, e.g. "3pm yoga" → 15:00:00 */
export function inferTimeFromText(text: string): string | null {
  const t = text.toLowerCase();
  const patterns: RegExp[] = [
    /\b(?:at\s+)?(\d{1,2})(?::(\d{2}))?\s*(am|pm)\b/,
    /\b(\d{1,2}):(\d{2})\s*(am|pm)\b/,
  ];

  for (const regex of patterns) {
    const match = t.match(regex);
    if (!match) continue;
    const time = clockFromCaptureMatch(match[1], match[2], match[3]);
    if (time) return normalizeTimeWithSeconds(time);
  }
  return null;
}

export function resolvePreferredTime(input: {
  title?: string;
  reminder: Reminder;
  recurrence: Recurrence;
  scheduledDate?: string | null;
}): string | null {
  const absolute = parseAbsoluteReminder(input.reminder);
  if (absolute) {
    if (!input.scheduledDate || absolute.dateKey === input.scheduledDate) {
      return normalizeTimeWithSeconds(absolute.time);
    }
  }

  const clock = reminderClockTime(input.reminder);
  if (clock) {
    return normalizeTimeWithSeconds(
      `${String(clock.hours).padStart(2, "0")}:${String(clock.minutes).padStart(2, "0")}`,
    );
  }

  return inferTimeFromText(input.title ?? "");
}

/** Stub AI capture — builds a suggestion from free text until real AI is wired. */
export function buildCaptureSuggestionFromText(
  text: string,
  areas: AreaDef[],
): CaptureSuggestion {
  const trimmed = text.trim();
  const title =
    trimmed.length > 72 ? `${trimmed.slice(0, 69)}…` : trimmed || "New task";
  const fallbackArea = areas[0]?.id ?? "chores";
  return {
    title,
    areaId: fallbackArea,
    estimateMinutes: 60,
    notes: trimmed,
    planSteps: [
      {
        title: "Break it down and do the first step",
        estimateMinutes: 30,
      },
      {
        title: "Finish and follow up if needed",
        estimateMinutes: 30,
      },
    ],
    buyTimeOptions: [],
    dueInDays: null,
    defaultSchedule: "today",
  };
}

export function createInitialAreas(): AreaDef[] {
  return PREDEFINED_AREAS.map((a) => ({
    ...a,
    blocks: a.blocks.map((b) => ({ ...b })),
  }));
}

/** One block on the repeating “usual week” template (0 = Sun … 6 = Sat). */
export type UsualWeekBlock = {
  id: string;
  areaId: AreaId;
  dayOfWeek: number;
  start: string;
  end: string;
};

/** Mon → Sun order for UI */
export const WEEK_DAY_ORDER = [1, 2, 3, 4, 5, 6, 0] as const;

export const WEEK_DAY_LABELS: Record<number, string> = {
  0: "Sun",
  1: "Mon",
  2: "Tue",
  3: "Wed",
  4: "Thu",
  5: "Fri",
  6: "Sat",
};

function daysForPattern(pattern: DaysPattern): number[] {
  if (pattern === "weekdays") return [1, 2, 3, 4, 5];
  if (pattern === "weekends") return [0, 6];
  return [0, 1, 2, 3, 4, 5, 6];
}

/** Build the editable week template from life-part defaults (once). */
export function createDefaultUsualWeek(areas?: AreaDef[]): UsualWeekBlock[] {
  const source = areas ?? createInitialAreas();
  const blocks: UsualWeekBlock[] = [];
  for (const area of source) {
    const days = daysForPattern(area.daysPattern ?? "everyday");
    for (const dayOfWeek of days) {
      for (const b of area.blocks ?? []) {
        blocks.push({
          id: `${area.id}-d${dayOfWeek}-${b.start}-${b.end}`,
          areaId: area.id,
          dayOfWeek,
          start: b.start,
          end: b.end,
        });
      }
    }
  }
  return blocks;
}

export function blocksOnDate(
  usualWeek: UsualWeekBlock[],
  dateKey: string,
  areaId?: string,
): UsualWeekBlock[] {
  const dow = parseDateKey(dateKey).getDay();
  return usualWeek.filter(
    (b) => b.dayOfWeek === dow && (areaId == null || b.areaId === areaId),
  );
}

export function areaHasPlanOnDate(
  usualWeek: UsualWeekBlock[],
  areaId: string,
  dateKey: string,
): boolean {
  return blocksOnDate(usualWeek, dateKey, areaId).length > 0;
}

/** Planned hours from the usual-week template (not abstract day rules). */
export function plannedHoursForArea(
  usualWeek: UsualWeekBlock[],
  areaId: string,
  window: TimeWindow,
  dateKey: string = todayKey(),
): number {
  if (window === "today") {
    return blocksOnDate(usualWeek, dateKey, areaId).reduce(
      (sum, b) => sum + blockDurationHours(b),
      0,
    );
  }
  const { start, end } = weekRange(dateKey);
  let total = 0;
  for (let d = start; d <= end; d = addDays(d, 1)) {
    total += blocksOnDate(usualWeek, d, areaId).reduce(
      (sum, b) => sum + blockDurationHours(b),
      0,
    );
  }
  return total;
}

export const HOURS_PER_DAY = 24;

/** Sum of all life-area blocks on a given day of week (0 = Sun … 6 = Sat). */
export function plannedHoursOnDay(
  usualWeek: UsualWeekBlock[],
  dayOfWeek: number,
): number {
  return usualWeek
    .filter((b) => b.dayOfWeek === dayOfWeek)
    .reduce((sum, b) => sum + blockDurationHours(b), 0);
}

/** Share of a 24-hour day (0–100+). */
export function dayAllocationPct(hours: number): number {
  return Math.round((hours / HOURS_PER_DAY) * 100);
}

export type DayBudgetStatus = {
  dayOfWeek: number;
  hours: number;
  pct: number;
  over: boolean;
};

export function getDayBudgetStatuses(
  usualWeek: UsualWeekBlock[],
): DayBudgetStatus[] {
  return WEEK_DAY_ORDER.map((dayOfWeek) => {
    const hours = plannedHoursOnDay(usualWeek, dayOfWeek);
    return {
      dayOfWeek,
      hours,
      pct: dayAllocationPct(hours),
      over: hours > HOURS_PER_DAY + 0.001,
    };
  });
}

export function averageDailyHoursForArea(
  usualWeek: UsualWeekBlock[],
  areaId: string,
): number {
  const total = WEEK_DAY_ORDER.reduce<number>((sum, dow) => {
    return (
      sum +
      usualWeek
        .filter((b) => b.areaId === areaId && b.dayOfWeek === dow)
        .reduce((s, b) => s + blockDurationHours(b), 0)
    );
  }, 0);
  return total / 7;
}

function hoursNearlyEqual(a: number, b: number): boolean {
  return Math.abs(a - b) < 0.01;
}

function plannedHoursByDayForArea(
  usualWeek: UsualWeekBlock[],
  areaId: string,
): Record<number, number> {
  const byDay: Record<number, number> = {};
  for (let dow = 0; dow <= 6; dow++) {
    byDay[dow] = usualWeek
      .filter((b) => b.areaId === areaId && b.dayOfWeek === dow)
      .reduce((s, b) => s + blockDurationHours(b), 0);
  }
  return byDay;
}

/** Mon → Sun display order for day-range labels. */
const MON_SUN_ORDER = [1, 2, 3, 4, 5, 6, 0] as const;

function formatActiveDayRange(activeDays: number[]): string {
  if (activeDays.length === 7) return "every day";
  const set = new Set(activeDays);
  if (
    activeDays.length === 5 &&
    MON_SUN_ORDER.slice(0, 5).every((d) => set.has(d))
  ) {
    return "Mon–Fri";
  }
  if (activeDays.length === 2 && set.has(0) && set.has(6)) {
    return "Sat–Sun";
  }

  const ordered = MON_SUN_ORDER.filter((d) => set.has(d));
  if (ordered.length === 1) return WEEK_DAY_LABELS[ordered[0]];

  const runs: { start: number; end: number }[] = [];
  let runStart = ordered[0];
  let runEnd = ordered[0];
  for (let i = 1; i < ordered.length; i++) {
    const prevIdx = MON_SUN_ORDER.indexOf(ordered[i - 1]);
    const currIdx = MON_SUN_ORDER.indexOf(ordered[i]);
    if (currIdx === prevIdx + 1) {
      runEnd = ordered[i];
    } else {
      runs.push({ start: runStart, end: runEnd });
      runStart = ordered[i];
      runEnd = ordered[i];
    }
  }
  runs.push({ start: runStart, end: runEnd });

  return runs
    .map((r) =>
      r.start === r.end
        ? WEEK_DAY_LABELS[r.start]
        : `${WEEK_DAY_LABELS[r.start]}–${WEEK_DAY_LABELS[r.end]}`,
    )
    .join(", ");
}

/** Human label for a life area's usual-week schedule (list rows, headers). */
export function areaScheduleLabel(
  usualWeek: UsualWeekBlock[],
  areaId: string,
  options?: { includeWeekTotal?: boolean },
): string {
  const byDay = plannedHoursByDayForArea(usualWeek, areaId);
  const weekHours = MON_SUN_ORDER.reduce<number>(
    (sum, dow) => sum + byDay[dow],
    0,
  );
  if (weekHours < 0.01) {
    return options?.includeWeekTotal
      ? "Set hours for each day below"
      : "No hours yet";
  }

  const activeDays = MON_SUN_ORDER.filter((dow) => byDay[dow] > 0.01);
  const activeHours = activeDays.map((dow) => byDay[dow]);
  const uniformActive =
    activeHours.length > 0 &&
    activeHours.every((h) => hoursNearlyEqual(h, activeHours[0]));
  const uniformEveryDay = MON_SUN_ORDER.every((dow) =>
    hoursNearlyEqual(byDay[dow], byDay[MON_SUN_ORDER[0]]),
  );

  const weekSuffix = options?.includeWeekTotal
    ? ` · ${formatHours(weekHours)}/wk`
    : "";

  if (uniformEveryDay && byDay[MON_SUN_ORDER[0]] > 0.01) {
    const hours = byDay[MON_SUN_ORDER[0]];
    return `${formatHours(hours)}/day · ${dayAllocationPct(hours)}%${weekSuffix}`;
  }

  if (uniformActive && activeDays.length < 7) {
    const hours = activeHours[0];
    const range = formatActiveDayRange(activeDays);
    return `${formatHours(hours)} · ${range} · ${dayAllocationPct(hours)}%${weekSuffix}`;
  }

  return `${formatHours(weekHours)}/wk`;
}

export function validateUsualWeekBudget(usualWeek: UsualWeekBlock[]): {
  ok: boolean;
  overDays: DayBudgetStatus[];
} {
  const overDays = getDayBudgetStatuses(usualWeek).filter((s) => s.over);
  return { ok: overDays.length === 0, overDays };
}

export function usualWeekBudgetErrorMessage(
  overDays: DayBudgetStatus[],
): string {
  if (overDays.length === 0) return "";
  const parts = overDays.map(
    (d) =>
      `${WEEK_DAY_LABELS[d.dayOfWeek]} ${formatHours(d.hours)} (${d.pct}%)`,
  );
  return `Over 24h on ${parts.join(", ")}. Trim a block or move time.`;
}

/** @deprecated use areaHasPlanOnDate(usualWeek, …) */
export function areaAppliesOnDate(area: AreaDef, dateKey: string): boolean {
  const day = parseDateKey(dateKey).getDay();
  const pattern = area.daysPattern ?? "everyday";
  if (pattern === "everyday") return true;
  if (pattern === "weekdays") return day >= 1 && day <= 5;
  if (pattern === "weekends") return day === 0 || day === 6;
  return true;
}

export const DAYS_PATTERN_OPTIONS: { id: DaysPattern; label: string; hint: string }[] = [
  { id: "everyday", label: "Every day", hint: "Mon–Sun" },
  { id: "weekdays", label: "Weekdays", hint: "Mon–Fri only" },
  { id: "weekends", label: "Weekends", hint: "Sat–Sun only" },
];

export function daysPatternLabel(pattern: DaysPattern): string {
  return DAYS_PATTERN_OPTIONS.find((o) => o.id === pattern)?.label ?? "Every day";
}

export function sessionDurationMs(
  session: Session,
  now: number = Date.now(),
): number {
  return Math.max(0, (session.endedAt ?? now) - session.startedAt);
}

/**
 * Human duration from total seconds: "2h 15m", "45m", "12s".
 * Live timers can include seconds; static values prefer h/m only.
 */
export function formatDurationSeconds(
  totalSeconds: number,
  options?: { showSeconds?: boolean },
): string {
  const showSeconds = options?.showSeconds ?? false;
  const sign = totalSeconds < 0 ? "-" : "";
  let s = Math.abs(Math.round(totalSeconds));

  const h = Math.floor(s / 3600);
  s -= h * 3600;
  const m = Math.floor(s / 60);
  s -= m * 60;

  const parts: string[] = [];
  if (h > 0) parts.push(`${h}h`);
  if (m > 0) parts.push(`${m}m`);
  if (showSeconds && (s > 0 || parts.length === 0)) parts.push(`${s}s`);
  if (!showSeconds && parts.length === 0) {
    // Sub-minute static values still show seconds rather than "0m"
    if (s > 0) parts.push(`${s}s`);
    else parts.push("0m");
  }

  return sign + parts.join(" ");
}

export function formatElapsed(ms: number): string {
  return formatDurationSeconds(ms / 1000, { showSeconds: true });
}

export function getRunningSession(sessions: Session[]): Session | null {
  return sessions.find((s) => s.endedAt === null) ?? null;
}

function sessionOnDay(session: Session, dateKey: string): boolean {
  return toDateKey(new Date(session.startedAt)) === dateKey;
}

export function actualHoursForArea(
  sessions: Session[],
  areaId: string,
  window: TimeWindow,
  now: number = Date.now(),
): number {
  const today = todayKey();
  const { start, end } = weekRange(today);
  const minutes = sessions
    .filter((s) => s.areaId === areaId)
    .filter((s) => {
      const day = toDateKey(new Date(s.startedAt));
      if (window === "today") return day === today;
      return day >= start && day <= end;
    })
    .reduce((sum, s) => sum + sessionDurationMs(s, now) / 60000, 0);
  return minutes / 60;
}

export function buildPlanActual(
  areas: AreaDef[],
  usualWeek: UsualWeekBlock[],
  sessions: Session[],
  window: TimeWindow,
  now: number = Date.now(),
): PlanActualRow[] {
  return areas.map((area) => {
    const plannedHours = plannedHoursForArea(usualWeek, area.id, window);
    const actualHours = actualHoursForArea(sessions, area.id, window, now);
    return {
      areaId: area.id,
      plannedHours,
      actualHours,
      deltaHours: actualHours - plannedHours,
    };
  });
}

const FREE_TIME_MIN_HOURS = 0.25; // 15 minutes

/**
 * True only when wall-clock is after this life's last planned block today.
 * Mid-day Stop (e.g. chore during Work) should NOT count as "finished early".
 */
export function isPastPlannedBlocksToday(
  usualWeek: UsualWeekBlock[],
  areaId: string,
  now: number = Date.now(),
): boolean {
  const dateKey = toDateKey(new Date(now));
  const blocks = blocksOnDate(usualWeek, dateKey, areaId);
  // No plan on this day (e.g. Work on Saturday)
  if (blocks.length === 0) return false;

  const nowDate = new Date(now);
  const minutesNow =
    nowDate.getHours() * 60 + nowDate.getMinutes() + nowDate.getSeconds() / 60;

  let lastEndMinutes = -1;
  for (const block of blocks) {
    const start = parseTimeToMinutes(block.start);
    const end = parseTimeToMinutes(block.end);
    if (end <= start) {
      lastEndMinutes = Math.max(lastEndMinutes, end);
    } else {
      lastEndMinutes = Math.max(lastEndMinutes, end);
    }
  }

  return minutesNow >= lastEndMinutes;
}

/**
 * After stopping a timer: only if they're past that life's planned blocks
 * and still under today's hour plan, offer free time to short parts.
 */
export function buildRebalanceOffer(
  stoppedAreaId: string,
  areas: AreaDef[],
  usualWeek: UsualWeekBlock[],
  sessions: Session[],
  protectedIds: string[],
  now: number = Date.now(),
): RebalanceOffer | null {
  const stoppedArea = areas.find((a) => a.id === stoppedAreaId);
  if (!stoppedArea) return null;

  // Waking up ≠ free time to redistribute
  if (stoppedArea.id === "sleep") return null;

  // Switching mid-day (chore during work) — not "done for the day"
  if (!isPastPlannedBlocksToday(usualWeek, stoppedAreaId, now)) return null;

  const planned = plannedHoursForArea(usualWeek, stoppedAreaId, "today");
  const actual = actualHoursForArea(sessions, stoppedAreaId, "today", now);
  const freeHours = planned - actual;
  if (freeHours < FREE_TIME_MIN_HOURS) return null;

  let suggestions: RebalanceSuggestion[] = areas
    .filter((a) => a.id !== stoppedAreaId)
    .map((area) => {
      const actualH = actualHoursForArea(sessions, area.id, "today", now);
      const plannedH = plannedHoursForArea(usualWeek, area.id, "today");
      return {
        areaId: area.id,
        name: area.name,
        color: area.color,
        shortfallHours: plannedH - actualH,
        isProtected: protectedIds.includes(area.id),
      };
    })
    .filter(
      (s) =>
        s.shortfallHours >= FREE_TIME_MIN_HOURS &&
        areaHasPlanOnDate(usualWeek, s.areaId, todayKey()),
    )
    .sort((a, b) => {
      if (a.isProtected !== b.isProtected) return a.isProtected ? -1 : 1;
      return b.shortfallHours - a.shortfallHours;
    })
    .slice(0, 4);

  // If nothing is "short", still offer parts that have plan today
  if (suggestions.length === 0) {
    suggestions = areas
      .filter(
        (a) =>
          a.id !== stoppedAreaId &&
          areaHasPlanOnDate(usualWeek, a.id, todayKey()),
      )
      .map((area) => {
        const actualH = actualHoursForArea(sessions, area.id, "today", now);
        const plannedH = plannedHoursForArea(usualWeek, area.id, "today");
        return {
          areaId: area.id,
          name: area.name,
          color: area.color,
          shortfallHours: Math.max(0, plannedH - actualH),
          isProtected: protectedIds.includes(area.id),
        };
      })
      .sort((a, b) => {
        if (a.isProtected !== b.isProtected) return a.isProtected ? -1 : 1;
        return b.shortfallHours - a.shortfallHours;
      })
      .slice(0, 3);
  }

  if (suggestions.length === 0) return null;

  return {
    fromAreaId: stoppedAreaId,
    fromAreaName: stoppedArea.name,
    freeHours,
    suggestions,
  };
}

export const TIME_OPTIONS: string[] = Array.from({ length: 48 }, (_, i) => {
  const h = Math.floor(i / 2);
  const m = i % 2 === 0 ? "00" : "30";
  return `${String(h).padStart(2, "0")}:${m}`;
});

export function parseTimeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

export function blockDurationHours(block: TimeBlock): number {
  let start = parseTimeToMinutes(block.start);
  let end = parseTimeToMinutes(block.end);
  if (end <= start) end += 24 * 60;
  return (end - start) / 60;
}

export function areaBlocksHours(blocks: TimeBlock[]): number {
  return blocks.reduce((sum, b) => sum + blockDurationHours(b), 0);
}

export function formatTimeLabel(time: string): string {
  const [h, m] = time.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 || 12;
  return m === 0 ? `${h12} ${ampm}` : `${h12}:${String(m).padStart(2, "0")} ${ampm}`;
}

export function formatBlockLabel(block: TimeBlock): string {
  const overnight = parseTimeToMinutes(block.end) <= parseTimeToMinutes(block.start);
  return `${formatTimeLabel(block.start)} – ${formatTimeLabel(block.end)}${
    overnight ? " (overnight)" : ""
  }`;
}

export function blocksSummary(blocks: TimeBlock[]): string {
  if (blocks.length === 0) return "No set hours";
  return blocks.map(formatBlockLabel).join(" · ");
}

/** Position a block on a 24h timeline (0–100%). Overnight splits into two ranges. */
export function blockTimelineRanges(
  block: TimeBlock,
): { left: number; width: number }[] {
  const start = parseTimeToMinutes(block.start);
  const end = parseTimeToMinutes(block.end);
  const day = 24 * 60;
  if (end > start) {
    return [{ left: (start / day) * 100, width: ((end - start) / day) * 100 }];
  }
  // overnight: start→midnight and midnight→end
  return [
    { left: (start / day) * 100, width: ((day - start) / day) * 100 },
    { left: 0, width: (end / day) * 100 },
  ];
}

export function hoursToPercent(hours: number): number {
  return Math.round((hours / DAY_HOURS) * 100);
}

/** Hours as clean units — "6h 30m", not "6.5h" or long floats. */
export function formatHours(hours: number): string {
  if (!Number.isFinite(hours)) return "0m";
  return formatDurationSeconds(hours * 3600);
}

/** Minutes as clean units — "1h 30m", "45m". */
export function formatMinutes(minutes: number): string {
  if (!Number.isFinite(minutes)) return "0m";
  return formatDurationSeconds(minutes * 60);
}

export type TimeWindow = "today" | "week";

export const RECURRENCE_OPTIONS: { id: Recurrence; label: string }[] = [
  { id: "none", label: "Doesn’t repeat" },
  { id: "daily", label: "Daily" },
  { id: "weekdays", label: "Weekdays" },
  { id: "weekly", label: "Weekly" },
];

export const REMINDER_PRESET_OPTIONS: { id: Reminder; label: string }[] = [
  { id: "none", label: "No reminder" },
  { id: "morning", label: "Morning" },
  { id: "evening", label: "Evening" },
];

/** @deprecated Use ReminderPicker; kept for legacy chip lists */
export const REMINDER_OPTIONS: { id: Reminder; label: string }[] = [
  ...REMINDER_PRESET_OPTIONS,
];

export function isTimeReminder(reminder: Reminder): boolean {
  return isRelativeClockReminder(reminder) || isAbsoluteReminder(reminder);
}

export function isRelativeClockReminder(reminder: Reminder): boolean {
  return /^\d{2}:\d{2}(:\d{2})?$/.test(reminder);
}

export function isAbsoluteReminder(reminder: Reminder): boolean {
  return /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/.test(reminder);
}

export type ReminderSpec =
  | { kind: "none" }
  | { kind: "preset"; preset: "morning" | "evening" }
  | {
      kind: "relative";
      hours: number;
      minutes: number;
      seconds: number;
    }
  | {
      kind: "absolute";
      dateKey: string;
      hours: number;
      minutes: number;
      seconds: number;
    };

export function normalizeTimeWithSeconds(time: string): string {
  const parts = time.split(":");
  if (parts.length === 2) {
    return `${parts[0]}:${parts[1]}:00`;
  }
  if (parts.length === 3) {
    return `${parts[0]}:${parts[1]}:${parts[2]}`;
  }
  return "09:00:00";
}

export function buildAbsoluteReminder(dateKey: string, time: string): Reminder {
  return `${dateKey}T${normalizeTimeWithSeconds(time)}`;
}

/** Time-of-day reminder for repeating tasks (fires on each occurrence day). */
export function buildRelativeReminder(time: string): Reminder {
  return normalizeTimeWithSeconds(time);
}

export function absoluteToRelativeReminder(reminder: Reminder): Reminder {
  const absolute = parseAbsoluteReminder(reminder);
  if (absolute) return buildRelativeReminder(absolute.time);
  if (isRelativeClockReminder(reminder)) return reminder;
  return reminder;
}

export function relativeToAbsoluteReminder(
  reminder: Reminder,
  dateKey: string,
): Reminder {
  if (parseAbsoluteReminder(reminder)) return reminder;
  const clock = reminderClockTime(reminder);
  if (!clock) return reminder;
  const hh = String(clock.hours).padStart(2, "0");
  const mm = String(clock.minutes).padStart(2, "0");
  const ss = String(clock.seconds).padStart(2, "0");
  return buildAbsoluteReminder(dateKey, `${hh}:${mm}:${ss}`);
}

export function parseAbsoluteReminder(
  reminder: Reminder,
): { dateKey: string; time: string } | null {
  const match = /^(\d{4}-\d{2}-\d{2})T(\d{2}):(\d{2}):(\d{2})$/.exec(reminder);
  if (!match) return null;
  return {
    dateKey: match[1],
    time: `${match[2]}:${match[3]}:${match[4]}`,
  };
}

export function parseReminderSpec(reminder: Reminder): ReminderSpec {
  if (reminder === "none") return { kind: "none" };
  if (reminder === "morning") return { kind: "preset", preset: "morning" };
  if (reminder === "evening") return { kind: "preset", preset: "evening" };

  const absolute = parseAbsoluteReminder(reminder);
  if (absolute) {
    const [hours, minutes, seconds] = absolute.time.split(":").map(Number);
    return {
      kind: "absolute",
      dateKey: absolute.dateKey,
      hours,
      minutes,
      seconds,
    };
  }

  const clock = /^(\d{2}):(\d{2})(?::(\d{2}))?$/.exec(reminder);
  if (clock) {
    return {
      kind: "relative",
      hours: Number(clock[1]),
      minutes: Number(clock[2]),
      seconds: clock[3] ? Number(clock[3]) : 0,
    };
  }

  return { kind: "none" };
}

export function reminderMode(
  reminder: Reminder,
): "none" | "morning" | "evening" | "datetime" {
  const spec = parseReminderSpec(reminder);
  if (spec.kind === "none") return "none";
  if (spec.kind === "preset") return spec.preset;
  return "datetime";
}

export function reminderClockTime(
  reminder: Reminder,
): { hours: number; minutes: number; seconds: number } | null {
  const spec = parseReminderSpec(reminder);
  if (spec.kind === "none") return null;
  if (spec.kind === "preset") {
    return spec.preset === "morning"
      ? { hours: 8, minutes: 0, seconds: 0 }
      : { hours: 18, minutes: 0, seconds: 0 };
  }
  return {
    hours: spec.hours,
    minutes: spec.minutes,
    seconds: spec.seconds,
  };
}

export function defaultDatetimeReminder(
  reminder: Reminder,
  defaultDateKey: string,
): { dateKey: string; time: string } {
  const absolute = parseAbsoluteReminder(reminder);
  if (absolute) return absolute;

  const spec = parseReminderSpec(reminder);
  if (spec.kind === "relative") {
    const hh = String(spec.hours).padStart(2, "0");
    const mm = String(spec.minutes).padStart(2, "0");
    const ss = String(spec.seconds).padStart(2, "0");
    return { dateKey: defaultDateKey, time: `${hh}:${mm}:${ss}` };
  }

  return { dateKey: defaultDateKey, time: "09:00:00" };
}

export function formatTimeWithSeconds(time: string): string {
  const [h, m, s] = normalizeTimeWithSeconds(time).split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 || 12;
  const minutePart =
    m === 0 && s === 0
      ? ""
      : `:${String(m).padStart(2, "0")}${s === 0 ? "" : `:${String(s).padStart(2, "0")}`}`;
  return `${h12}${minutePart} ${ampm}`;
}

export function recurrenceLabel(recurrence: Recurrence): string {
  return RECURRENCE_OPTIONS.find((o) => o.id === recurrence)?.label ?? "Doesn’t repeat";
}

export function reminderLabel(reminder: Reminder): string {
  const spec = parseReminderSpec(reminder);
  if (spec.kind === "none") return "No reminder";
  if (spec.kind === "preset") {
    return spec.preset === "morning" ? "Morning" : "Evening";
  }
  const clock = `${String(spec.hours).padStart(2, "0")}:${String(spec.minutes).padStart(2, "0")}:${String(spec.seconds).padStart(2, "0")}`;
  if (spec.kind === "absolute") {
    return `${formatDateLabel(spec.dateKey)} · ${formatTimeWithSeconds(clock)}`;
  }
  return formatTimeWithSeconds(clock);
}

export function isRecurring(task: Task): boolean {
  return (task.recurrence ?? "none") !== "none";
}

function recurrenceAnchor(task: Task): string {
  return task.scheduledDate ?? task.dueDate ?? todayKey();
}

/** Schedule/recurrence match for a date, ignoring open vs completed state. */
export function wouldOccurOnDate(task: Task, dateKey: string): boolean {
  const recurrence = task.recurrence ?? "none";
  if (recurrence === "none") {
    return task.scheduledDate === dateKey;
  }

  const anchor = recurrenceAnchor(task);
  if (dateKey < anchor) return false;

  const day = parseDateKey(dateKey).getDay();
  if (recurrence === "daily") return true;
  if (recurrence === "weekdays") return day >= 1 && day <= 5;
  if (recurrence === "weekly") {
    return day === parseDateKey(anchor).getDay();
  }
  return false;
}

/** Whether this task has an open occurrence on dateKey. */
export function occursOnDate(task: Task, dateKey: string): boolean {
  if (task.status !== "open") return false;
  if (task.completedDates?.includes(dateKey)) return false;
  return wouldOccurOnDate(task, dateKey);
}

/** Whether this task was completed on dateKey (recurring occurrence or one-off). */
export function isCompletedOnDate(task: Task, dateKey: string): boolean {
  if (isRecurring(task)) {
    return (
      (task.completedDates?.includes(dateKey) ?? false) &&
      wouldOccurOnDate(task, dateKey)
    );
  }
  if (task.status === "done") {
    return task.scheduledDate === dateKey;
  }
  return false;
}

/** Open or completed occurrence visible on a calendar day. */
export function isVisibleOnDate(task: Task, dateKey: string): boolean {
  return occursOnDate(task, dateKey) || isCompletedOnDate(task, dateKey);
}

/** Open, completed, or absent for this task in the time window. */
export function taskWindowState(
  task: Task,
  window: TimeWindow,
): "open" | "completed" | null {
  if (window === "today") {
    const dateKey = todayKey();
    if (occursOnDate(task, dateKey)) return "open";
    if (isCompletedOnDate(task, dateKey)) return "completed";
    return null;
  }

  if (isBacklogTask(task)) {
    return task.status === "open" ? "open" : null;
  }

  const { start, end } = weekRange(todayKey());
  let hasOpen = false;
  let hasCompleted = false;
  for (let d = start; d <= end; d = addDays(d, 1)) {
    if (occursOnDate(task, d)) hasOpen = true;
    if (isCompletedOnDate(task, d)) hasCompleted = true;
  }
  if (hasOpen) return "open";
  if (hasCompleted) return "completed";
  return null;
}

/** Whether the task should appear in area/calendar lists for this window. */
export function taskVisibleInWindow(task: Task, window: TimeWindow): boolean {
  return taskWindowState(task, window) !== null;
}

/** One-off backlog, or recurring series (shown under backlog only if no occurrence in window). */
export function isBacklogTask(task: Task): boolean {
  if (task.status !== "open") return false;
  if (isRecurring(task)) return false;
  return task.scheduledDate === null;
}

/** Today = occurrences today. Week = occurrences this week + one-off backlog. */
export function taskCountsInWindow(task: Task, window: TimeWindow): boolean {
  if (task.status !== "open") return false;
  if (window === "today") {
    return occursOnDate(task, todayKey());
  }
  if (isBacklogTask(task)) return true;
  const { start, end } = weekRange(todayKey());
  for (let d = start; d <= end; d = addDays(d, 1)) {
    if (occursOnDate(task, d)) return true;
  }
  return false;
}

export function occurrenceMinutesInWindow(
  task: Task,
  window: TimeWindow,
): number {
  if (task.status !== "open") return 0;
  if (window === "today") {
    return occursOnDate(task, todayKey()) ? task.estimateMinutes : 0;
  }
  if (isBacklogTask(task)) return task.estimateMinutes;
  const { start, end } = weekRange(todayKey());
  let minutes = 0;
  for (let d = start; d <= end; d = addDays(d, 1)) {
    if (occursOnDate(task, d)) minutes += task.estimateMinutes;
  }
  return minutes;
}

export function loadHoursForArea(
  tasks: Task[],
  areaId: string,
  window: TimeWindow,
): number {
  return (
    tasks
      .filter((t) => t.areaId === areaId)
      .reduce((sum, t) => sum + occurrenceMinutesInWindow(t, window), 0) / 60
  );
}

/** Minutes credited toward goal from completed tasks in this window. */
export function completedMinutesInWindow(
  task: Task,
  window: TimeWindow,
): number {
  if (task.status === "delegated" || task.status === "bought_time") return 0;

  if (isRecurring(task)) {
    const dates = task.completedDates ?? [];
    if (dates.length === 0) return 0;
    if (window === "today") {
      return dates.includes(todayKey()) ? task.estimateMinutes : 0;
    }
    const { start, end } = weekRange(todayKey());
    return (
      dates.filter((d) => d >= start && d <= end).length * task.estimateMinutes
    );
  }

  if (task.status !== "done") return 0;

  const today = todayKey();
  if (window === "today") {
    if (task.scheduledDate === today || task.scheduledDate === null) {
      return task.estimateMinutes;
    }
    return 0;
  }

  const { start, end } = weekRange(today);
  if (task.scheduledDate === null) return task.estimateMinutes;
  if (task.scheduledDate >= start && task.scheduledDate <= end) {
    return task.estimateMinutes;
  }
  return 0;
}

export function completedHoursForArea(
  tasks: Task[],
  areaId: string,
  window: TimeWindow,
): number {
  return (
    tasks
      .filter((t) => t.areaId === areaId)
      .reduce((sum, t) => sum + completedMinutesInWindow(t, window), 0) / 60
  );
}

export function tasksOnDate(tasks: Task[], dateKey: string): Task[] {
  return tasks
    .filter((t) => isVisibleOnDate(t, dateKey))
    .sort((a, b) => b.estimateMinutes - a.estimateMinutes);
}

export function eachDayInRange(start: string, end: string): string[] {
  const days: string[] = [];
  for (let d = start; d <= end; d = addDays(d, 1)) {
    days.push(d);
  }
  return days;
}

export type AreaPressure = {
  areaId: string;
  budgetHours: number;
  capacity: number;
  load: number;
  ratio: number;
  free: number;
  overloaded: boolean;
};

export function getAreaPressure(
  area: AreaDef,
  usualWeek: UsualWeekBlock[],
  tasks: Task[],
  window: TimeWindow,
): AreaPressure {
  const capacity = plannedHoursForArea(usualWeek, area.id, window);
  const load = loadHoursForArea(tasks, area.id, window);
  // No plan this day/window (e.g. Work on Saturday) — not "overloaded"
  const overloaded = capacity > 0 && load > capacity;
  const ratio = capacity > 0 ? load / capacity : 0;
  const free = Math.max(0, capacity - load);
  return {
    areaId: area.id,
    budgetHours: capacity,
    capacity,
    load,
    ratio,
    free,
    overloaded,
  };
}

export type AreaProgress = {
  areaId: string;
  plannedHours: number;
  completedHours: number;
  trackedHours: number;
  progressHours: number;
  progressRatio: number;
  progressPct: number;
  openLoadHours: number;
  overloaded: boolean;
  extraHours: number;
  goalMet: boolean;
};

export function getAreaProgress(
  area: AreaDef,
  usualWeek: UsualWeekBlock[],
  tasks: Task[],
  sessions: Session[],
  window: TimeWindow,
  now: number = Date.now(),
): AreaProgress {
  const plannedHours = plannedHoursForArea(usualWeek, area.id, window);
  const completedHours = completedHoursForArea(tasks, area.id, window);
  const trackedHours = actualHoursForArea(sessions, area.id, window, now);
  const progressHours = Math.max(completedHours, trackedHours);
  const openLoadHours = loadHoursForArea(tasks, area.id, window);
  const progressRatio =
    plannedHours > 0 ? progressHours / plannedHours : 0;

  return {
    areaId: area.id,
    plannedHours,
    completedHours,
    trackedHours,
    progressHours,
    progressRatio,
    progressPct: Math.min(Math.round(progressRatio * 100), 100),
    openLoadHours,
    overloaded: plannedHours > 0 && openLoadHours > plannedHours,
    extraHours: Math.max(0, progressHours - plannedHours),
    goalMet: plannedHours > 0 && progressHours >= plannedHours,
  };
}

export function getAllAreaProgress(
  areas: AreaDef[],
  usualWeek: UsualWeekBlock[],
  tasks: Task[],
  sessions: Session[],
  window: TimeWindow,
  now: number = Date.now(),
): AreaProgress[] {
  return areas.map((area) =>
    getAreaProgress(area, usualWeek, tasks, sessions, window, now),
  );
}

export type ProgressRollup = {
  withGoal: number;
  goalsMet: number;
  inProgress: number;
  stalled: number;
  overloaded: number;
};

export function progressRollup(progresses: AreaProgress[]): ProgressRollup {
  const active = progresses.filter((p) => p.plannedHours > 0);
  return {
    withGoal: active.length,
    goalsMet: active.filter((p) => p.goalMet).length,
    inProgress: active.filter(
      (p) => !p.goalMet && p.progressHours > 0 && p.progressRatio < 1,
    ).length,
    stalled: active.filter(
      (p) => !p.goalMet && p.progressHours < 0.05 && p.openLoadHours > 0,
    ).length,
    overloaded: active.filter((p) => p.overloaded).length,
  };
}

export function formatAreaProgressSummary(progress: AreaProgress): string {
  const {
    plannedHours,
    progressHours,
    trackedHours,
    completedHours,
    openLoadHours,
    goalMet,
    extraHours,
  } = progress;

  if (plannedHours <= 0) {
    if (openLoadHours > 0) {
      return `${formatHours(openLoadHours)} open tasks`;
    }
    return "No goal set for this window";
  }

  const goalLabel = formatHours(plannedHours);
  const parts: string[] = [];

  if (goalMet) {
    parts.push("Goal met");
    if (extraHours > 0.05) {
      parts.push(`+${formatHours(extraHours)} past plan`);
    }
  } else if (progressHours > 0.05) {
    const qualifier =
      trackedHours > completedHours + 0.01 ? " tracked" : "";
    parts.push(
      `${formatHours(progressHours)}${qualifier} of ${goalLabel} goal`,
    );
  } else {
    parts.push(`${goalLabel} goal`);
  }

  if (openLoadHours > 0) {
    parts.push(`${formatHours(openLoadHours)} open tasks`);
  }

  return parts.join(" · ");
}

export function formatMarkDoneNotice(
  task: Task,
  area: AreaDef,
  progress: AreaProgress,
  window: TimeWindow,
): string {
  const creditHours = task.estimateMinutes / 60;
  const newCompleted = progress.completedHours + creditHours;
  const newProgressHours = Math.max(newCompleted, progress.trackedHours);
  const afterPct =
    progress.plannedHours > 0
      ? Math.min(
          Math.round((newProgressHours / progress.plannedHours) * 100),
          100,
        )
      : 0;
  const windowLabel = window === "today" ? "today's" : "this week's";
  return `+${formatHours(creditHours)} toward ${area.name} · ${afterPct}% of ${windowLabel} goal`;
}

export function taskGoalCreditPct(
  task: Task,
  progress: AreaProgress,
): number {
  if (progress.plannedHours <= 0) return 0;
  return Math.round((task.estimateMinutes / 60 / progress.plannedHours) * 100);
}

export function scheduleLabel(task: Task): string {
  if (isRecurring(task)) return recurrenceLabel(task.recurrence);
  if (!task.scheduledDate) return "Backlog";
  const date = formatDateLabel(task.scheduledDate);
  if (task.scheduledTime) {
    return `${date} · ${formatTimeLabel(task.scheduledTime.slice(0, 5))}`;
  }
  return date;
}

export function dueLabel(task: Task): string | null {
  if (!task.dueDate) return null;
  return `Due ${formatDateLabel(task.dueDate)}`;
}

export type CoachInsight = {
  headline: string;
  body: string;
  ctaLabel: string;
  ctaAreaId?: string;
};

export function buildCoachInsight(
  progresses: AreaProgress[],
  areas: AreaDef[],
  intents: IntentId[],
  window: TimeWindow,
): CoachInsight {
  const active = progresses.filter((p) => p.plannedHours > 0);
  const rollup = progressRollup(progresses);

  const overloaded = active
    .filter((p) => p.overloaded)
    .sort(
      (a, b) =>
        b.openLoadHours / b.plannedHours - a.openLoadHours / a.plannedHours,
    )[0];

  if (overloaded) {
    const area = areas.find((a) => a.id === overloaded.areaId);
    const name = area?.name ?? "An area";
    const overBy = formatHours(overloaded.openLoadHours - overloaded.plannedHours);
    const wantsFamily =
      intents.includes("family") ||
      areas.some((a) => a.id === "family" && a.defaultProtected);

    return {
      headline: `${name} is overloaded`,
      body: wantsFamily
        ? `Over by ${overBy} in tasks. You wanted more Family — buy time on errands or offload.`
        : `Over by ${overBy} in tasks. Defer, delegate, or buy time to protect what matters.`,
      ctaLabel: `See ${name}`,
      ctaAreaId: overloaded.areaId,
    };
  }

  if (rollup.withGoal > 0 && rollup.goalsMet === rollup.withGoal) {
    return {
      headline:
        window === "today"
          ? "Every goal hit today"
          : "All weekly goals complete",
      body: "You lived the plan you set. Capture anything else or enjoy the space.",
      ctaLabel: "Capture something",
    };
  }

  const goalMet = active
    .filter((p) => p.goalMet)
    .sort((a, b) => b.extraHours - a.extraHours)[0];

  if (goalMet) {
    const area = areas.find((a) => a.id === goalMet.areaId);
    const name = area?.name ?? "A life area";
    return {
      headline: `${name} goal complete`,
      body:
        goalMet.extraHours > 0.05
          ? `You went ${formatHours(goalMet.extraHours)} past plan — nice work.`
          : `You hit your ${window === "today" ? "daily" : "weekly"} target for ${name}.`,
      ctaLabel: `Open ${name}`,
      ctaAreaId: goalMet.areaId,
    };
  }

  const stalled = active
    .filter((p) => p.progressHours < 0.05 && p.openLoadHours > 0)
    .sort((a, b) => b.openLoadHours - a.openLoadHours)[0];

  if (stalled) {
    const area = areas.find((a) => a.id === stalled.areaId);
    const name = area?.name ?? "A life area";
    return {
      headline: `${name} is waiting`,
      body: `${formatHours(stalled.openLoadHours)} on your plate and 0% toward your ${formatHours(stalled.plannedHours)} goal. Start with one task.`,
      ctaLabel: `Open ${name}`,
      ctaAreaId: stalled.areaId,
    };
  }

  const halfway = active
    .filter((p) => p.progressRatio >= 0.5 && p.progressRatio < 1)
    .sort((a, b) => b.progressRatio - a.progressRatio)[0];

  if (halfway) {
    const area = areas.find((a) => a.id === halfway.areaId);
    const name = area?.name ?? "A life area";
    return {
      headline: `${name} is halfway there`,
      body: `${halfway.progressPct}% of your ${formatHours(halfway.plannedHours)} goal. ${formatHours(halfway.plannedHours - halfway.progressHours)} to go.`,
      ctaLabel: `Keep going`,
      ctaAreaId: halfway.areaId,
    };
  }

  if (window === "week" && rollup.goalsMet > 0 && rollup.goalsMet < rollup.withGoal) {
    return {
      headline: `${rollup.goalsMet} of ${rollup.withGoal} weekly goals hit`,
      body: `${rollup.inProgress} still in progress. Check Orbit to see who needs attention.`,
      ctaLabel: "Review progress",
    };
  }

  const lowest = active
    .filter((p) => !p.goalMet)
    .sort((a, b) => a.progressRatio - b.progressRatio)[0];

  if (lowest && lowest.progressHours > 0) {
    const area = areas.find((a) => a.id === lowest.areaId);
    return {
      headline: `${area?.name ?? "A life area"} at ${lowest.progressPct}%`,
      body: `${formatHours(lowest.progressHours)} of ${formatHours(lowest.plannedHours)} done. ${lowest.openLoadHours > 0 ? `${formatHours(lowest.openLoadHours)} still open.` : "Keep the momentum."}`,
      ctaLabel: `See ${area?.name ?? "area"}`,
      ctaAreaId: lowest.areaId,
    };
  }

  return {
    headline: "Ready when you are",
    body: "Share what's on your mind — we'll place it and show how it affects your goals.",
    ctaLabel: "Capture something",
  };
}

export function centerReadout(
  progresses: AreaProgress[],
  areas: AreaDef[],
  window: TimeWindow,
): string {
  const active = progresses.filter((p) => p.plannedHours > 0);
  const rollup = progressRollup(progresses);

  const overloaded = active
    .filter((p) => p.overloaded)
    .sort(
      (a, b) =>
        b.openLoadHours / b.plannedHours - a.openLoadHours / a.plannedHours,
    )[0];

  if (overloaded) {
    const area = areas.find((a) => a.id === overloaded.areaId);
    const overBy = formatHours(overloaded.openLoadHours - overloaded.plannedHours);
    return `${area?.name ?? "An area"} +${overBy} tasks`;
  }

  if (rollup.withGoal > 0 && rollup.goalsMet === rollup.withGoal) {
    return window === "today" ? "All goals hit" : `${rollup.goalsMet}/${rollup.withGoal} goals`;
  }

  if (window === "week" && rollup.withGoal > 0) {
    return `${rollup.goalsMet} of ${rollup.withGoal} goals hit`;
  }

  const needsWork = active
    .filter((p) => !p.goalMet)
    .sort((a, b) => a.progressRatio - b.progressRatio)[0];

  if (needsWork) {
    const area = areas.find((a) => a.id === needsWork.areaId);
    return `${area?.name ?? "An area"} ${needsWork.progressPct}%`;
  }

  return "Goals are set";
}
