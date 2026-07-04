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

/** none | morning | evening | HH:mm */
export type Reminder = "none" | "morning" | "evening" | "09:00" | "17:00" | "20:00";

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

function baseTask(
  partial: Omit<Task, "recurrence" | "reminder" | "completedDates"> &
    Partial<Pick<Task, "recurrence" | "reminder" | "completedDates">>,
): Task {
  return {
    recurrence: "none",
    reminder: "none",
    completedDates: [],
    ...partial,
  };
}

export function createSeedTasks(): Task[] {
  const today = todayKey();
  return [
    baseTask({
      id: "task-dmv",
      areaId: "chores",
      title: "Renew DMV — needs smoke test",
      notes: "Registration expires soon. Smog check required first.",
      estimateMinutes: 150,
      status: "open",
      scheduledDate: today,
      dueDate: addDays(today, 4),
      reminder: "09:00",
    }),
    baseTask({
      id: "task-returns",
      areaId: "chores",
      title: "Return packages to UPS",
      estimateMinutes: 60,
      status: "open",
      scheduledDate: today,
      dueDate: addDays(today, 2),
      reminder: "morning",
    }),
    baseTask({
      id: "task-bills",
      areaId: "chores",
      title: "Pay utility bills",
      estimateMinutes: 30,
      status: "open",
      scheduledDate: null,
      dueDate: addDays(today, 5),
      reminder: "none",
    }),
    baseTask({
      id: "task-errands",
      areaId: "chores",
      title: "Pharmacy + dry cleaning",
      estimateMinutes: 90,
      status: "open",
      scheduledDate: addDays(today, 2),
      dueDate: addDays(today, 3),
    }),
    baseTask({
      id: "task-standup",
      areaId: "work",
      title: "Prep weekly update",
      estimateMinutes: 45,
      status: "open",
      scheduledDate: today,
      dueDate: today,
      recurrence: "weekly",
      reminder: "09:00",
    }),
    baseTask({
      id: "task-review",
      areaId: "work",
      title: "Review design docs",
      estimateMinutes: 90,
      status: "open",
      scheduledDate: today,
      dueDate: addDays(today, 1),
    }),
    baseTask({
      id: "task-dinner",
      areaId: "family",
      title: "Family dinner — no phones",
      estimateMinutes: 60,
      status: "open",
      scheduledDate: today,
      dueDate: null,
      recurrence: "daily",
      reminder: "evening",
    }),
    baseTask({
      id: "task-winddown",
      areaId: "sleep",
      title: "Wind-down — no screens",
      notes: "Ritual to protect sleep, not free capacity.",
      estimateMinutes: 20,
      status: "open",
      scheduledDate: today,
      dueDate: null,
      recurrence: "daily",
      reminder: "20:00",
    }),
  ];
}

export const DMV_CAPTURE_SUGGESTION: CaptureSuggestion = {
  title: "Renew DMV — needs smoke test",
  areaId: "chores",
  estimateMinutes: 150,
  notes: "Smog check required before renewal.",
  dueInDays: 4,
  defaultSchedule: "today",
  planSteps: [
    {
      title: "Find a smog check station nearby",
      estimateMinutes: 15,
      detail: "Compare wait times and ratings",
    },
    {
      title: "Drive + complete smoke test",
      estimateMinutes: 60,
      detail: "Bring registration and ID",
    },
    {
      title: "Renew registration online or at DMV",
      estimateMinutes: 45,
      detail: "Upload smog certificate",
    },
    {
      title: "Buffer for wait / traffic",
      estimateMinutes: 30,
    },
  ],
  buyTimeOptions: [
    {
      id: "mobile-smog",
      title: "Mobile smog service",
      costLabel: "~$80–120",
      timeSavedMinutes: 90,
      description: "They come to you — skip the drive and wait.",
    },
    {
      id: "concierge",
      title: "DMV concierge",
      costLabel: "~$150",
      timeSavedMinutes: 120,
      description: "Someone handles smog + paperwork end to end.",
    },
  ],
};

export const DEMO_CAPTURE_TEXT =
  "I have to renew DMV but it requires a smoke test";

export function createInitialAreas(): AreaDef[] {
  return PREDEFINED_AREAS.map((a) => ({
    ...a,
    blocks: a.blocks.map((b) => ({ ...b })),
  }));
}

export const DAYS_PATTERN_OPTIONS: { id: DaysPattern; label: string; hint: string }[] = [
  { id: "everyday", label: "Every day", hint: "Mon–Sun" },
  { id: "weekdays", label: "Weekdays", hint: "Mon–Fri only" },
  { id: "weekends", label: "Weekends", hint: "Sat–Sun only" },
];

export function daysPatternLabel(pattern: DaysPattern): string {
  return DAYS_PATTERN_OPTIONS.find((o) => o.id === pattern)?.label ?? "Every day";
}

/** Whether this life part has planned time on dateKey */
export function areaAppliesOnDate(area: AreaDef, dateKey: string): boolean {
  const day = parseDateKey(dateKey).getDay(); // 0 Sun … 6 Sat
  const pattern = area.daysPattern ?? "everyday";
  if (pattern === "everyday") return true;
  if (pattern === "weekdays") return day >= 1 && day <= 5;
  if (pattern === "weekends") return day === 0 || day === 6;
  return true;
}

