/**
 * ADAM — STE-7.1 rule engine (WARNING format)
 *
 * Warnings must start with "WARNING:" in capitals. Sentences that start with
 * a warning-like label (e.g. "Warning:", "Caution:", "Danger:") but not the
 * required "WARNING:" format are flagged.
 *
 * @see ruleplan.md — STE-7.1
 */

import type { TokenizedDocument } from "./types";

const RULE_ID = "STE-7.1";
const RULE_NAME = "WARNING format";
const SUGGESTION = "Start the sentence with 'WARNING:' in capitals, followed by a space and the warning text.";

/** Compliant: sentence starts with "WARNING:" (optional space after colon). */
const COMPLIANT_PATTERN = /^WARNING:\s*/;
/** Has a warning/caution-like prefix (wrong form if not COMPLIANT_PATTERN). */
const WARNING_LIKE_PATTERN = /^(?:WARNING|Warning|warning|CAUTION|Caution|caution|DANGER|Danger|danger)\s*:/;

/** Violation shape compatible with analyze route (persistence). */
export interface Ste71Violation {
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

export interface Ste71EngineResult {
  violations: Ste71Violation[];
}

/**
 * Runs STE-7.1 check: warning sentences must start with "WARNING:".
 */
export function runSte71Check(doc: TokenizedDocument): Ste71EngineResult {
  const violations: Ste71Violation[] = [];

  for (const sentence of doc.sentences) {
    const trimmed = sentence.text.trim();
    if (!trimmed) continue;

    const hasWarningLikePrefix = WARNING_LIKE_PATTERN.test(trimmed);
    const hasCompliantFormat = COMPLIANT_PATTERN.test(trimmed);

    if (hasWarningLikePrefix && !hasCompliantFormat) {
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
        reason: "warning_format",
        suggestion: SUGGESTION,
        wordCount: sentenceWordCount,
      });
    }
  }

  return { violations };
}
