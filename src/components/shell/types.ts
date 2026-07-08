export type MainSection =
  | "workspace"
  | "calendar"
  | "life-map"
  | "reminders"
  | "account"
  | "settings";

export type WorkspaceView =
  | "orbit"
  | "today"
  | "all"
  | "completed"
  | "trash"
  | { type: "area"; id: string };

export type SummaryFilters = {
  dateRange: "this-week" | "last-week" | "this-month";
  listFilter: "all" | string;
  statusFilter: "all" | "done" | "open";
  grouping: "completion" | "date" | "area";
  showNextPeriod: boolean;
};

export type RightPanelMode =
  | { kind: "closed" }
  | { kind: "task"; taskId: string }
  | { kind: "add"; mode: "ai" | "manual" };

export function isRightPanelOpen(mode: RightPanelMode): boolean {
  return mode.kind !== "closed";
}

export function selectedTaskIdFromPanel(mode: RightPanelMode): string | null {
  return mode.kind === "task" ? mode.taskId : null;
}

export function workspaceViewKey(view: WorkspaceView): string {
  if (typeof view === "object") return `area:${view.id}`;
  return view;
}

export function workspaceViewLabel(
  view: WorkspaceView,
  areaName?: string,
): string {
  if (typeof view === "object") return areaName ?? "Area";
  const labels: Record<"orbit" | "today" | "all" | "completed" | "trash", string> = {
    orbit: "Orbit",
    today: "Today",
    all: "All",
    completed: "Completed",
    trash: "Trash",
  };
  return labels[view];
}
