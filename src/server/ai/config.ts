export type AiProviderId = "google" | "openai";

export function getAiProviderId(): AiProviderId {
  const raw = process.env.AI_PROVIDER?.toLowerCase();
  if (raw === "openai") return "openai";
  return "google";
}

export function getGoogleModelId(): string {
  return process.env.GOOGLE_MODEL ?? "gemini-2.5-flash-lite";
}

export function getOpenAiModelId(): string {
  return process.env.OPENAI_MODEL ?? "gpt-4o-mini";
}

export function isAiConfigured(): boolean {
  const provider = getAiProviderId();
  if (provider === "openai") {
    return Boolean(process.env.OPENAI_API_KEY?.trim());
  }
  return Boolean(process.env.GOOGLE_GENERATIVE_AI_API_KEY?.trim());
}

export function aiConfigError(): string {
  const provider = getAiProviderId();
  if (provider === "openai") {
    return "AI is not configured. Set OPENAI_API_KEY (and AI_PROVIDER=openai if needed).";
  }
  return "AI is not configured. Set GOOGLE_GENERATIVE_AI_API_KEY from Google AI Studio.";
}
