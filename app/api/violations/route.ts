/**
 * T4.1 — GET /api/violations?documentId=...&analysisRunId=...&ruleId=...&severity=...&keyword=...&page=...&limit=...
 *
 * Returns paginated violations. documentId or analysisRunId required for scope.
 *
 * @see thesisplan.md T4.1
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/db";

export async function GET(request: NextRequest) {
  const documentIdParam = request.nextUrl.searchParams.get("documentId");
  const analysisRunIdParam = request.nextUrl.searchParams.get("analysisRunId");
  const ruleId = request.nextUrl.searchParams.get("ruleId") ?? undefined;
  const severity = request.nextUrl.searchParams.get("severity") ?? undefined;
  const sentenceType = request.nextUrl.searchParams.get("sentenceType") ?? undefined;
  const keyword = request.nextUrl.searchParams.get("keyword")?.trim().toLowerCase() ?? "";
  const page = Math.max(0, parseInt(request.nextUrl.searchParams.get("page") ?? "0", 10) || 0);
  const limit = Math.min(100, Math.max(1, parseInt(request.nextUrl.searchParams.get("limit") ?? "20", 10) || 20));
  const offset = page * limit;

  try {
    let where: { analysisRunId?: number; documentId?: number; ruleId?: string; severity?: string; sentenceType?: string } = {};

    if (analysisRunIdParam) {
      const analysisRunId = parseInt(analysisRunIdParam, 10);
      if (Number.isNaN(analysisRunId)) {
        return NextResponse.json({ error: "Invalid analysisRunId" }, { status: 400 });
      }
      where.analysisRunId = analysisRunId;
    } else {
      const documentId = documentIdParam
        ? parseInt(documentIdParam, 10)
        : (await prisma.analysisRun.findFirst({ orderBy: { createdAt: "desc" }, select: { documentId: true } }))
            ?.documentId ?? null;
      if (documentIdParam && Number.isNaN(documentId)) {
        return NextResponse.json({ error: "Invalid documentId" }, { status: 400 });
      }
      if (documentId == null) {
        return NextResponse.json({ violations: [], total: 0, documentId: null, documentName: null });
      }
      const run = await prisma.analysisRun.findFirst({
        where: { documentId },
        orderBy: { createdAt: "desc" },
        select: { id: true },
      });
      if (!run) {
        return NextResponse.json({ violations: [], total: 0, documentId, documentName: null });
      }
      where.analysisRunId = run.id;
    }

    if (ruleId) where.ruleId = ruleId;
    if (severity) where.severity = severity;
    if (sentenceType) where.sentenceType = sentenceType;

    const [violations, total] = await Promise.all([
      prisma.violation.findMany({
        where: keyword
          ? {
              ...where,
              OR: [
                { sentenceExcerpt: { contains: keyword, mode: "insensitive" } },
                { aiSuggestion: { contains: keyword, mode: "insensitive" } },
              ],
            }
          : where,
        orderBy: { id: "asc" },
        skip: offset,
        take: limit,
      }),
      prisma.violation.count({
        where: keyword
          ? {
              ...where,
              OR: [
                { sentenceExcerpt: { contains: keyword, mode: "insensitive" } },
                { aiSuggestion: { contains: keyword, mode: "insensitive" } },
              ],
            }
          : where,
      }),
    ]);

    const list = violations.map((v) => {
      const excerptWordCount = v.sentenceExcerpt.trim().split(/\s+/).filter(Boolean).length;
      return {
        id: String(v.id),
        sentenceExcerpt: v.sentenceExcerpt,
        ruleId: v.ruleId,
        ruleName: v.ruleName,
        sentenceType: v.sentenceType as "instructional" | "descriptive" | "warning_caution" | null,
        wordCount: v.wordCount ?? excerptWordCount,
        severity: v.severity as "critical" | "major" | "minor",
        aiSuggestion: v.aiSuggestion ?? "",
        paragraphContext: v.paragraphContext ?? undefined,
        position:
          v.positionStart != null && v.positionEnd != null
            ? { start: v.positionStart, end: v.positionEnd }
            : undefined,
        status: v.status as "pending" | "accepted" | "rejected",
      };
    });

    let documentIdOut: number | null = null;
    let documentNameOut: string | null = null;
    if (where.analysisRunId != null) {
      const runWithDoc = await prisma.analysisRun.findUnique({
        where: { id: where.analysisRunId },
        select: { documentId: true, document: { select: { name: true } } },
      });
      if (runWithDoc) {
        documentIdOut = runWithDoc.documentId;
        documentNameOut = runWithDoc.document.name;
      }
    }

    return NextResponse.json({
      violations: list,
      total,
      documentId: documentIdOut,
      documentName: documentNameOut,
    });
  } catch (e) {
    console.error("Violations list error:", e);
    return NextResponse.json({ error: "Failed to fetch violations" }, { status: 500 });
  }
}
