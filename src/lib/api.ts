import type { AreaWeight } from "@/components/screens/onboarding/WeightageScreen";
import type { BootstrapResponse } from "@/lib/app-state";
import type {
  AreaDef,
  IntentId,
  Session,
  Task,
  TimeWindow,
  UsualWeekBlock,
} from "@/lib/mock-data";
import type {
  AiCaptureResponse,
  ClarifyTurn,
} from "@/lib/ai-capture";
import type { CreateTaskInput, UpdateTaskInput } from "@/server/repositories/tasks";
import type { StartTrackingInput } from "@/server/repositories/tracking-sessions";

export type PublicUser = {
  id: string;
  email: string;
  onboardingComplete: boolean;
};

async function request<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const response = await fetch(path, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as {
      error?: string;
    } | null;
    throw new Error(payload?.error ?? `Request failed (${response.status})`);
  }

  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

export type AiStatusResponse = {
  configured: boolean;
  provider: string;
  model: string;
  setupHint: string | null;
};

export type { AiCaptureResponse, ClarifyTurn };

async function requestMultipart<T>(path: string, form: FormData): Promise<T> {
  const response = await fetch(path, {
    method: "POST",
    body: form,
    cache: "no-store",
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as {
      error?: string;
    } | null;
    throw new Error(payload?.error ?? `Request failed (${response.status})`);
  }

  return (await response.json()) as T;
}

export const api = {
  auth: {
    me: () => request<{ user: PublicUser | null }>("/api/auth/me"),
    login: (email: string, password: string) =>
      request<{ user: PublicUser }>("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      }),
    register: (email: string, password: string) =>
      request<{ user: PublicUser }>("/api/auth/register", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      }),
    logout: () =>
      request<{ ok: boolean }>("/api/auth/logout", { method: "POST" }),
  },
  bootstrap: () => request<BootstrapResponse>("/api/bootstrap"),
  ai: {
    status: () => request<AiStatusResponse>("/api/ai/status"),
    captureText: (text: string, clarifyHistory?: ClarifyTurn[]) =>
      request<AiCaptureResponse>("/api/ai/capture", {
        method: "POST",
        body: JSON.stringify({ text, clarifyHistory }),
      }),
    captureImage: (file: File, text?: string, clarifyHistory?: ClarifyTurn[]) => {
      const form = new FormData();
      if (text?.trim()) form.append("text", text.trim());
      if (clarifyHistory?.length) {
        form.append("clarifyHistory", JSON.stringify(clarifyHistory));
      }
      form.append("image", file);
      return requestMultipart<AiCaptureResponse>("/api/ai/capture", form);
    },
  },
  profile: {
    patch: (body: {
      intents?: IntentId[];
      timeWindow?: TimeWindow;
      onboardingComplete?: boolean;
    }) =>
      request<{ ok: boolean }>("/api/profile", {
        method: "PATCH",
        body: JSON.stringify(body),
      }),
    reset: () =>
      request<{ ok: boolean }>("/api/profile/reset", { method: "POST" }),
  },
  areas: {
    put: (body: {
      areas: AreaDef[];
      selectedIds: string[];
      weights: AreaWeight[];
      protectedIds: string[];
    }) =>
      request<{ ok: boolean }>("/api/areas", {
        method: "PUT",
        body: JSON.stringify(body),
      }),
  },
  usualWeek: {
    put: (blocks: UsualWeekBlock[]) =>
      request<{ ok: boolean }>("/api/usual-week", {
        method: "PUT",
        body: JSON.stringify({ blocks }),
      }),
  },
  tasks: {
    create: (input: CreateTaskInput) =>
      request<{ task: Task }>("/api/tasks", {
        method: "POST",
        body: JSON.stringify(input),
      }),
    update: (id: string, input: UpdateTaskInput) =>
      request<{ task: Task }>(`/api/tasks/${id}`, {
        method: "PATCH",
        body: JSON.stringify(input),
      }),
    complete: (id: string, occurrenceDate?: string) =>
      request<{ task: Task }>(`/api/tasks/${id}/complete`, {
        method: "POST",
        body: JSON.stringify({ occurrenceDate }),
      }),
    delete: (id: string) =>
      request<{ ok: boolean }>(`/api/tasks/${id}`, { method: "DELETE" }),
  },
  sessions: {
    list: () => request<{ sessions: Session[] }>("/api/sessions"),
    start: (input: StartTrackingInput) =>
      request<{ sessions: Session[] }>("/api/sessions", {
        method: "POST",
        body: JSON.stringify(input),
      }),
    stop: () =>
      request<{ sessions: Session[] }>("/api/sessions/stop", {
        method: "POST",
      }),
  },
  push: {
    config: () =>
      request<{ configured: boolean; publicKey: string | null }>(
        "/api/push/config",
      ),
    subscribe: (body: {
      endpoint: string;
      keys: { p256dh: string; auth: string };
    }) =>
      request<{ ok: boolean }>("/api/push/subscribe", {
        method: "POST",
        body: JSON.stringify(body),
      }),
    unsubscribe: (body: { endpoint: string }) =>
      request<{ ok: boolean }>("/api/push/unsubscribe", {
        method: "DELETE",
        body: JSON.stringify(body),
      }),
    test: () =>
      request<{
        ok: boolean;
        configured: boolean;
        subscriptionCount: number;
        error?: string;
      }>("/api/push/test", { method: "POST" }),
  },
  reminders: {
    dispatch: () =>
      request<{ dispatched: number; pushConfigured: boolean }>(
        "/api/reminders/dispatch",
        {
          method: "POST",
        },
      ),
  },
};
