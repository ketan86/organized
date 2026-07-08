/**
 * End-to-end user journey test (no AI).
 * Simulates a week where priorities keep shifting and the app adapts.
 *
 * Run: npx tsx scripts/test-user-journey.ts
 */
import {
  addDays,
  buildRebalanceOffer,
  getAllAreaProgress,
  getAreaProgress,
  getRunningSession,
  isBacklogTask,
  isPastPlannedBlocksToday,
  isRecurring,
  occursOnDate,
  progressRollup,
  resolvePreferredTime,
  tasksOnDate,
  todayKey,
  type Task,
  type UsualWeekBlock,
} from "../src/lib/mock-data";
import { listReminderEntries as buildReminderEntries } from "../src/lib/notifications/reminder-entries";
import {
  canConfirmPlacement,
  capacityMinutesForAreaOnDate,
  placeTask,
  scheduledDateFromPlacement,
  scheduledTimeFromPlacement,
} from "../src/lib/scheduling/placement";
import { checkProtectedAreaFit } from "../src/lib/scheduling/protected-area";
import {
  loadBootstrap,
  saveUsualWeek,
  updateProfile,
  type BootstrapResponse,
} from "../src/server/repositories/bootstrap";
import {
  completeTask,
  createTask,
  deleteTask,
  updateTask,
} from "../src/server/repositories/tasks";
import {
  getRunningSession as getRunningSessionRepo,
  startTracking,
  stopTracking,
} from "../src/server/repositories/tracking-sessions";
const USER_ID = "bdf132b8-33d9-4665-8fab-640bdc800441";
const PREFIX = "[JOURNEY] ";
const CLEANUP_PREFIXES = ["[JOURNEY]", "[TEST]", "[UI-TEST]"];

type Result = { act: string; pass: boolean; detail: string };
const results: Result[] = [];

function assert(act: string, condition: boolean, detail: string) {
  results.push({ act, pass: condition, detail });
  console.log(`${condition ? "✓" : "✗"} ${act}: ${detail}`);
}

function reload(): BootstrapResponse {
  return loadBootstrap(USER_ID);
}

function cleanup(bootstrap: BootstrapResponse) {
  for (const task of bootstrap.tasks) {
    if (CLEANUP_PREFIXES.some((p) => task.title.startsWith(p))) {
      deleteTask(USER_ID, task.id);
    }
  }
  stopTracking(USER_ID);
}

function manualCreate(
  bootstrap: BootstrapResponse,
  title: string,
  opts: {
    areaId: string;
    estimateMinutes: number;
    explicitBacklog?: boolean;
    pinnedDate?: string | null;
    recurrence?: "none" | "weekly";
    reminder?: string;
  },
): Task {
  const area = bootstrap.areas.find((a) => a.id === opts.areaId)!;
  const pinned = opts.pinnedDate ?? null;
  const preferredTime = resolvePreferredTime({
    title: PREFIX + title,
    reminder: (opts.reminder ?? "none") as import("../src/lib/mock-data").Reminder,
    recurrence: opts.recurrence ?? "none",
    scheduledDate: pinned,
  });
  const placement = placeTask({
    usualWeek: bootstrap.usualWeek,
    tasks: bootstrap.tasks,
    areaId: opts.areaId,
    areaName: area.name,
    estimateMinutes: opts.estimateMinutes,
    dueDate: null,
    mode: opts.explicitBacklog
      ? "backlog"
      : opts.recurrence && opts.recurrence !== "none"
        ? "auto"
        : pinned
          ? "pinned"
          : "auto",
    pinnedDate: opts.recurrence !== "none" ? null : pinned,
    preferredTime,
  });

  if (!opts.explicitBacklog && !canConfirmPlacement(placement, !!opts.explicitBacklog)) {
    throw new Error(`Blocked: ${title} — ${placement.explanation}`);
  }

  const scheduledDate = opts.explicitBacklog
    ? null
    : opts.recurrence && opts.recurrence !== "none"
      ? (scheduledDateFromPlacement(placement) ?? todayKey())
      : scheduledDateFromPlacement(placement);

  const task = createTask(USER_ID, {
    areaId: opts.areaId,
    title: PREFIX + title,
    estimateMinutes: opts.estimateMinutes,
    scheduledDate,
    scheduledTime: scheduledTimeFromPlacement(placement),
    recurrence: opts.recurrence ?? "none",
    reminder: (opts.reminder as "none") ?? "none",
  });
  bootstrap.tasks.unshift(task);
  return task;
}

