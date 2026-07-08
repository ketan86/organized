import { NextResponse } from "next/server";
import { captureTaskFromInput } from "@/server/ai/capture";
import { ApiError, jsonError } from "@/server/api/errors";
import { requireSessionUserId } from "@/server/auth/session";
import { loadBootstrap } from "@/server/repositories/bootstrap";

export const runtime = "nodejs";

const ALLOWED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/heic",
  "image/heif",
]);

export async function POST(request: Request) {
  try {
    const userId = await requireSessionUserId();
    const bootstrap = await loadBootstrap(userId);
    const contentType = request.headers.get("content-type") ?? "";

    let text: string | undefined;
    let image: { data: Uint8Array; mimeType: string } | undefined;
    let clarifyHistory:
      | { question: string; answer: string }[]
      | undefined;

    if (contentType.includes("multipart/form-data")) {
      const form = await request.formData();
      const rawText = form.get("text");
      if (typeof rawText === "string" && rawText.trim()) {
        text = rawText.trim();
      }

      const rawHistory = form.get("clarifyHistory");
      if (typeof rawHistory === "string" && rawHistory.trim()) {
        try {
          const parsed = JSON.parse(rawHistory) as {
            question: string;
            answer: string;
          }[];
          if (Array.isArray(parsed)) clarifyHistory = parsed;
        } catch {
          // ignore malformed history
        }
      }

      const file = form.get("image");
      if (file instanceof File && file.size > 0) {
        const mimeType = file.type || "image/jpeg";
        if (!ALLOWED_IMAGE_TYPES.has(mimeType)) {
          throw new ApiError(400, "Unsupported image type. Use JPEG, PNG, or WebP.");
        }
        const buffer = await file.arrayBuffer();
        image = { data: new Uint8Array(buffer), mimeType };
      }
    } else {
      const body = (await request.json()) as {
        text?: string;
        clarifyHistory?: { question: string; answer: string }[];
      };
      if (body.text?.trim()) text = body.text.trim();
      clarifyHistory = body.clarifyHistory;
    }

    if (!text && !image) {
      throw new ApiError(400, "Provide text and/or an image.");
    }

    const result = await captureTaskFromInput({
      bootstrap,
      text,
      image,
      clarifyHistory,
    });

    return NextResponse.json(result);
  } catch (error) {
    return jsonError(error, "AI capture failed");
  }
}
