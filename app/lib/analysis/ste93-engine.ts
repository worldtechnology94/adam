/**
 * ADAM — STE-9.3 rule engine (phrasal verbs — partial list)
 *
 * ASD-STE100 Issue 9: When you use two words together, do not make phrasal verbs.
 * Heuristic: flag common **verb + particle** pairs (consecutive word tokens).
 *
 * Skips **make sure** (handled elsewhere / approved STE pattern).
 *
 * @see data/ste-rules.json — STE-9.3
 */

import type { TokenizedDocument } from "./types";

const RULE_ID = "STE-9.3";
const RULE_NAME = "Phrasal verbs";

const SUGGESTION =
  "Avoid phrasal verbs; use a single approved STE verb where possible (e.g. OMIT instead of LEAVE OUT).";

/** [verb, particle] normalized lowercase */
const PHRASAL_PAIRS: [string, string][] = [
  ["carry", "out"],
  ["find", "out"],
  ["point", "out"],
  ["leave", "out"],
  ["give", "up"],
  ["take", "off"],
];

export interface Ste93Violation {
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

export interface Ste93EngineResult {
  violations: Ste93Violation[];
}

export function runSte93Check(doc: TokenizedDocument): Ste93EngineResult {
  const violations: Ste93Violation[] = [];

  for (const sentence of doc.sentences) {
    const words = sentence.tokens.filter((t) => t.isWord);
    const base = sentence.offsetInDocument.start;

    for (let i = 0; i < words.length - 1; i++) {
      const a = words[i]!;
      const b = words[i + 1]!;
      const na = a.normalized.toLowerCase();
      const nb = b.normalized.toLowerCase();

      if (na === "make" && nb === "sure") continue;

      for (const [v, p] of PHRASAL_PAIRS) {
        if (na === v && nb === p) {
          violations.push({
            sentenceIndex: sentence.index,
            sentenceExcerpt: sentence.text,
            tokenRaw: `${a.raw} ${b.raw}`,
            tokenNormalized: `${na} ${nb}`,
            positionStart: base + a.offsetInSentence.start,
            positionEnd: base + b.offsetInSentence.end,
            ruleId: RULE_ID,
            ruleName: RULE_NAME,
            severity: "minor",
            reason: "phrasal_verb",
            suggestion: SUGGESTION,
            wordCount: words.length,
          });
          break;
        }
      }
    }
  }

  return { violations };
}
