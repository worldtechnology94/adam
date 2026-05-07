/**
 * T3.3 — GET /api/documents/[id]/analysis
 *
 * Returns the latest analysis run for the document with violations.
 *
 * @see thesisplan.md T3.3
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const idParam = (await params).id;
  const id = parseInt(idParam, 10);
  if (Number.isNaN(id)) {
    return NextResponse.json({ error: "Invalid document id" }, { status: 400 });
  }

  try {
    const doc = await prisma.document.findUnique({
      where: { id },
    });

    if (!doc) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    const latestRun = await prisma.analysisRun.findFirst({
      where: { documentId: id },
      orderBy: { createdAt: "desc" },
      include: {
        violations: {
          orderBy: { id: "asc" },
        },
      },
    });

    if (!latestRun) {
      return NextResponse.json({
        documentId: id,
        analysisRun: null,
        violations: [],
      });
    }

    return NextResponse.json({
      documentId: id,
      analysisRun: {
        id: latestRun.id,
        documentId: latestRun.documentId,
        createdAt: latestRun.createdAt.toISOString(),
        complianceScore: latestRun.complianceScore,
        totalViolations: latestRun.totalViolations,
        summary: latestRun.summary,
      },
      violations: latestRun.violations.map((v) => ({
        id: v.id,
        analysisRunId: v.analysisRunId,
        sentenceExcerpt: v.sentenceExcerpt,
        ruleId: v.ruleId,
        ruleName: v.ruleName,
        sentenceType: v.sentenceType,
        wordCount: v.wordCount,
        severity: v.severity,
        positionStart: v.positionStart,
        positionEnd: v.positionEnd,
        aiSuggestion: v.aiSuggestion,
        paragraphContext: v.paragraphContext,
        status: v.status,
        createdAt: v.createdAt.toISOString(),
      })),
    });
  } catch (e) {
    console.error("Document analysis get error:", e);
    return NextResponse.json({ error: "Failed to fetch analysis" }, { status: 500 });
  }
}
