/**
 * T3.3 — POST /api/documents/[id]/analyze
 *
 * Loads document text, runs tokenizer + STE-1.1/1.2/1.5 + STE-1.3 + STE-8.1… engines, creates AnalysisRun and Violation rows.
 *
 * @see thesisplan.md T3.3 — Analysis run
 * @see ruleplan.md — STE-8.1
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/db";
import { extractTextFromFile } from "@/app/lib/documents/extract-text";
import {
  tokenizeText,
  runSte11Check,
  runSte13Check,
  runSte81Check,
  runSte5Check,
  runSte53Check,
  runSte32Check,
  runSte41Check,
  runSte42Check,
  runSte43Check,
  runSte44Check,
  runSte45Check,
  runSte46Check,
  runSte47Check,
  runSte48Check,
  runSte61Check,
  runSte71Check,
  runSte72Check,
  runSte73Check,
  runSte74Check,
  runSte75Check,
  runSte21Check,
  runSte82Check,
  runSte83Check,
  runSte84Check,
  runSte85Check,
  runSte86Check,
  runSte87Check,
  runSte91Check,
  runSte92Check,
  runSte93Check,
  runSte102Check,
  runSte10WritingCheck,
  runSte14Check,
  runSte22Check,
  runSte23Check,
  runSte62Check,
  runSte16Check,
  runSte17Check,
  runSte33Check,
  runSte34Check,
  runSte38Check,
  runSte36Check,
  runSte37Check,
  runSte39Check,
  runSte35Check,
  runSte63Check,
  runSte64Check,
  runSte65Check,
  runSte66Check,
  runSte94Check,
  runSte101Check,
  runSte54Check,
  runSte105Check,
  runSte107Check,
  createBatchedPrismaLookup,
} from "@/app/lib/analysis";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const idParam = (await params).id;
  const id = parseInt(idParam, 10);
  const log = (msg: string, ...args: unknown[]) =>
    console.log(`[analyze] ${new Date().toISOString()} doc=${id} ${msg}`, ...args);

  if (Number.isNaN(id)) {
    return NextResponse.json({ error: "Invalid document id" }, { status: 400 });
  }

  try {
    log("Start");
    const doc = await prisma.document.findUnique({
      where: { id },
    });

    if (!doc) {
      log("Abort: document not found");
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    let text: string;
    let wordCount: number;
    let sentenceCount: number;

    if (doc.rawText) {
      log("Using stored rawText");
      text = doc.rawText;
      wordCount = doc.wordCount ?? 0;
      sentenceCount = doc.sentenceCount ?? 0;
    } else {
      log("Extracting text from", doc.filePath);
      const extracted = await extractTextFromFile(doc.filePath);
      text = extracted.text;
      wordCount = extracted.wordCount;
      sentenceCount = extracted.sentenceCount;
      await prisma.document.update({
        where: { id },
        data: { wordCount, sentenceCount },
      });
    }

    log("Tokenizing...");
    const tokenized = tokenizeText(text, { applyPosHeuristic: true });
    log("Running STE checks...");
    const lookup = await createBatchedPrismaLookup(prisma, tokenized);
    log("STE-1.1 (dictionary) running...");
    const ste11Result = await runSte11Check(tokenized, lookup);
    log("STE-1.3 (approved meanings)...");
    const ste13Result = await runSte13Check(tokenized, lookup);
    log("STE-8.1...");
    const ste81Result = runSte81Check(tokenized);
    log("STE-5...");
    const ste5Result = runSte5Check(tokenized);
    log("STE-5.3...");
    const ste53Result = runSte53Check(tokenized);
    log("STE-3.2...");
    const ste32Result = runSte32Check(tokenized);
    log("STE-4.1...");
    const ste41Result = runSte41Check(tokenized);
    log("STE-4.2...");
    const ste42Result = runSte42Check(tokenized);
    log("STE-4.3...");
    const ste43Result = runSte43Check(tokenized);
    log("STE-4.4...");
    const ste44Result = runSte44Check(tokenized);
    log("STE-4.5...");
    const ste45Result = runSte45Check(tokenized);
    log("STE-4.6...");
    const ste46Result = runSte46Check(tokenized);
    log("STE-4.7...");
    const ste47Result = runSte47Check(tokenized);
    log("STE-4.8...");
    const ste48Result = runSte48Check(tokenized);
    log("STE-6.1...");
    const ste61Result = runSte61Check(tokenized);
    log("STE-7.1...");
    const ste71Result = runSte71Check(tokenized);
    log("STE-7.2...");
    const ste72Result = runSte72Check(tokenized);
    log("STE-7.3...");
    const ste73Result = runSte73Check(tokenized);
    log("STE-7.4...");
    const ste74Result = runSte74Check(tokenized);
    log("STE-7.5...");
    const ste75Result = runSte75Check(tokenized);
    log("STE-2.1...");
    const ste21Result = runSte21Check(tokenized);
    log("STE-8.2...");
    const ste82Result = runSte82Check(tokenized);
    log("STE-8.3...");
    const ste83Result = runSte83Check(tokenized);
    log("STE-8.4...");
    const ste84Result = runSte84Check(tokenized);
    log("STE-8.5...");
    const ste85Result = runSte85Check(tokenized);
    log("STE-8.6...");
    const ste86Result = runSte86Check(tokenized);
    log("STE-8.7...");
    const ste87Result = runSte87Check(tokenized);
    log("STE-9.1...");
    const ste91Result = runSte91Check(tokenized);
    log("STE-9.2...");
    const ste92Result = runSte92Check(tokenized);
    log("STE-9.3...");
    const ste93Result = runSte93Check(tokenized);
    log("STE-10.2...");
    const ste102Result = runSte102Check(tokenized);
    log("STE-10 writing...");
    const ste10WritingResult = runSte10WritingCheck(tokenized);
    log("STE-1.4...");
    const ste14Result = runSte14Check(tokenized);
    log("STE-2.2...");
    const ste22Result = runSte22Check(tokenized);
    log("STE-2.3...");
    const ste23Result = runSte23Check(tokenized);
    log("STE-6.2...");
    const ste62Result = runSte62Check(tokenized);
    log("STE-1.6...");
    const ste16Result = await runSte16Check(tokenized, lookup);
    log("STE-1.7...");
    const ste17Result = await runSte17Check(tokenized, lookup);
    log("STE-3.3...");
    const ste33Result = runSte33Check(tokenized);
    log("STE-3.4...");
    const ste34Result = runSte34Check(tokenized);
    log("STE-3.8...");
    const ste38Result = runSte38Check(tokenized);
    log("STE-3.6...");
    const ste36Result = runSte36Check(tokenized);
    log("STE-3.7...");
    const ste37Result = runSte37Check(tokenized);
    log("STE-3.9...");
    const ste39Result = runSte39Check(tokenized);
    log("STE-3.5...");
    const ste35Result = runSte35Check(tokenized);
    log("STE-6.3...");
    const ste63Result = runSte63Check(tokenized);
    log("STE-6.4...");
    const ste64Result = runSte64Check(tokenized);
    log("STE-6.5...");
    const ste65Result = runSte65Check(tokenized);
    log("STE-6.6...");
    const ste66Result = runSte66Check(tokenized);
    log("STE-9.4...");
    const ste94Result = runSte94Check(tokenized);
    log("STE-10.1...");
    const ste101Result = runSte101Check(tokenized);
    log("STE-5.4...");
    const ste54Result = runSte54Check(tokenized);
    log("STE-10.5...");
    const ste105Result = runSte105Check(tokenized);
    log("STE-10.7...");
    const ste107Result = runSte107Check(tokenized);

    const allViolations = [
      ...ste11Result.violations,
      ...ste13Result.violations,
      ...ste81Result.violations,
      ...ste5Result.violations,
      ...ste53Result.violations,
      ...ste32Result.violations,
      ...ste41Result.violations,
      ...ste42Result.violations,
      ...ste43Result.violations,
      ...ste44Result.violations,
      ...ste45Result.violations,
      ...ste46Result.violations,
      ...ste47Result.violations,
      ...ste48Result.violations,
      ...ste61Result.violations,
      ...ste71Result.violations,
      ...ste72Result.violations,
      ...ste73Result.violations,
      ...ste74Result.violations,
      ...ste75Result.violations,
      ...ste21Result.violations,
      ...ste82Result.violations,
      ...ste83Result.violations,
      ...ste84Result.violations,
      ...ste85Result.violations,
      ...ste86Result.violations,
      ...ste87Result.violations,
      ...ste91Result.violations,
      ...ste92Result.violations,
      ...ste93Result.violations,
      ...ste102Result.violations,
      ...ste10WritingResult.violations,
      ...ste14Result.violations,
      ...ste22Result.violations,
      ...ste23Result.violations,
      ...ste62Result.violations,
      ...ste16Result.violations,
      ...ste17Result.violations,
      ...ste33Result.violations,
      ...ste34Result.violations,
      ...ste38Result.violations,
      ...ste36Result.violations,
      ...ste37Result.violations,
      ...ste39Result.violations,
      ...ste35Result.violations,
      ...ste63Result.violations,
      ...ste64Result.violations,
      ...ste65Result.violations,
      ...ste66Result.violations,
      ...ste94Result.violations,
      ...ste101Result.violations,
      ...ste54Result.violations,
      ...ste105Result.violations,
      ...ste107Result.violations,
    ];
    // Severity-weighted, density-normalised score.
    // Weight: critical=5, major=3, minor=1. Normalised against total word count.
    // A well-written doc (1 minor per 50 words) → ~98. A poor doc → <50.
    const SEVERITY_WEIGHT: Record<string, number> = { critical: 5, major: 3, minor: 1 };
    const totalPenalty = allViolations.reduce(
      (sum, v) => sum + (SEVERITY_WEIGHT[v.severity] ?? 1),
      0
    );
    const totalWords = Math.max(1, tokenized.totalWordCount);
    const penaltyRate = totalPenalty / totalWords; // weighted violations per word
    const complianceScore = Math.max(
      0,
      Math.min(100, Math.round(100 - penaltyRate * 200))
    );

    // Count sentence types for the dashboard breakdown
    const sentenceTypes = tokenized.sentences.reduce(
      (acc, s) => {
        const t = s.text.trimStart().toUpperCase();
        if (t.startsWith("WARNING") || t.startsWith("CAUTION") || t.startsWith("DANGER")) {
          acc.warning_caution++;
        } else if (s.tokens.find((tk) => tk.isWord)?.posHeuristic === "v") {
          acc.instructional++;
        } else {
          acc.descriptive++;
        }
        return acc;
      },
      { instructional: 0, descriptive: 0, warning_caution: 0 }
    );

    log("Violations:", allViolations.length, "| Creating run...");
    const run = await prisma.analysisRun.create({
      data: {
        documentId: id,
        complianceScore,
        totalViolations: allViolations.length,
        summary: {
          totalWordCount: ste11Result.totalWordCount,
          sentenceTypes,
          violationsByReason: allViolations.reduce(
            (acc, v) => {
              acc[v.reason] = (acc[v.reason] ?? 0) + 1;
              return acc;
            },
            {} as Record<string, number>
          ),
        },
      },
    });

    if (allViolations.length > 0) {
      await prisma.violation.createMany({
        data: allViolations.map((v) => ({
          analysisRunId: run.id,
          sentenceExcerpt: v.sentenceExcerpt,
          ruleId: v.ruleId,
          ruleName: v.ruleName,
          sentenceType: ("sentenceType" in v && v.sentenceType != null ? v.sentenceType : null) as string | null,
          wordCount: v.wordCount ?? null,
          severity: v.severity,
          positionStart: v.positionStart,
          positionEnd: v.positionEnd,
          aiSuggestion: v.suggestion,
          paragraphContext: null,
          status: "pending",
        })),
      });
    }

    const violations = await prisma.violation.findMany({
      where: { analysisRunId: run.id },
      orderBy: { id: "asc" },
    });

    log("Done: run id", run.id);

    // --- Log results for rule-accuracy review (copy from terminal) ---
    const byRule = allViolations.reduce(
      (acc, v) => {
        acc[v.ruleId] = (acc[v.ruleId] ?? 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );
    const sampleSize = Math.min(50, allViolations.length);
    const sample = allViolations.slice(0, sampleSize).map((v) => ({
      ruleId: v.ruleId,
      ruleName: v.ruleName,
      severity: v.severity,
      sentenceType: "sentenceType" in v ? (v as { sentenceType?: string }).sentenceType : undefined,
      sentenceExcerpt: v.sentenceExcerpt.length > 120 ? v.sentenceExcerpt.slice(0, 120) + "…" : v.sentenceExcerpt,
      suggestion: (v.suggestion ?? "").length > 80 ? (v.suggestion ?? "").slice(0, 80) + "…" : (v.suggestion ?? ""),
    }));
    const resultsForReview = {
      documentId: id,
      documentName: doc.name,
      analysisRunId: run.id,
      complianceScore,
      totalViolations: allViolations.length,
      wordCount: ste11Result.totalWordCount,
      sentenceCount: tokenized.sentences.length,
      violationsByRule: byRule,
      sampleViolations: sample,
    };
    console.log("\n" + "=".repeat(60));
    console.log("[ANALYSIS RESULTS — copy below for rule review]");
    console.log("=".repeat(60));
    console.log(JSON.stringify(resultsForReview, null, 2));
    console.log("=".repeat(60) + "\n");

    return NextResponse.json({
      analysisRunId: run.id,
      documentId: id,
      complianceScore: run.complianceScore,
      totalViolations: run.totalViolations,
      violations: violations.map((v) => ({
        id: v.id,
        sentenceExcerpt: v.sentenceExcerpt,
        ruleId: v.ruleId,
        ruleName: v.ruleName,
        severity: v.severity,
        positionStart: v.positionStart,
        positionEnd: v.positionEnd,
        aiSuggestion: v.aiSuggestion,
        status: v.status,
      })),
    });
  } catch (e) {
    const err = e instanceof Error ? e : new Error(String(e));
    console.error("[analyze]", new Date().toISOString(), "doc=" + id, "Error:", err.message);
    return NextResponse.json(
      { error: "Analysis failed", details: process.env.NODE_ENV !== "production" ? err.message : undefined },
      { status: 500 }
    );
  }
}
