/**
 * T4.1 — GET /api/dashboard/summary?documentId=...
 *
 * Returns dashboard summary for a document (or last analyzed document if no id).
 * Shape matches frontend DashboardSummary (mock-dashboard).
 *
 * @see thesisplan.md T4.1 — Dashboard and violations
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/db";

export async function GET(request: NextRequest) {
  const documentIdParam = request.nextUrl.searchParams.get("documentId");

  try {
    let documentId: number | null = null;
    if (documentIdParam) {
      documentId = parseInt(documentIdParam, 10);
      if (Number.isNaN(documentId)) {
        return NextResponse.json({ error: "Invalid documentId" }, { status: 400 });
      }
    }

    if (documentId == null) {
      const latestRun = await prisma.analysisRun.findFirst({
        orderBy: { createdAt: "desc" },
        select: { documentId: true },
      });
      documentId = latestRun?.documentId ?? null;
    }

    if (documentId == null) {
      return NextResponse.json({
        documentId: null,
        document: null,
        complianceScore: 100,
        violations: { total: 0, critical: 0, major: 0, minor: 0 },
        topViolatedRules: [],
        rulesFoundCount: 0,
        sentenceTypeBreakdown: [],
        violationDistribution: [],
        recentActivity: [],
      });
    }

    const doc = await prisma.document.findUnique({
      where: { id: documentId },
    });
    if (!doc) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    const latestRun = await prisma.analysisRun.findFirst({
      where: { documentId },
      orderBy: { createdAt: "desc" },
      include: { violations: true },
    });

    const complianceScore = latestRun?.complianceScore ?? 100;
    const violationsList = latestRun?.violations ?? [];
    const total = violationsList.length;
    const critical = violationsList.filter((v: { severity: string }) => v.severity === "critical").length;
    const major = violationsList.filter((v: { severity: string }) => v.severity === "major").length;
    const minor = violationsList.filter((v: { severity: string }) => v.severity === "minor").length;

    type RuleCount = { ruleId: string; ruleName: string; count: number };
    const byRule: Record<string, RuleCount> = {};
    for (const v of violationsList as Array<{ ruleId: string; ruleName: string; severity: string }>) {
      if (!byRule[v.ruleId]) byRule[v.ruleId] = { ruleId: v.ruleId, ruleName: v.ruleName, count: 0 };
      byRule[v.ruleId].count++;
    }
    const topViolatedRules = Object.values(byRule)
      .sort((a: RuleCount, b: RuleCount) => b.count - a.count)
      .slice(0, 5);
    const violationDistribution = Object.values(byRule).sort((a: RuleCount, b: RuleCount) => b.count - a.count);

    const recentRuns = await prisma.analysisRun.findMany({
      where: { documentId },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { document: true },
    });
    const recentActivity = recentRuns.map((r: (typeof recentRuns)[0]) => ({
      id: String(r.id),
      timestamp: r.createdAt.toISOString(),
      action: "analysis_completed",
      documentName: r.document.name,
      description: `Analysis completed for ${r.document.name}`,
    }));

    return NextResponse.json({
      documentId,
      document: {
        fileName: doc.name,
        wordCount: doc.wordCount ?? 0,
        sentenceCount: doc.sentenceCount ?? 0,
        uploadTimestamp: doc.uploadedAt.toISOString(),
        documentType: (doc.documentType as "procedure" | "description" | "warning" | "mixed") ?? "mixed",
      },
      complianceScore,
      violations: { total, critical, major, minor },
      topViolatedRules,
      rulesFoundCount: Object.keys(byRule).length,
      sentenceTypeBreakdown: (() => {
        const st = (latestRun?.summary as Record<string, unknown> | null)?.sentenceTypes as
          | { instructional: number; descriptive: number; warning_caution: number }
          | undefined;
        if (!st) return [];
        return [
          { type: "instructional",   label: "Instructional",    count: st.instructional   ?? 0 },
          { type: "descriptive",     label: "Descriptive",      count: st.descriptive     ?? 0 },
          { type: "warning_caution", label: "Warning / Caution", count: st.warning_caution ?? 0 },
        ].filter((x) => x.count > 0);
      })(),
      violationDistribution,
      recentActivity,
    });
  } catch (e) {
    console.error("Dashboard summary error:", e);
    return NextResponse.json({ error: "Failed to fetch summary" }, { status: 500 });
  }
}
