/**
 * T1.4 — GET /api/dictionary/search?q=...&pos=...&limit=...&offset=...
 * Search headwords by substring; optional POS filter; paginated.
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/db";

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q");
  const pos = request.nextUrl.searchParams.get("pos") ?? undefined;
  const limitParam = request.nextUrl.searchParams.get("limit");
  const offsetParam = request.nextUrl.searchParams.get("offset");

  const limit = Math.min(
    Math.max(1, parseInt(limitParam ?? String(DEFAULT_LIMIT), 10) || DEFAULT_LIMIT),
    MAX_LIMIT
  );
  const offset = Math.max(0, parseInt(offsetParam ?? "0", 10) || 0);

  const search = (q ?? "").trim().toLowerCase();
  if (!search) {
    return NextResponse.json(
      { error: "Missing or empty query: q" },
      { status: 400 }
    );
  }

  try {
    const where: { word?: { contains: string; mode: "insensitive" }; pos?: string | null } = {
      word: { contains: search, mode: "insensitive" },
    };
    if (pos != null && pos !== "") {
      where.pos = pos;
    }

    const [items, total] = await Promise.all([
      prisma.steWord.findMany({
        where,
        select: {
          id: true,
          word: true,
          wordDisplay: true,
          pos: true,
          approved: true,
        },
        orderBy: { word: "asc" },
        take: limit,
        skip: offset,
      }),
      prisma.steWord.count({ where }),
    ]);

    const entries = items.map((w) => ({
      id: w.id,
      word: w.word,
      word_display: w.wordDisplay ?? w.word,
      pos: w.pos ?? undefined,
      approved: w.approved,
    }));

    return NextResponse.json({
      entries,
      pagination: {
        total,
        limit,
        offset,
        has_more: offset + entries.length < total,
      },
    });
  } catch (e) {
    const err = e instanceof Error ? e : new Error(String(e));
    console.error("Dictionary search error:", err);
    const message =
      process.env.NODE_ENV !== "production"
        ? err.message
        : "Search failed";
    return NextResponse.json(
      { error: "Search failed", details: process.env.NODE_ENV !== "production" ? message : undefined },
      { status: 500 }
    );
  }
}
