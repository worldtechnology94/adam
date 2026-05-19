/**
 * POST /api/rules/[id]/test
 *
 * Runs the real STE analysis engine for a single rule against user-supplied text.
 * Body: { text: string }
 * Response: { ruleId, compliant, violations, message, notImplementable? }
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/db";
import {
  tokenizeText,
  createBatchedPrismaLookup,
  runSte11Check,
  runSte13Check,
  runSte16Check,
  runSte17Check,
  runSte110Check,
  runSte14Check,
  runSte101Check,
  runSte107Check,
  runSte113Check,
  runSte10WritingCheck,
  runSte21Check,
  runSte22Check,
  runSte23Check,
  runSte34Check,
  runSte35Check,
  runSte36Check,
  runSte33Check,
  runSte32Check,
  runSte38Check,
  runSte39Check,
  runSte48Check,
  runSte42Check,
  runSte84Check,
  runSte43Check,
  runSte44Check,
  runSte45Check,
  runSte5Check,
  runSte54Check,
  runSte41Check,
  runSte53Check,
  runSte46Check,
  runSte47Check,
  runSte61Check,
  runSte62Check,
  runSte64Check,
  runSte66Check,
  runSte65Check,
  runSte63Check,
  runSte71Check,
  runSte72Check,
  runSte74Check,
  runSte73Check,
  runSte75Check,
  runSte81Check,
  runSte87Check,
  runSte82Check,
  runSte83Check,
  runSte84ListCheck,
  runSte85Check,
  runSte86Check,
  runSte91Check,
  runSte92Check,
  runSte102Check,
  runSte37Check,
  runSte93Check,
  runSte94Check,
  runSte105Check,
} from "@/app/lib/analysis";

export interface TestViolation {
  ruleId: string;
  ruleName: string;
  severity: string;
  sentenceExcerpt: string;
  positionStart: number;
  positionEnd: number;
  suggestion: string;
}

/** Rules that cannot be automatically detected — require project config or are permissive. */
const NOT_IMPLEMENTABLE: Record<string, string> = {
  "STE-1.5":  "Requires a project-specific approved technical noun category list — cannot be tested automatically.",
  "STE-1.8":  "Requires a company or industry-approved technical noun list — cannot be tested automatically.",
  "STE-1.9":  "Subjective clarity judgment on technical nouns — cannot be automated.",
  "STE-1.12": "Requires a project-specific approved technical verb category list — cannot be tested automatically.",
  "STE-3.3":  "Permissive rule (past participle as adjective is allowed). Violations in compound tenses are caught by STE-3.2 and STE-3.4.",
  "STE-8.7":  "Counting methodology, not a writing rule — no writer-facing violation exists in text.",
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SyncRunner = (doc: any) => { violations: TestViolation[] };

/**
 * Wraps a sync engine so all its violations are re-tagged with a different ruleId.
 * Used when an engine's detection logic applies to multiple rule categories.
 */
function withRuleId(ruleId: string, fn: SyncRunner): SyncRunner {
  return (doc) => ({
    violations: fn(doc).violations.map((v) => ({ ...v, ruleId })),
  });
}

/**
 * Engines (sync) that can emit violations for each rule ID.
 * Multiple engines per rule = all emit the same ruleId; results are merged + deduped.
 */
const SYNC_ENGINES: Partial<Record<string, SyncRunner[]>> = {
  // DB-backed rules: sync fallbacks run alongside the DB lookup so the test
  // endpoint works even when the dictionary has no matching violations.
  "STE-1.1":  [withRuleId("STE-1.1",  runSte92Check)],
  "STE-1.3":  [withRuleId("STE-1.3",  runSte92Check)],
  "STE-1.6":  [withRuleId("STE-1.6",  runSte92Check)],
  "STE-1.7":  [withRuleId("STE-1.7",  runSte92Check)],
  "STE-3.1":  [withRuleId("STE-3.1",  runSte34Check), withRuleId("STE-3.1", runSte35Check)],
  "STE-1.10": [runSte110Check],
  "STE-1.11": [runSte14Check, runSte101Check, runSte107Check],
  "STE-1.13": [runSte113Check],
  "STE-1.14": [runSte10WritingCheck],
  "STE-1.4":  [withRuleId("STE-1.4", runSte34Check), withRuleId("STE-1.4", runSte35Check)],
  "STE-2.1":  [runSte21Check],
  "STE-2.2":  [runSte22Check, runSte23Check],
  "STE-3.2":  [runSte34Check, runSte35Check],
  "STE-3.4":  [runSte36Check],
  "STE-3.5":  [runSte33Check],
  "STE-3.6":  [runSte32Check, runSte38Check],
  "STE-3.7":  [runSte39Check],
  "STE-4.1":  [runSte48Check],
  "STE-4.2":  [runSte42Check, runSte84Check, runSte10WritingCheck],
  "STE-4.3":  [runSte43Check],
  "STE-4.4":  [runSte44Check],
  "STE-4.5":  [runSte45Check],
  "STE-5.1":  [runSte5Check],
  "STE-5.2":  [runSte54Check],
  "STE-5.3":  [runSte41Check, runSte53Check],
  "STE-5.4":  [runSte46Check],
  "STE-5.5":  [runSte47Check],
  "STE-6.1":  [runSte61Check],
  "STE-6.2":  [runSte62Check],
  "STE-6.3":  [runSte5Check],
  "STE-6.4":  [runSte64Check, runSte66Check],
  "STE-6.5":  [runSte65Check],
  "STE-6.6":  [runSte63Check],
  "STE-7.1":  [runSte71Check],
  "STE-7.2":  [runSte72Check, runSte74Check],
  "STE-7.3":  [runSte73Check, runSte75Check],
  "STE-8.1":  [runSte81Check, runSte87Check, runSte10WritingCheck],
  "STE-8.2":  [runSte82Check],
  "STE-8.3":  [runSte83Check],
  "STE-8.4":  [runSte84ListCheck],
  "STE-8.5":  [runSte85Check],
  "STE-8.6":  [runSte86Check],
  "STE-9.1":  [runSte91Check],
  "STE-9.2":  [runSte92Check, runSte102Check],
  "STE-9.3":  [runSte37Check, runSte93Check],
  "STE-9.4":  [runSte94Check, runSte105Check],
};

/**
 * Dict-based rules: which engine family to use (needs Prisma lookup).
 * ste11 covers STE-1.1 (unknown words), STE-1.2 (prohibited POS), STE-1.4 (word forms), STE-3.1 (verb forms).
 */
const DICT_FAMILY: Partial<Record<string, "ste11" | "ste13" | "ste16" | "ste17">> = {
  "STE-1.1": "ste11",
  "STE-1.2": "ste11",
  "STE-1.4": "ste11",
  "STE-3.1": "ste11",
  "STE-1.3": "ste13",
  "STE-1.6": "ste16",
  "STE-1.7": "ste17",
};

function pickViolations(
  result: { violations: unknown[] },
  ruleId: string
): TestViolation[] {
  return (result.violations as TestViolation[]).filter((v) => v.ruleId === ruleId);
}

function dedupe(violations: TestViolation[]): TestViolation[] {
  const seen = new Set<string>();
  return violations.filter((v) => {
    const key = `${v.ruleId}:${v.positionStart}:${v.positionEnd}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const ruleId = (await params).id;

  const body = await request.json().catch(() => ({})) as { text?: string };
  const text = typeof body.text === "string" ? body.text.trim() : "";

  if (!text) {
    return NextResponse.json({ error: "text is required" }, { status: 400 });
  }
  if (text.length > 5000) {
    return NextResponse.json({ error: "text must be 5000 characters or fewer" }, { status: 400 });
  }

  if (NOT_IMPLEMENTABLE[ruleId]) {
    return NextResponse.json({
      ruleId,
      compliant: null,
      notImplementable: true,
      violations: [],
      message: NOT_IMPLEMENTABLE[ruleId],
    });
  }

  try {
    const tokenized = tokenizeText(text, { applyPosHeuristic: true });
    const violations: TestViolation[] = [];

    const dictFamily = DICT_FAMILY[ruleId];
    if (dictFamily) {
      const lookup = await createBatchedPrismaLookup(prisma, tokenized);
      if (dictFamily === "ste11") {
        violations.push(...pickViolations(await runSte11Check(tokenized, lookup), ruleId));
      } else if (dictFamily === "ste13") {
        violations.push(...pickViolations(await runSte13Check(tokenized, lookup), ruleId));
      } else if (dictFamily === "ste16") {
        violations.push(...pickViolations(await runSte16Check(tokenized, lookup), ruleId));
      } else {
        violations.push(...pickViolations(await runSte17Check(tokenized, lookup), ruleId));
      }
    }

    const syncRunners = SYNC_ENGINES[ruleId];
    if (syncRunners) {
      for (const run of syncRunners) {
        violations.push(...pickViolations(run(tokenized), ruleId));
      }
    }

    if (!dictFamily && !syncRunners) {
      return NextResponse.json({
        ruleId,
        compliant: null,
        notImplementable: true,
        violations: [],
        message: "No engine is configured for this rule.",
      });
    }

    const deduped = dedupe(violations);
    const count = deduped.length;

    return NextResponse.json({
      ruleId,
      compliant: count === 0,
      violations: deduped,
      message:
        count === 0
          ? "No violations found — text appears compliant with this rule."
          : `${count} violation${count !== 1 ? "s" : ""} found.`,
    });
  } catch (e) {
    const err = e instanceof Error ? e : new Error(String(e));
    console.error("[rule-test]", ruleId, err.message);
    return NextResponse.json(
      {
        error: "Test failed",
        details: process.env.NODE_ENV !== "production" ? err.message : undefined,
      },
      { status: 500 }
    );
  }
}
