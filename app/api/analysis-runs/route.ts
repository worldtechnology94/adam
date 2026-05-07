/**
 * T3.3 — GET /api/analysis-runs?documentId=...
 *
 * Returns analysis runs for a document (optional documentId filter).
 *
 * @see thesisplan.md T3.3
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/db";

export async function GET(request: NextRequest) {
  const documentIdParam = request.nextUrl.searchParams.get("documentId");
  if (!documentIdParam) {
    return NextResponse.json(
      { error: "Query parameter documentId is required" },
      { status: 400 }
    );
  }

  const documentId = parseInt(documentIdParam, 10);
  if (Number.isNaN(documentId)) {
    return NextResponse.json({ error: "Invalid documentId" }, { status: 400 });
  }

  try {
    const runs = await prisma.analysisRun.findMany({
      where: { documentId },
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { violations: true } },
      },
    });

    return NextResponse.json({
      documentId,
      runs: runs.map((r: (typeof runs)[0]) => ({
        id: r.id,
        documentId: r.documentId,
        createdAt: r.createdAt.toISOString(),
        complianceScore: r.complianceScore,
        totalViolations: r.totalViolations,
        violationCount: r._count.violations,
        summary: r.summary,
      })),
    });
  } catch (e) {
    console.error("Analysis runs get error:", e);
    return NextResponse.json({ error: "Failed to fetch analysis runs" }, { status: 500 });
  }
}
