/**
 * ADAM — STE-8.7 rule engine (hyphen / dash characters)
 *
 * ASD-STE100 Issue 9 punctuation: hyphenated words count as one word; avoid
 * **em dash** or **double hyphen** as a sentence separator in STE prose.
 *
 * Heuristic: flag ** -- ** (spaced double hyphen) or **—** (Unicode em dash).
 *
 * @see data/ste-rules.json — STE-8.7
 */

import type { TokenizedDocument } from "./types";

const RULE_ID = "STE-8.7";
const RULE_NAME = "Hyphens and dashes";

const SUGGESTION =
  "Use a full stop and a new sentence, or 'and' / 'or', instead of an em dash or double hyphen as a break in the sentence.";

const EM_OR_DOUBLE_HYPHEN = /(?:—|\s--\s)/;

export interface Ste87Violation {
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

export interface Ste87EngineResult {
  violations: Ste87Violation[];
}

export function runSte87Check(doc: TokenizedDocument): Ste87EngineResult {
  const violations: Ste87Violation[] = [];

  for (const sentence of doc.sentences) {
    const t = sentence.text;
    if (!EM_OR_DOUBLE_HYPHEN.test(t)) continue;

    const m = t.match(EM_OR_DOUBLE_HYPHEN);
    const relStart = m && m.index != null ? m.index : 0;
    const relEnd = relStart + (m?.[0].length ?? 1);

    const start = sentence.offsetInDocument.start + relStart;
    const end = sentence.offsetInDocument.start + relEnd;

    violations.push({
      sentenceIndex: sentence.index,
      sentenceExcerpt: sentence.text,
      tokenRaw: m?.[0] ?? "",
      tokenNormalized: "",
      positionStart: start,
      positionEnd: end,
      ruleId: RULE_ID,
      ruleName: RULE_NAME,
      severity: "minor",
      reason: "em_dash_or_double_hyphen",
      suggestion: SUGGESTION,
      wordCount: sentence.tokens.filter((w) => w.isWord).length,
    });
  }

  return { violations };
}
