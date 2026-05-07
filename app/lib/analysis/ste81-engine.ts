/**
 * ADAM — STE-8.1 rule engine (No semicolons)
 *
 * Scans each sentence for semicolons; each occurrence is reported as a violation.
 * Used by the analysis pipeline alongside STE-1.1/1.2/1.5.
 *
 * @see ruleplan.md — STE-8.1
 */

import type { TokenizedDocument } from "./types";

const RULE_ID = "STE-8.1";
const RULE_NAME = "No semicolons";
const SUGGESTION = "Replace the semicolon with a period or rephrase into separate sentences.";

/** Violation shape compatible with analyze route (same fields as Ste11Violation for persistence). */
export interface Ste81Violation {
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

export interface Ste81EngineResult {
  violations: Ste81Violation[];
}

/**
 * Runs STE-8.1 check: no semicolons in sentences.
 * Returns one violation per semicolon found (with document offsets for highlighting).
 */
export function runSte81Check(doc: TokenizedDocument): Ste81EngineResult {
  const violations: Ste81Violation[] = [];

  for (const sentence of doc.sentences) {
    const docStart = sentence.offsetInDocument.start;
    const sentenceWordCount = sentence.tokens.filter((t) => t.isWord).length;

    for (let i = 0; i < sentence.text.length; i++) {
      if (sentence.text[i] === ";") {
        violations.push({
          sentenceIndex: sentence.index,
          sentenceExcerpt: sentence.text,
          tokenRaw: ";",
          tokenNormalized: ";",
          positionStart: docStart + i,
          positionEnd: docStart + i + 1,
          ruleId: RULE_ID,
          ruleName: RULE_NAME,
          severity: "major",
          reason: "semicolon",
          suggestion: SUGGESTION,
          wordCount: sentenceWordCount,
        });
      }
    }
  }

  return { violations };
}
