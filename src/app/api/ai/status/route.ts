import { NextResponse } from "next/server";
import {
  aiConfigError,
  getAiProviderId,
  getGoogleModelId,
  getOpenAiModelId,
  isAiConfigured,
} from "@/server/ai/config";
import { requireSessionUserId } from "@/server/auth/session";
import { jsonError } from "@/server/api/errors";

export const runtime = "nodejs";

export async function GET() {
  try {
    await requireSessionUserId();
    const provider = getAiProviderId();
    const configured = isAiConfigured();

    return NextResponse.json({
      configured,
      provider,
      model: provider === "openai" ? getOpenAiModelId() : getGoogleModelId(),
      setupHint: configured ? null : aiConfigError(),
    });
  } catch (error) {
    return jsonError(error, "Failed to read AI status");
  }
}
