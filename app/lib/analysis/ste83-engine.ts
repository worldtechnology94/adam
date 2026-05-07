/**
 * ADAM — STE-8.3 rule engine (Hyphens — compound numbers)
 *
 * Spelled-out numbers 21–99 should be hyphenated (e.g. twenty-one, not twenty one).
 * Detects consecutive tokens "twenty" + "one" through "ninety" + "nine".
 *
 * @see ruleplan.md — STE-8.3
 */

import type { TokenizedDocument } from "./types";

const RULE_ID = "STE-8.3";
const RULE_NAME = "Hyphens";

const TENS = new Set(["twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety"]);
const UNITS = new Set(["one", "two", "three", "four", "five", "six", "seven", "eight", "nine"]);

/** Violation shape compatible with analyze route (persistence). */
export interface Ste83Violation {
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

export interface Ste83EngineResult {
  violations: Ste83Violation[];
}

/**
 * Runs STE-8.3 check: hyphenate compound numbers (twenty-one through ninety-nine).
 */
export function runSte83Check(doc: TokenizedDocument): Ste83EngineResult {
  const violations: Ste83Violation[] = [];

  for (const sentence of doc.sentences) {
    const docStart = sentence.offsetInDocument.start;
    const sentenceWordCount = sentence.tokens.filter((t) => t.isWord).length;
    const tokens = sentence.tokens;

    for (let i = 0; i < tokens.length - 1; i++) {
      const t0 = tokens[i];
      const t1 = tokens[i + 1];
      if (!t0.isWord || !t1.isWord || !t0.normalized || !t1.normalized) continue;

      const n0 = t0.normalized.toLowerCase();
      const n1 = t1.normalized.toLowerCase();
      if (!TENS.has(n0) || !UNITS.has(n1)) continue;

      const positionStart = docStart + t0.offsetInSentence.start;
      const positionEnd = docStart + t1.offsetInSentence.end;
      const suggested = `${n0}-${n1}`;
      violations.push({
        sentenceIndex: sentence.index,
        sentenceExcerpt: sentence.text,
        tokenRaw: t0.raw + " " + t1.raw,
        tokenNormalized: n0 + " " + n1,
        positionStart,
        positionEnd,
        ruleId: RULE_ID,
        ruleName: RULE_NAME,
        severity: "minor",
        reason: "compound_number_hyphen",
        suggestion: `Use a hyphen in compound numbers: write "${suggested}" instead of "${n0} ${n1}".`,
        wordCount: sentenceWordCount,
      });
    }
  }

  return { violations };
}
