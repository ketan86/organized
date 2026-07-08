import type {
  CaptureSuggestion,
  Recurrence,
  Reminder,
  Task,
} from "@/lib/mock-data";
import type { PlacementResult } from "@/lib/scheduling/placement";

export type CaptureConfidence = "high" | "medium" | "low";

export type CreateTaskDraft = {
  suggestion: CaptureSuggestion;
  recurrence: Recurrence;
  reminder: Reminder;
  placement: PlacementResult;
  pinnedDate?: string | null;
};

export type CaptureActionResult =
  | {
      type: "create_task";
      draft: CreateTaskDraft;
      reasoning?: string;
      confidence?: CaptureConfidence;
    }
  | {
      type: "create_tasks";
      drafts: CreateTaskDraft[];
      reasoning?: string;
      confidence?: CaptureConfidence;
    }
  | {
      type: "clarify";
      question: string;
      options?: string[];
      reasoning?: string;
    }
  | {
      type: "schedule_task";
      task: Task;
      scheduledDate: string | null;
      reasoning?: string;
      confidence?: CaptureConfidence;
    }
  | {
      type: "complete_task";
      task: Task;
      occurrenceDate?: string;
      reasoning?: string;
      confidence?: CaptureConfidence;
    }
  | {
      type: "update_task";
      task: Task;
      preview: Task;
      reasoning?: string;
      confidence?: CaptureConfidence;
    }
  | {
      type: "delete_task";
      task: Task;
      reasoning?: string;
      confidence?: CaptureConfidence;
    };

export type ClarifyTurn = {
  question: string;
  answer: string;
};

export type AiCaptureResponse = {
  result: CaptureActionResult;
  provider: string;
};

export type CaptureConfirm =
  | {
      action: "create_task";
      draft: CreateTaskDraft;
      scheduledDate: string | null;
      scheduledTime: string | null;
      dueDate: string | null;
    }
  | {
      action: "create_tasks";
      drafts: Array<{
        draft: CreateTaskDraft;
        scheduledDate: string | null;
        scheduledTime: string | null;
        dueDate: string | null;
      }>;
    }
  | {
      action: "schedule_task";
      taskId: string;
      scheduledDate: string | null;
    }
  | {
      action: "complete_task";
      taskId: string;
      occurrenceDate?: string;
    }
  | {
      action: "update_task";
      taskId: string;
      preview: Task;
    }
  | {
      action: "delete_task";
      taskId: string;
    };

export type { PlacementResult };
