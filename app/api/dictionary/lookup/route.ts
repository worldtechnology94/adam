/**
 * T1.4 — GET /api/dictionary/lookup?word=...
 * Resolves word or form to headword and returns full entry (approved, alternatives, examples, meanings).
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/db";

export async function GET(request: NextRequest) {
  let wordParam = request.nextUrl.searchParams.get("word");
  // Accept mis-encoded URL e.g. ?word%3Dabandon (param name becomes "word=abandon")
  if ((!wordParam || wordParam === "") && request.nextUrl.searchParams.size > 0) {
    const first = request.nextUrl.searchParams.keys().next();
    if (!first.done && first.value.startsWith("word=")) {
      wordParam = first.value.replace(/^word=/, "").trim();
    }
  }
  if (!wordParam || typeof wordParam !== "string") {
    return NextResponse.json(
      { error: "Missing or invalid query: word. Use ?word=abandon" },
      { status: 400 }
    );
  }

  const normalized = wordParam.trim().toLowerCase();
  if (!normalized) {
    return NextResponse.json(
      { error: "Query 'word' cannot be empty" },
      { status: 400 }
    );
  }

  try {
    // 1) Resolve form → headword via ste_word_forms, or use as headword
    let wordId: number | null = null;

    const byForm = await prisma.steWordForm.findFirst({
      where: { form: normalized },
      select: { wordId: true },
    });
    if (byForm) {
      wordId = byForm.wordId;
    } else {
      const byHeadword = await prisma.steWord.findFirst({
        where: { word: normalized },
        select: { id: true },
      });
      if (byHeadword) wordId = byHeadword.id;
    }

    if (wordId == null) {
      return NextResponse.json(
        { found: false, message: `No dictionary entry for "${normalized}"` },
        { status: 404 }
      );
    }

    const entry = await prisma.steWord.findUnique({
      where: { id: wordId },
      include: {
        forms: true,
        meanings: true,
        examples: true,
      },
    });

    if (!entry) {
      return NextResponse.json(
        { found: false, message: `No dictionary entry for "${normalized}"` },
        { status: 404 }
      );
    }

    const alternatives = entry.meanings
      .filter((m) => m.alternativeWord != null)
      .map((m) => ({
        word: m.alternativeWord!,
        pos: m.alternativePos ?? undefined,
      }));

    const body = {
      found: true,
      word: entry.word,
      word_display: entry.wordDisplay ?? entry.word,
      pos: entry.pos ?? undefined,
      approved: entry.approved,
      forms: entry.forms.map((f) => f.form),
      meanings: entry.meanings.map((m) => ({
        meaning: m.meaning ?? undefined,
        approved_as_is: m.approvedAsIs,
        alternative:
          m.alternativeWord != null
            ? { word: m.alternativeWord, pos: m.alternativePos ?? undefined }
            : undefined,
      })),
      alternatives,
      examples: entry.examples.map((e) => ({
        ste: e.steText ?? undefined,
        non_ste: e.nonSteText ?? undefined,
      })),
    };

    return NextResponse.json(body);
  } catch (e) {
    const err = e instanceof Error ? e : new Error(String(e));
    console.error("Dictionary lookup error:", err);
    const message =
      process.env.NODE_ENV !== "production"
        ? err.message
        : "Lookup failed";
    return NextResponse.json(
      { error: "Lookup failed", details: process.env.NODE_ENV !== "production" ? message : undefined },
      { status: 500 }
    );
  }
}
