/**
 * T2.3 — POST /api/analysis/check
 *
 * Body: { "text": "..." }
 * Returns: { violations[], complianceScore, totalWordCount }
 *
 * Runs tokenizer + STE-1.1 engine against the dictionary (DB). Stateless.
 *
 * @see thesisplan.md T2.3 — Engine API
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/db";
import { tokenizeText, runSte11Check, createPrismaLookup } from "@/app/lib/analysis";

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  const text = typeof body === "object" && body !== null && "text" in body
    ? (body as { text: unknown }).text
    : undefined;

  if (typeof text !== "string") {
    return NextResponse.json(
      { error: "Missing or invalid body: { \"text\": \"...\" }" },
      { status: 400 }
    );
  }

  const trimmed = text.trim();
  if (trimmed.length === 0) {
    return NextResponse.json(
      { error: "Body 'text' cannot be empty" },
      { status: 400 }
    );
  }

  try {
    const doc = tokenizeText(trimmed, { applyPosHeuristic: true });
    const lookup = createPrismaLookup(prisma);
    const result = await runSte11Check(doc, lookup);

    return NextResponse.json({
      violations: result.violations,
      complianceScore: result.complianceScore,
      totalWordCount: result.totalWordCount,
    });
  } catch (e) {
    const err = e instanceof Error ? e : new Error(String(e));
    console.error("Analysis check error:", err);
    const message =
      process.env.NODE_ENV !== "production"
        ? err.message
        : "Analysis failed";
    return NextResponse.json(
      { error: "Analysis failed", details: process.env.NODE_ENV !== "production" ? message : undefined },
      { status: 500 }
    );
  }
}