export function activeDaysInWeek(area: AreaDef, weekStartKey?: string): number {
  const { start, end } = weekRange(weekStartKey ?? todayKey());
  let count = 0;
  for (let d = start; d <= end; d = addDays(d, 1)) {
    if (areaAppliesOnDate(area, d)) count += 1;
  }
  return count;
}

/** Planned hours for today or this week (respects weekdays/weekends). */
export function plannedHoursForArea(
  area: AreaDef,
  hoursPerActiveDay: number,
  window: TimeWindow,
  dateKey: string = todayKey(),
): number {
  if (window === "today") {
    return areaAppliesOnDate(area, dateKey) ? hoursPerActiveDay : 0;
  }
  return hoursPerActiveDay * activeDaysInWeek(area, dateKey);
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
  weights: { id: string; hours: number }[],
  sessions: Session[],
  window: TimeWindow,
  now: number = Date.now(),
): PlanActualRow[] {
  return weights.map((w) => {
    const area = areas.find((a) => a.id === w.id);
    const plannedHours = area
      ? plannedHoursForArea(area, w.hours, window)
      : w.hours * (window === "today" ? 1 : 7);
    const actualHours = actualHoursForArea(sessions, w.id, window, now);
    return {
      areaId: w.id,
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
  area: AreaDef,
  now: number = Date.now(),
): boolean {
  // No plan on this day (e.g. Work on Saturday)
  if (!areaAppliesOnDate(area, toDateKey(new Date(now)))) return false;

  const blocks = area.blocks ?? [];
  if (blocks.length === 0) {
    // No clock plan — don't assume they're done for the day on a casual stop
    return false;
  }

  const nowDate = new Date(now);
  const minutesNow =
    nowDate.getHours() * 60 + nowDate.getMinutes() + nowDate.getSeconds() / 60;

  let lastEndMinutes = -1;
  for (const block of blocks) {
    const start = parseTimeToMinutes(block.start);
    let end = parseTimeToMinutes(block.end);
    // Overnight block (sleep): ends next morning — "done for the day" after that morning end
    if (end <= start) {
      // If we're still before end (e.g. 5am during 10pm–6am), not past
      // Last end for "today's cycle" is end time in the morning
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
  weights: { id: string; hours: number }[],
  sessions: Session[],
  protectedIds: string[],
  now: number = Date.now(),
): RebalanceOffer | null {
  const stoppedArea = areas.find((a) => a.id === stoppedAreaId);
  const stoppedWeight = weights.find((w) => w.id === stoppedAreaId);
  if (!stoppedArea || !stoppedWeight) return null;

  // Waking up ≠ free time to redistribute
  if (stoppedArea.id === "sleep") return null;

  // Switching mid-day (chore during work) — not "done for the day"
  if (!isPastPlannedBlocksToday(stoppedArea, now)) return null;

  const planned = plannedHoursForArea(stoppedArea, stoppedWeight.hours, "today");
  const actual = actualHoursForArea(sessions, stoppedAreaId, "today", now);
  const freeHours = planned - actual;
  if (freeHours < FREE_TIME_MIN_HOURS) return null;

  let suggestions: RebalanceSuggestion[] = weights
    .filter((w) => w.id !== stoppedAreaId)
    .map((w) => {
      const area = areas.find((a) => a.id === w.id);
      const actualH = actualHoursForArea(sessions, w.id, "today", now);
      const plannedH = area
        ? plannedHoursForArea(area, w.hours, "today")
        : w.hours;
      return {
        areaId: w.id,
        name: area?.name ?? w.id,
        color: area?.color ?? "#888",
        shortfallHours: plannedH - actualH,
        isProtected: protectedIds.includes(w.id),
      };
    })
    .filter((s) => {
      const area = areas.find((a) => a.id === s.areaId);
      return (
        s.shortfallHours >= FREE_TIME_MIN_HOURS &&
        (!area || areaAppliesOnDate(area, todayKey()))
      );
    })
    .sort((a, b) => {
      if (a.isProtected !== b.isProtected) return a.isProtected ? -1 : 1;
      return b.shortfallHours - a.shortfallHours;
    })
    .slice(0, 4);

  // If nothing is "short", still offer other life parts to use the free time
  if (suggestions.length === 0) {
    suggestions = weights
      .filter((w) => w.id !== stoppedAreaId)
      .map((w) => {
        const area = areas.find((a) => a.id === w.id);
        const actualH = actualHoursForArea(sessions, w.id, "today", now);
        const plannedH = area
          ? plannedHoursForArea(area, w.hours, "today")
          : w.hours;
        return {
          areaId: w.id,
          name: area?.name ?? w.id,
          color: area?.color ?? "#888",
          shortfallHours: Math.max(0, plannedH - actualH),
          isProtected: protectedIds.includes(w.id),
        };
      })
      .filter((s) => {
        const area = areas.find((a) => a.id === s.areaId);
        return area ? areaAppliesOnDate(area, todayKey()) : true;
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

/** Seed a short completed Work session earlier today for demo plan-vs-actual */
export function createSeedSessions(): Session[] {
  const now = Date.now();
  return [
    {
      id: "session-seed-work",
      targetType: "area",
      targetId: "work",
      areaId: "work",
      startedAt: now - 3 * 60 * 60 * 1000,
      endedAt: now - 2 * 60 * 60 * 1000,
    },
  ];
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

export const REMINDER_OPTIONS: { id: Reminder; label: string }[] = [
  { id: "none", label: "No reminder" },
  { id: "morning", label: "Morning" },
  { id: "09:00", label: "9:00 AM" },
  { id: "17:00", label: "5:00 PM" },
  { id: "evening", label: "Evening" },
  { id: "20:00", label: "8:00 PM" },
];

export function recurrenceLabel(recurrence: Recurrence): string {
  return RECURRENCE_OPTIONS.find((o) => o.id === recurrence)?.label ?? "Doesn’t repeat";
}

export function reminderLabel(reminder: Reminder): string {
  return REMINDER_OPTIONS.find((o) => o.id === reminder)?.label ?? "No reminder";
}

export function isRecurring(task: Task): boolean {
  return (task.recurrence ?? "none") !== "none";
}

function recurrenceAnchor(task: Task): string {
  return task.scheduledDate ?? task.dueDate ?? todayKey();
}

/** Whether this task has an open occurrence on dateKey. */
export function occursOnDate(task: Task, dateKey: string): boolean {
  if (task.status !== "open") return false;
  if (task.completedDates?.includes(dateKey)) return false;

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

export function tasksOnDate(tasks: Task[], dateKey: string): Task[] {
  return tasks
    .filter((t) => occursOnDate(t, dateKey))
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
  budgetHours: number,
  tasks: Task[],
  window: TimeWindow,
): AreaPressure {
  const capacity = plannedHoursForArea(area, budgetHours, window);
  const load = loadHoursForArea(tasks, area.id, window);
  const ratio = capacity > 0 ? load / capacity : load > 0 ? Infinity : 0;
  const free = Math.max(0, capacity - load);
  return {
    areaId: area.id,
    budgetHours,
    capacity,
    load,
    ratio: Number.isFinite(ratio) ? ratio : 2,
    free,
    overloaded: capacity > 0 ? load > capacity : load > 0,
  };
}

export function scheduleLabel(task: Task): string {
  if (isRecurring(task)) return recurrenceLabel(task.recurrence);
  if (!task.scheduledDate) return "Backlog";
  return formatDateLabel(task.scheduledDate);
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
  pressures: AreaPressure[],
  areas: AreaDef[],
  intents: IntentId[],
): CoachInsight {
  const overloaded = pressures
    .filter((p) => p.overloaded)
    .sort((a, b) => b.ratio - a.ratio)[0];

  const underusedProtected = pressures
    .filter((p) => {
      const area = areas.find((a) => a.id === p.areaId);
      return area && p.ratio < 0.25 && p.load < 1;
    })
    .sort((a, b) => a.ratio - b.ratio)[0];

  if (overloaded) {
    const area = areas.find((a) => a.id === overloaded.areaId);
    const name = area?.name ?? "An area";
    const overBy = formatHours(overloaded.load - overloaded.capacity);
    const wantsFamily =
      intents.includes("family") ||
      areas.some((a) => a.id === "family" && a.defaultProtected);

    return {
      headline: `${name} is overloaded`,
      body: wantsFamily
        ? `Over by ${overBy}. You wanted more Family — buy time on errands or offload.`
        : `Over by ${overBy}. Defer, delegate, or buy time to protect what matters.`,
      ctaLabel: `See ${name}`,
      ctaAreaId: overloaded.areaId,
    };
  }

  if (underusedProtected) {
    const area = areas.find((a) => a.id === underusedProtected.areaId);
    return {
      headline: `${area?.name ?? "This area"} has room`,
      body: `${formatHours(underusedProtected.free)} free in your budget. Protect it — don’t let chores steal it.`,
      ctaLabel: `Open ${area?.name ?? "area"}`,
      ctaAreaId: underusedProtected.areaId,
    };
  }

  return {
    headline: "Your life looks balanced",
    body: "Dump anything on your mind — we’ll place it and cost it in time.",
    ctaLabel: "Dump something",
  };
}

export function centerReadout(pressures: AreaPressure[], areas: AreaDef[]): string {
  const overloaded = pressures
    .filter((p) => p.overloaded)
    .sort((a, b) => b.ratio - a.ratio)[0];

  if (overloaded) {
    const area = areas.find((a) => a.id === overloaded.areaId);
    const overBy = formatHours(overloaded.load - overloaded.capacity);
    return `${area?.name ?? "An area"} over by ${overBy}`;
  }

  const freest = [...pressures]
    .filter((p) => p.free > 0)
    .sort((a, b) => b.free - a.free)[0];

  if (freest) {
    const area = areas.find((a) => a.id === freest.areaId);
    return `${area?.name ?? "An area"} has ${formatHours(freest.free)} free`;
  }

  return "Your life budget is set";
}
