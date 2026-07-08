import { google } from "@ai-sdk/google";
import { openai } from "@ai-sdk/openai";
import type { LanguageModel } from "ai";
import {
  aiConfigError,
  getAiProviderId,
  getGoogleModelId,
  getOpenAiModelId,
  isAiConfigured,
  type AiProviderId,
} from "@/server/ai/config";
import { ApiError } from "@/server/api/errors";

export function requireAiModel(): LanguageModel {
  if (!isAiConfigured()) {
    throw new ApiError(503, aiConfigError());
  }

  const provider = getAiProviderId();
  if (provider === "openai") {
    return openai(getOpenAiModelId());
  }
  return google(getGoogleModelId());
}

export function activeAiProviderLabel(): AiProviderId {
  return getAiProviderId();
}
