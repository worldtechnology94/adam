/**
 * ADAM — STE-7.4 rule engine (clear warning language)
 *
 * ASD-STE100 Issue 9 (STEMG-aligned summary): Use clear, appropriate language
 * for safety text. Heuristic: after WARNING/CAUTION/DANGER:, avoid vague hedging
 * (perhaps, maybe, hopefully, sort of, …) that weakens the safety message.
 *
 * @see docs/extended-rule-coverage-plan.md
 */

import type { TokenizedDocument } from "./types";
import { STE7_SAFETY_LABEL_LINE } from "./ste7-patterns";

const RULE_ID = "STE-7.2";
const RULE_NAME = "Start safety instruction with a clear command or condition";

const SUGGESTION =
  "Use clear, direct language for safety text; avoid vague hedging (perhaps, maybe, hopefully, sort of) in the warning body.";

/** Hedging / vague wording discouraged in safety lines (body only). */
const VAGUE_HEDGING = /\b(perhaps|maybe|hopefully|sort of|kind of|a little bit|somewhat)\b/i;

export interface Ste74Violation {
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

export interface Ste74EngineResult {
  violations: Ste74Violation[];
}

export function runSte74Check(doc: TokenizedDocument): Ste74EngineResult {
  const violations: Ste74Violation[] = [];

  for (const sentence of doc.sentences) {
    const trimmed = sentence.text.trim();
    if (!trimmed) continue;

    const m = trimmed.match(STE7_SAFETY_LABEL_LINE);
    if (!m) continue;

    const body = (m[2] ?? "").trim();
    if (!body) continue;

    if (!VAGUE_HEDGING.test(body)) continue;

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
      severity: "minor",
      reason: "vague_hedging_in_safety_text",
      suggestion: SUGGESTION,
      wordCount: sentenceWordCount,
    });
  }

  return { violations };
}
