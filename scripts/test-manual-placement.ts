/**
 * End-to-end placement tests mirroring ManualTaskSheet save logic.
 * Run: npx tsx scripts/test-manual-placement.ts
 */
import { addDays, eachDayInRange, resolvePreferredTime, todayKey } from "../src/lib/mock-data";
import {
  canConfirmPlacement,
  capacityMinutesForAreaOnDate,
  placeTask,
  scheduledDateFromPlacement,
  scheduledTimeFromPlacement,
} from "../src/lib/scheduling/placement";
import { checkProtectedAreaFit } from "../src/lib/scheduling/protected-area";
import { loadBootstrap } from "../src/server/repositories/bootstrap";
import {
  createTask,
  deleteTask,
  type CreateTaskInput,
} from "../src/server/repositories/tasks";

const USER_ID = "bdf132b8-33d9-4665-8fab-640bdc800441";
const TEST_PREFIX = "[TEST] ";

type ScenarioResult = {
  name: string;
  pass: boolean;
  detail: string;
};

const results: ScenarioResult[] = [];

function assert(name: string, condition: boolean, detail: string) {
  results.push({ name, pass: condition, detail });
  const mark = condition ? "✓" : "✗";
  console.log(`${mark} ${name}: ${detail}`);
}

function manualPlacement(
  bootstrap: ReturnType<typeof loadBootstrap>,
  input: {
    areaId: string;
    estimateMinutes: number;
    explicitBacklog: boolean;
    pinnedDateOverride: string | null;
    recurrence?: "none" | "weekly";
    reminderDateKey?: string | null;
    title?: string;
    reminder?: string;
  },
) {
  const area = bootstrap.areas.find((a) => a.id === input.areaId);
  if (!area) throw new Error(`Unknown area ${input.areaId}`);

  const recurrence = input.recurrence ?? "none";
  const pinned =
    input.pinnedDateOverride ?? input.reminderDateKey ?? null;
  const mode =
    recurrence !== "none"
      ? "auto"
      : input.explicitBacklog
        ? "backlog"
        : pinned
          ? "pinned"
          : "auto";
  const preferredTime = resolvePreferredTime({
    title: input.title ?? "",
    reminder: (input.reminder ?? "none") as import("../src/lib/mock-data").Reminder,
    recurrence,
    scheduledDate: pinned,
  });

  return placeTask({
    usualWeek: bootstrap.usualWeek,
    tasks: bootstrap.tasks,
    areaId: input.areaId,
    areaName: area.name,
    estimateMinutes: input.estimateMinutes,
    dueDate: null,
    mode,
    pinnedDate: recurrence !== "none" ? null : pinned,
    preferredTime,
    reminderDateKey: input.reminderDateKey ?? null,
  });
}

function manualSave(
  bootstrap: ReturnType<typeof loadBootstrap>,
  title: string,
  input: Parameters<typeof manualPlacement>[1],
): { task: ReturnType<typeof createTask>; placement: ReturnType<typeof placeTask> } {
  const placement = manualPlacement(bootstrap, { ...input, title });
  const explicitBacklog = input.explicitBacklog;
  const canSave =
    canConfirmPlacement(placement, explicitBacklog) &&
    (!input.recurrence || input.recurrence === "none" || true);

  if (!canSave) {
    throw new Error(`Blocked save for ${title}: ${placement.explanation}`);
  }

  const scheduledDate =
    input.recurrence && input.recurrence !== "none"
      ? (scheduledDateFromPlacement(placement) ?? todayKey())
      : explicitBacklog
        ? null
        : scheduledDateFromPlacement(placement);

  const payload: CreateTaskInput = {
    areaId: input.areaId,
    title: TEST_PREFIX + title,
    estimateMinutes: input.estimateMinutes,
    scheduledDate,
    scheduledTime: scheduledTimeFromPlacement(placement),
    recurrence: input.recurrence ?? "none",
    reminder: "none",
  };

  const task = createTask(USER_ID, payload);
  bootstrap.tasks.unshift(task);
  return { task, placement };
}

function cleanup(bootstrap: ReturnType<typeof loadBootstrap>) {
  for (const task of [...bootstrap.tasks]) {
    if (task.title.startsWith(TEST_PREFIX)) {
      deleteTask(USER_ID, task.id);
    }
  }
}

