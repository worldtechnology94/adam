/**
 * ADAM — STE-7.2 rule engine (safety instruction: command or condition first)
 *
 * ASD-STE100 Issue 9 (summary): Start a safety instruction with a clear and
 * accurate command or condition.
 *
 * Heuristic (narrow, high-precision): For lines that start with WARNING:/CAUTION:/DANGER:,
 * flag obvious **non-command** openers after the label (e.g. "Note that", "It is important")
 * that delay the command or condition. This does not fully parse imperatives; document
 * limitations in the thesis.
 *
 * @see docs/extended-rule-coverage-plan.md — Phase 1
 */

import type { TokenizedDocument } from "./types";
import { STE7_SAFETY_LABEL_LINE, STE7_WEAK_LEAD_IN } from "./ste7-patterns";

const RULE_ID = "STE-7.2";
const RULE_NAME = "Safety instruction command or condition";
const SUGGESTION =
  "Start the safety text with a clear command (e.g. imperative) or condition (e.g. If/When…), not a narrative lead-in.";

export interface Ste72Violation {
  sentenceIndex: number;
  sentenceExcerpt: string;
  tokenRaw: string;
  tokenNormalized: string;
  positionStart: number;
  positionEnd: number;
  ruleId: string;
  ruleName: string;
  severity: "critical" | "major" | "minor";
  reason: string;
  suggestion: string;
  wordCount: number;
}

export interface Ste72EngineResult {
  violations: Ste72Violation[];
}

export function runSte72Check(doc: TokenizedDocument): Ste72EngineResult {
  const violations: Ste72Violation[] = [];

  for (const sentence of doc.sentences) {
    const trimmed = sentence.text.trim();
    if (!trimmed) continue;

    const m = trimmed.match(STE7_SAFETY_LABEL_LINE);
    if (!m) continue;

    const body = m[2] ?? "";
    if (!body.trim()) continue;

    if (STE7_WEAK_LEAD_IN.test(body)) {
      const start = sentence.offsetInDocument.start;
      const end = sentence.offsetInDocument.end;
      const sentenceWordCount = sentence.tokens.filter((t) => t.isWord).length;
      violations.push({
        sentenceIndex: sentence.index,
        sentenceExcerpt: sentence.text,
        tokenRaw: "",
        tokenNormalized: "",
        positionStart: start,
        positionEnd: end,
        ruleId: RULE_ID,
        ruleName: RULE_NAME,
        severity: "major",
        reason: "safety_lead_in",
        suggestion: SUGGESTION,
        wordCount: sentenceWordCount,
      });
    }
  }

  return { violations };
}
