/**
 * ADAM — STE-8.5 rule engine (optional (s) plural notation)
 *
 * STEMG / Global English practice: avoid **word(s)** optional-plural notation.
 *
 * Scans full sentence text so **valve(s)** is found even if tokenized as one unit.
 *
 * @see data/ste-rules.json — STE-8.5
 */

import type { TokenizedDocument } from "./types";

const RULE_ID = "STE-8.5";
const RULE_NAME = "Optional (s) plural notation";

const SUGGESTION =
  "Avoid (s) optional plural notation (e.g. valve(s)). Write the singular and plural forms clearly or use separate list items.";

const OPTIONAL_S_PLURAL = /\b\w+\(s\)/gi;

export interface Ste85Violation {
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

export interface Ste85EngineResult {
  violations: Ste85Violation[];
}

export function runSte85Check(doc: TokenizedDocument): Ste85EngineResult {
  const violations: Ste85Violation[] = [];

  for (const sentence of doc.sentences) {
    const text = sentence.text;
    let m: RegExpExecArray | null;
    const re = new RegExp(OPTIONAL_S_PLURAL.source, "gi");
    while ((m = re.exec(text)) !== null) {
      const start = sentence.offsetInDocument.start + m.index;
      const end = start + m[0].length;

      violations.push({
        sentenceIndex: sentence.index,
        sentenceExcerpt: sentence.text,
        tokenRaw: m[0],
        tokenNormalized: m[0].toLowerCase(),
        positionStart: start,
        positionEnd: end,
        ruleId: RULE_ID,
        ruleName: RULE_NAME,
        severity: "minor",
        reason: "optional_s_plural",
        suggestion: SUGGESTION,
        wordCount: sentence.tokens.filter((t) => t.isWord).length,
      });
    }
  }

  return { violations };
}
