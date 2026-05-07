/**
 * ADAM — STE-8.6 rule engine (typographic quotation marks)
 *
 * Heuristic: prefer straight ASCII quotes in STE source for predictable parsing
 * and translation; flag **curly / smart** quotation characters.
 *
 * @see data/ste-rules.json — STE-8.6
 */

import type { TokenizedDocument } from "./types";

const RULE_ID = "STE-8.6";
const RULE_NAME = "Quotation marks";

const SUGGESTION =
  "Use straight quotation marks (') and (\") in technical STE text unless your style guide requires typographic quotes.";

/** Curly / smart single and double quotes. */
const SMART_QUOTES = /[\u201c\u201d\u2018\u2019]/;

export interface Ste86Violation {
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

export interface Ste86EngineResult {
  violations: Ste86Violation[];
}

export function runSte86Check(doc: TokenizedDocument): Ste86EngineResult {
  const violations: Ste86Violation[] = [];

  for (const sentence of doc.sentences) {
    const t = sentence.text;
    const m = SMART_QUOTES.exec(t);
    if (!m || m.index == null) continue;

    const start = sentence.offsetInDocument.start + m.index;
    const end = start + m[0].length;

    violations.push({
      sentenceIndex: sentence.index,
      sentenceExcerpt: sentence.text,
      tokenRaw: m[0],
      tokenNormalized: "",
      positionStart: start,
      positionEnd: end,
      ruleId: RULE_ID,
      ruleName: RULE_NAME,
      severity: "minor",
      reason: "smart_quote",
      suggestion: SUGGESTION,
      wordCount: sentence.tokens.filter((w) => w.isWord).length,
    });
  }

  return { violations };
}