function fillAreaOnDate(
  bootstrap: ReturnType<typeof loadBootstrap>,
  areaId: string,
  dateKey: string,
  label: string,
) {
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
      const { task } = manualSave(
        bootstrap,
        `${label} fill ${dateKey} +${filled}`,
        {
          areaId,
          estimateMinutes: chunk,
          explicitBacklog: false,
          pinnedDateOverride: dateKey,
        },
      );
      filled += task.estimateMinutes;
      remaining -= task.estimateMinutes;
    } catch {
      break;
    }
  }
  return filled;
}

function main() {
  let bootstrap = loadBootstrap(USER_ID);
  cleanup(bootstrap);
  bootstrap = loadBootstrap(USER_ID);

  const today = todayKey();
  const workArea = bootstrap.areas.find((a) => a.id === "work");
  const workCapacityToday = capacityMinutesForAreaOnDate(
    bootstrap.usualWeek,
    "work",
    today,
  );

  console.log(`\nUser: ${USER_ID}`);
  console.log(`Today: ${today} · Work capacity today: ${workCapacityToday} min`);
  console.log(`Protected areas: ${bootstrap.protectedIds.join(", ")}\n`);

  // 1. Auto-place (Use suggestion)
  {
    const placement = manualPlacement(bootstrap, {
      areaId: "personal",
      estimateMinutes: 30,
      explicitBacklog: false,
      pinnedDateOverride: null,
    });
    assert(
      "auto-place",
      placement.status === "placed",
      `${placement.status} → ${placement.status === "placed" ? placement.scheduledDate : placement.explanation}`,
    );
    const { task, placement: p2 } = manualSave(bootstrap, "auto-place personal 30m", {
      areaId: "personal",
      estimateMinutes: 30,
      explicitBacklog: false,
      pinnedDateOverride: null,
    });
    assert(
      "auto-place saved",
      task.scheduledDate === scheduledDateFromPlacement(p2),
      `scheduled ${task.scheduledDate}`,
    );
  }

  // 2. Someday / backlog
  {
    const placement = manualPlacement(bootstrap, {
      areaId: "chores",
      estimateMinutes: 45,
      explicitBacklog: true,
      pinnedDateOverride: null,
    });
    assert("someday", placement.status === "backlog", placement.explanation);
    const { task } = manualSave(bootstrap, "someday chores 45m", {
      areaId: "chores",
      estimateMinutes: 45,
      explicitBacklog: true,
      pinnedDateOverride: null,
    });
    assert("someday saved", task.scheduledDate === null, `scheduled ${task.scheduledDate}`);
  }

  // 3. Pick date — fits on pinned day
  {
    const pin = addDays(today, 3);
    const placement = manualPlacement(bootstrap, {
      areaId: "health",
      estimateMinutes: 30,
      explicitBacklog: false,
      pinnedDateOverride: pin,
    });
    const ok =
      placement.status === "placed" && placement.scheduledDate === pin;
    assert(
      "pinned-placed",
      ok,
      `${placement.status} on ${placement.status === "placed" || placement.status === "shifted" ? ("scheduledDate" in placement ? placement.scheduledDate : "?") : "n/a"} (wanted ${pin})`,
    );
    if (ok) {
      manualSave(bootstrap, "pinned health 30m", {
        areaId: "health",
        estimateMinutes: 30,
        explicitBacklog: false,
        pinnedDateOverride: pin,
      });
    }
  }

  // 4. Shifted — pin today when nearly full
  if (workCapacityToday > 45) {
    const filled = fillAreaOnDate(
      bootstrap,
      "work",
      today,
      "shift-setup",
    );
    const placement = manualPlacement(bootstrap, {
      areaId: "work",
      estimateMinutes: 30,
      explicitBacklog: false,
      pinnedDateOverride: today,
    });
    assert(
      "shifted",
      placement.status === "shifted",
      `filled ${filled}m · ${placement.explanation}`,
    );
    if (placement.status === "shifted") {
      const { task } = manualSave(bootstrap, "shifted work 30m", {
        areaId: "work",
        estimateMinutes: 30,
        explicitBacklog: false,
        pinnedDateOverride: today,
      });
      assert(
        "shifted saved",
        task.scheduledDate === placement.scheduledDate,
        `requested ${today} → saved ${task.scheduledDate}`,
      );
    }
  } else {
    assert(
      "shifted",
      false,
      `Skipped — work capacity today only ${workCapacityToday}m`,
    );
  }

  // 5. Unachievable — fill work horizon then block
  {
    const horizonEnd = addDays(today, 30);
    for (const dateKey of eachDayInRange(today, horizonEnd)) {
      fillAreaOnDate(bootstrap, "work", dateKey, "block");
    }
    const placement = manualPlacement(bootstrap, {
      areaId: "work",
      estimateMinutes: 60,
      explicitBacklog: false,
      pinnedDateOverride: null,
    });
    const blocked = placement.status === "unachievable";
    assert("unachievable", blocked, placement.explanation);
    const canSave = canConfirmPlacement(placement, false);
    assert("unachievable blocks save", !canSave, `canSave=${canSave}`);

    let threw = false;
    try {
      manualSave(bootstrap, "unachievable work 60m", {
        areaId: "work",
        estimateMinutes: 60,
        explicitBacklog: false,
        pinnedDateOverride: null,
      });
    } catch {
      threw = true;
    }
    assert("unachievable throws on save", threw, threw ? "save blocked" : "save incorrectly allowed");
  }

  // 6. Protected area mismatch
  {
    const check = checkProtectedAreaFit(
      "family",
      "Submit insurance claim form",
      bootstrap.areas.filter((a) => bootstrap.selectedIds.includes(a.id)),
      bootstrap.protectedIds,
    );
    assert(
      "protected-mismatch",
      !check.ok,
      check.ok ? "expected mismatch" : check.question,
    );

    const suggested = !check.ok ? check.suggestedAreaId : "chores";
    const { task } = manualSave(bootstrap, "protected rerouted to chores", {
      areaId: suggested,
      estimateMinutes: 30,
      explicitBacklog: false,
      pinnedDateOverride: null,
    });
    assert(
      "protected reroute saved",
      task.areaId === suggested,
      `area=${task.areaId}`,
    );
  }

  // 7. Recurring — first occurrence auto-placed
  {
    const placement = manualPlacement(bootstrap, {
      areaId: "learning",
      estimateMinutes: 45,
      explicitBacklog: false,
      pinnedDateOverride: null,
      recurrence: "weekly",
    });
    assert(
      "recurring placement",
      placement.status === "placed" || placement.status === "shifted",
      placement.explanation,
    );
    const { task } = manualSave(bootstrap, "recurring learning weekly", {
      areaId: "learning",
      estimateMinutes: 45,
      explicitBacklog: false,
      pinnedDateOverride: null,
      recurrence: "weekly",
    });
    assert(
      "recurring saved with date",
      task.scheduledDate !== null && task.recurrence === "weekly",
      `scheduled ${task.scheduledDate} · ${task.recurrence}`,
    );
  }

  // 8. Time outside life-area window
  {
    const placement = manualPlacement(bootstrap, {
      areaId: "health",
      estimateMinutes: 30,
      explicitBacklog: false,
      pinnedDateOverride: todayKey(),
      title: "3pm yoga",
    });
    assert(
      "3pm outside health window",
      placement.status === "unachievable",
      placement.explanation,
    );
  }

  // 9. Auto time inside window
  {
    const placement = manualPlacement(bootstrap, {
      areaId: "health",
      estimateMinutes: 30,
      explicitBacklog: false,
      pinnedDateOverride: null,
      title: "Morning stretch",
    });
    assert(
      "health auto time in window",
      placement.status === "placed",
      placement.explanation,
    );
    if (placement.status === "placed") {
      assert(
        "health scheduled at 6:30am",
        placement.scheduledTime.startsWith("06:30"),
        placement.scheduledTime,
      );
    }
  }

  const passed = results.filter((r) => r.pass).length;
  const failed = results.filter((r) => !r.pass);
  console.log(`\n--- ${passed}/${results.length} passed ---`);
  if (failed.length > 0) {
    console.log("\nFailed:");
    for (const f of failed) console.log(`  - ${f.name}: ${f.detail}`);
    cleanup(loadBootstrap(USER_ID));
    process.exit(1);
  }
  cleanup(loadBootstrap(USER_ID));
  console.log("Cleaned up [TEST] tasks.");
}

main();