function fillAreaOnDate(
  bootstrap: BootstrapResponse,
  areaId: string,
  dateKey: string,
  label: string,
): number {
  const capacity = capacityMinutesForAreaOnDate(
    bootstrap.usualWeek,
    areaId,
    dateKey,
  );
  if (capacity <= 0) return 0;

  const existing = bootstrap.tasks
    .filter((t) => t.areaId === areaId && t.scheduledDate === dateKey)
    .reduce((s, t) => s + t.estimateMinutes, 0);
  let remaining = capacity - existing;
  if (remaining <= 0) return 0;

  const CHUNK = 30;
  let filled = 0;
  while (remaining > 0) {
    const chunk = Math.min(CHUNK, remaining);
    try {
      manualCreate(bootstrap, `${label} ${dateKey} +${filled}`, {
        areaId,
        estimateMinutes: chunk,
        pinnedDate: dateKey,
      });
      filled += chunk;
      remaining -= chunk;
    } catch {
      break;
    }
  }
  return filled;
}

function eveningAfterWork(now = new Date("2026-07-07T17:30:00")): number {
  return now.getTime();
}

async function main() {
  let bootstrap = reload();
  const originalUsualWeek = bootstrap.usualWeek;
  const originalTimeWindow = bootstrap.timeWindow;
  cleanup(bootstrap);
  bootstrap = reload();

  const today = todayKey();
  const selectedAreas = bootstrap.areas.filter((a) =>
    bootstrap.selectedIds.includes(a.id),
  );

  console.log("\n═══ User journey test (no AI) ═══");
  console.log(`User ${USER_ID} · ${today} · ${bootstrap.tasks.length} tasks after cleanup\n`);

  // ── Act 1: Monday morning — capture the week's intentions ──
  const presentation = manualCreate(bootstrap, "Client presentation prep", {
    areaId: "work",
    estimateMinutes: 120,
  });
  assert(
    "Act 1 · plan work",
    presentation.scheduledDate !== null && presentation.areaId === "work",
    `presentation on ${presentation.scheduledDate}`,
  );

  const haircut = manualCreate(bootstrap, "Haircut", {
    areaId: "personal",
    estimateMinutes: 30,
  });
  assert(
    "Act 1 · plan personal",
    haircut.scheduledDate === today,
    `haircut today ${haircut.scheduledDate}`,
  );

  const garage = manualCreate(bootstrap, "Organize garage", {
    areaId: "chores",
    estimateMinutes: 60,
    explicitBacklog: true,
  });
  assert(
    "Act 1 · someday chore",
    garage.scheduledDate === null && isBacklogTask(garage),
    "garage unscheduled backlog",
  );

  const spanish = manualCreate(bootstrap, "Spanish practice", {
    areaId: "learning",
    estimateMinutes: 45,
    recurrence: "weekly",
  });
  assert(
    "Act 1 · recurring learning",
    spanish.recurrence === "weekly" && spanish.scheduledDate !== null,
    `Spanish weekly from ${spanish.scheduledDate}`,
  );

  // ── Act 2: Fire drill — urgent bugfix lands ──
  const bugfix = manualCreate(bootstrap, "Urgent production bugfix", {
    areaId: "work",
    estimateMinutes: 90,
  });
  assert(
    "Act 2 · urgent work fits somewhere",
    bugfix.scheduledDate !== null,
    `bugfix placed ${bugfix.scheduledDate}`,
  );

  const workProgressBefore = getAreaProgress(
    bootstrap.areas.find((a) => a.id === "work")!,
    bootstrap.usualWeek,
    bootstrap.tasks,
    bootstrap.sessions,
    "today",
  );
  assert(
    "Act 2 · work shows load",
    workProgressBefore.openLoadHours > 0,
    `${workProgressBefore.openLoadHours.toFixed(1)}h on plate today`,
  );

  // ── Act 3: Boss moves presentation — reschedule via task settings ──
  const wed = addDays(today, 2);
  const rescheduled = updateTask(USER_ID, presentation.id, {
    scheduledDate: wed,
  });
  bootstrap = reload();
  assert(
    "Act 3 · reschedule presentation",
    rescheduled.scheduledDate === wed,
    `moved to ${rescheduled.scheduledDate}`,
  );
  assert(
    "Act 3 · frees today capacity",
    !tasksOnDate(bootstrap.tasks, today).some((t) => t.id === presentation.id),
    "presentation off today's calendar",
  );
  assert(
    "Act 3 · appears on new day",
    tasksOnDate(bootstrap.tasks, wed).some((t) => t.id === presentation.id),
    `on ${wed}`,
  );

  // ── Act 4: Quick win — mark personal task done ──
  const doneHaircut = completeTask(USER_ID, haircut.id);
  bootstrap = reload();
  assert(
    "Act 4 · complete haircut",
    doneHaircut.status === "done",
    "marked done",
  );

  const personalProgress = getAreaProgress(
    bootstrap.areas.find((a) => a.id === "personal")!,
    bootstrap.usualWeek,
    bootstrap.tasks,
    bootstrap.sessions,
    "today",
  );
  assert(
    "Act 4 · personal progress reflects completion",
    personalProgress.completedHours > 0,
    `${personalProgress.completedHours.toFixed(1)}h completed`,
  );

  // ── Act 5: Recurring occurrence done for this week ──
  const spanishOccurrence = spanish.scheduledDate ?? today;
  const doneSpanish = completeTask(USER_ID, spanish.id, spanishOccurrence);
  assert(
    "Act 5 · complete recurring occurrence",
    isRecurring(doneSpanish) &&
      (doneSpanish.completedDates ?? []).includes(spanishOccurrence),
    `occurrence ${spanishOccurrence} logged`,
  );
  assert(
    "Act 5 · recurring still open",
    doneSpanish.status === "open",
    "task stays open for next week",
  );

  // ── Act 6: Calendar-style move — pull garage from backlog to Thursday ──
  const thu = addDays(today, 3);
  const movedGarage = updateTask(USER_ID, garage.id, { scheduledDate: thu });
  bootstrap = reload();
  assert(
    "Act 6 · calendar reschedule backlog",
    movedGarage.scheduledDate === thu && !isBacklogTask(movedGarage),
    `garage now ${thu}`,
  );

  // ── Act 7: Reminder on high-stakes task ──
  const reminded = updateTask(USER_ID, presentation.id, { reminder: "morning" });
  bootstrap = reload();
  const reminders = buildReminderEntries(
    bootstrap.tasks,
    selectedAreas,
    new Date(`${today}T12:00:00`),
  );
  assert(
    "Act 7 · morning reminder listed",
    reminded.reminder === "morning" &&
      reminders.some((r) => r.taskId === presentation.id),
    `${reminders.filter((r) => r.taskId === presentation.id).length} entries`,
  );

  // ── Act 8: Protected area — admin task doesn't belong in Family ──
  const familyCheck = checkProtectedAreaFit(
    "family",
    "Call VHS about insurance claim",
    selectedAreas,
    bootstrap.protectedIds,
  );
  assert(
    "Act 8 · family protected mismatch",
    !familyCheck.ok,
    familyCheck.ok ? "unexpected pass" : familyCheck.question.slice(0, 60) + "…",
  );
  const adminTask = manualCreate(bootstrap, "VHS insurance call", {
    areaId: !familyCheck.ok ? familyCheck.suggestedAreaId : "chores",
    estimateMinutes: 30,
  });
  assert(
    "Act 8 · rerouted to chores",
    adminTask.areaId === "chores",
    `saved in ${adminTask.areaId}`,
  );

  // ── Act 9: Work overload — can't add more without adapting ──
  bootstrap = reload();
  const horizonEnd = addDays(today, 30);
  for (let d = today; d <= horizonEnd; d = addDays(d, 1)) {
    const cap = capacityMinutesForAreaOnDate(bootstrap.usualWeek, "work", d);
    if (cap <= 0) continue;
    fillAreaOnDate(bootstrap, "work", d, "fill work");
    bootstrap = reload();
  }
  const overloadPlacement = placeTask({
    usualWeek: bootstrap.usualWeek,
    tasks: bootstrap.tasks,
    areaId: "work",
    areaName: "Work",
    estimateMinutes: 60,
    dueDate: null,
    mode: "auto",
  });
  assert(
    "Act 9 · work overload detected",
    overloadPlacement.status === "unachievable",
    overloadPlacement.explanation.slice(0, 70) + "…",
  );
  assert(
    "Act 9 · overload blocks auto save",
    !canConfirmPlacement(overloadPlacement, false),
    "hard block active",
  );

  const somedayOverflow = manualCreate(bootstrap, "Defer extra report", {
    areaId: "work",
    estimateMinutes: 60,
    explicitBacklog: true,
  });
  assert(
    "Act 9 · someday bypasses overload",
    somedayOverflow.scheduledDate === null,
    "saved to backlog despite full work",
  );

  // ── Act 10: User adapts — add Wednesday overtime block, room opens ──
  const wedExtra = addDays(today, 1);
  const wedDow = new Date(`${wedExtra}T12:00:00`).getDay();
  const extraBlocks: UsualWeekBlock[] = [
    ...bootstrap.usualWeek,
    {
      id: `journey-extra-${wedExtra}`,
      areaId: "work",
      dayOfWeek: wedDow,
      start: "16:00",
      end: "18:00",
    },
  ];
  saveUsualWeek(USER_ID, extraBlocks);
  bootstrap = reload();
  const wedCap = capacityMinutesForAreaOnDate(
    bootstrap.usualWeek,
    "work",
    wedExtra,
  );
  assert(
    "Act 10 · expanded capacity",
    wedCap >= 120,
    `${wedCap}min on ${wedExtra}`,
  );

  const wedTask = manualCreate(bootstrap, "Extra report (Wednesday overtime)", {
    areaId: "work",
    estimateMinutes: 60,
    pinnedDate: wedExtra,
  });
  assert(
    "Act 10 · fits after schedule change",
    wedTask.scheduledDate === wedExtra,
    `placed ${wedTask.scheduledDate}`,
  );

  // ── Act 11: Time window — today vs week view ──
  updateProfile(USER_ID, { timeWindow: "week" });
  bootstrap = reload();
  assert(
    "Act 11 · week window persisted",
    bootstrap.timeWindow === "week",
    "profile timeWindow=week",
  );

  const workToday = getAreaProgress(
    bootstrap.areas.find((a) => a.id === "work")!,
    bootstrap.usualWeek,
    bootstrap.tasks,
    bootstrap.sessions,
    "today",
  );
  const workWeek = getAreaProgress(
    bootstrap.areas.find((a) => a.id === "work")!,
    bootstrap.usualWeek,
    bootstrap.tasks,
    bootstrap.sessions,
    "week",
  );
  assert(
    "Act 11 · week load >= today load",
    workWeek.openLoadHours >= workToday.openLoadHours,
    `today ${workToday.openLoadHours.toFixed(1)}h · week ${workWeek.openLoadHours.toFixed(1)}h`,
  );

  updateProfile(USER_ID, { timeWindow: "today" });
  bootstrap = reload();

  // ── Act 12: Tracking — start work, switch to family ──
  startTracking(USER_ID, {
    targetType: "area",
    targetId: "work",
    areaId: "work",
  });
  bootstrap = reload();
  let running = getRunningSession(bootstrap.sessions);
  assert(
    "Act 12 · tracking work",
    running?.areaId === "work",
    `session ${running?.id}`,
  );

  startTracking(USER_ID, {
    targetType: "area",
    targetId: "family",
    areaId: "family",
  });
  bootstrap = reload();
  running = getRunningSession(bootstrap.sessions);
  const runningCount = bootstrap.sessions.filter((s) => !s.endedAt).length;
  assert(
    "Act 12 · switch stops prior session",
    running?.areaId === "family" && runningCount === 1,
    `now tracking ${running?.areaId}`,
  );

  stopTracking(USER_ID);
  bootstrap = reload();
  assert(
    "Act 12 · stop tracking",
    getRunningSession(bootstrap.sessions) === null,
    "no active session",
  );

  // ── Act 13: Rebalance offer after work day ends ──
  const evening = eveningAfterWork();
  const pastBlocks = isPastPlannedBlocksToday(
    bootstrap.usualWeek,
    "work",
    evening,
  );
  const offer = buildRebalanceOffer(
    "work",
    selectedAreas,
    bootstrap.usualWeek,
    bootstrap.sessions,
    bootstrap.protectedIds,
    evening,
  );
  assert(
    "Act 13 · past work blocks (evening)",
    pastBlocks,
    "simulated 5:30pm after 4pm block end",
  );
  assert(
    "Act 13 · rebalance offer",
    offer !== null && offer.suggestions.length > 0,
    offer
      ? `${offer.suggestions.length} suggestions · protected first: ${offer.suggestions[0]?.isProtected}`
      : "no offer",
  );
  if (offer) {
    const protectedFirst = offer.suggestions[0]?.isProtected;
    assert(
      "Act 13 · protected areas prioritized",
      offer.suggestions.some((s) => s.isProtected) ? protectedFirst === true : true,
      protectedFirst ? "family/sleep first" : "no protected shortfalls",
    );
  }

  // ── Act 14: Orbit rollup — overloaded work visible ──
  const rollup = progressRollup(
    getAllAreaProgress(
      selectedAreas,
      bootstrap.usualWeek,
      bootstrap.tasks,
      bootstrap.sessions,
      "week",
      evening,
    ),
  );
  assert(
    "Act 14 · orbit rollup",
    rollup.withGoal > 0,
    `${rollup.goalsMet}/${rollup.withGoal} goals met · ${rollup.overloaded} overloaded`,
  );

  // ── Act 15: Priority dropped — delete deferred task ──
  deleteTask(USER_ID, somedayOverflow.id);
  bootstrap = reload();
  assert(
    "Act 15 · delete deferred",
    !bootstrap.tasks.some((t) => t.id === somedayOverflow.id),
    "overflow task removed",
  );

  // ── Act 16: Recurrence change on existing task ──
  const dailyStandup = manualCreate(bootstrap, "Team standup notes", {
    areaId: "work",
    estimateMinutes: 15,
    pinnedDate: today,
  });
  const recurringStandup = updateTask(USER_ID, dailyStandup.id, {
    recurrence: "weekdays",
    scheduledDate: today,
  });
  assert(
    "Act 16 · weekdays recurrence",
    recurringStandup.recurrence === "weekdays",
    "standup now weekdays",
  );

  // ── Act 17: Placement after priority shuffle still coherent ──
  bootstrap = reload();
  const healthPin = addDays(today, 5);
  const healthPlacement = placeTask({
    usualWeek: bootstrap.usualWeek,
    tasks: bootstrap.tasks,
    areaId: "health",
    areaName: "Health",
    estimateMinutes: 30,
    dueDate: null,
    mode: "pinned",
    pinnedDate: healthPin,
  });
  assert(
    "Act 17 · health pinned still works",
    healthPlacement.status === "placed" || healthPlacement.status === "shifted",
    healthPlacement.explanation.slice(0, 80),
  );
  if (healthPlacement.status === "placed") {
    assert(
      "Act 17 · health time in morning window",
      healthPlacement.scheduledTime.startsWith("06:30"),
      healthPlacement.scheduledTime,
    );
  }

  const yogaPlacement = placeTask({
    usualWeek: bootstrap.usualWeek,
    tasks: bootstrap.tasks,
    areaId: "health",
    areaName: "Health",
    estimateMinutes: 30,
    dueDate: null,
    mode: "pinned",
    pinnedDate: today,
    preferredTime: resolvePreferredTime({
      title: PREFIX + "3pm yoga",
      reminder: "none",
      recurrence: "none",
      scheduledDate: today,
    }),
  });
  assert(
    "Act 18 · 3pm outside health window",
    yogaPlacement.status === "unachievable",
    yogaPlacement.explanation.slice(0, 100),
  );

  // ── Summary ──
  saveUsualWeek(USER_ID, originalUsualWeek);
  updateProfile(USER_ID, { timeWindow: originalTimeWindow });
  stopTracking(USER_ID);

  const passed = results.filter((r) => r.pass).length;
  const failed = results.filter((r) => !r.pass);
  console.log(`\n═══ ${passed}/${results.length} passed ═══`);
  if (failed.length) {
    console.log("\nFailed:");
    for (const f of failed) console.log(`  • ${f.act}: ${f.detail}`);
    process.exit(1);
  }

  console.log(`\n${bootstrap.tasks.filter((t) => t.title.startsWith(PREFIX)).length} [JOURNEY] tasks remain for UI inspection.`);
  console.log("Cleanup: sqlite3 data/organized.db \"DELETE FROM tasks WHERE title LIKE '[JOURNEY]%';\"");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
