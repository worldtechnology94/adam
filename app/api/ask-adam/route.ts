/**
 * POST /api/ask-adam
 *
 * Body: { messages: { role: "user" | "assistant" | "system"; content: string }[] }
 * Returns: { content: string } or { error: string }
 *
 * Uses Google Gemini (via @ai-sdk/google) for STE writing assistant. Requires
 * GOOGLE_GENERATIVE_AI_API_KEY in .env (get from https://aistudio.google.com/apikey).
 */

import { NextRequest, NextResponse } from "next/server";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateText } from "ai";

const apiKey =
  process.env.GOOGLE_GENERATIVE_AI_API_KEY?.trim() ||
  process.env.GEMINI_API_KEY?.trim();
const google = createGoogleGenerativeAI({ apiKey: apiKey || undefined });

/** Default model: 1.5-flash was retired for many keys; use 2.x Flash (see Google AI Studio → Models). */
const DEFAULT_GEMINI_MODEL = "gemini-2.5-flash";

const SYSTEM_PROMPT = `You are ADAM, an AI writing assistant for Simplified Technical English (STE) per ASD-STE100. You help users:
- Rewrite sentences to comply with STE rules (approved words, no prohibited words, correct part of speech, word forms).
- Explain STE rules (e.g. STE-1.1, STE-8.1) briefly and suggest corrections.
- Prefer short, clear answers. When suggesting a rewrite, give the exact sentence. Use **bold** for terms and rule IDs.`;

export async function POST(request: NextRequest) {
  if (!apiKey) {
    return NextResponse.json(
      {
        error: "Gemini API key not configured",
        details: "Set GOOGLE_GENERATIVE_AI_API_KEY in .env (get a key from https://aistudio.google.com/apikey)",
      },
      { status: 503 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const messages = typeof body === "object" && body !== null && "messages" in body
    ? (body as { messages: unknown }).messages
    : undefined;

  if (!Array.isArray(messages) || messages.length === 0) {
    return NextResponse.json(
      { error: "Body must include a non-empty messages array: [{ role, content }]" },
      { status: 400 }
    );
  }

  const valid = messages.every(
    (m: unknown) =>
      typeof m === "object" &&
      m !== null &&
      "role" in m &&
      "content" in m &&
      typeof (m as { content: unknown }).content === "string"
  );
  if (!valid) {
    return NextResponse.json(
      { error: "Each message must have role and content (string)" },
      { status: 400 }
    );
  }

  const formatted = messages.map((m: { role: string; content: string }) => ({
    role: m.role === "assistant" ? "assistant" as const : m.role === "system" ? "system" as const : "user" as const,
    content: (m as { content: string }).content,
  }));

  const modelId =
    process.env.GEMINI_MODEL?.trim() || DEFAULT_GEMINI_MODEL;

  try {
    const { text } = await generateText({
      model: google(modelId),
      system: SYSTEM_PROMPT,
      messages: formatted,
    });

    return NextResponse.json({ content: text });
  } catch (e) {
    const err = e instanceof Error ? e : new Error(String(e));
    console.error("[ask-adam] Gemini error:", err.message);
    return NextResponse.json(
      {
        error: "AI request failed",
        details: process.env.NODE_ENV !== "production" ? err.message : undefined,
      },
      { status: 502 }
    );
  }
}
