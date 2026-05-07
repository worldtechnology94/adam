/**
 * ADAM — STE-3.6 rule engine (Prohibited auxiliary verbs)
 *
 * ASD-STE100 Issue 9: Use only the auxiliary verbs approved in the STE dictionary.
 * Approved: can, may, must, shall, will.
 * Prohibited: could, would, should, might, ought (to), need to, have to, has to,
 *             had to, used to — these carry ambiguity or conditional tone.
 *
 * @see remaining-ste-rules.md — STE-3.6
 */

import type { TokenizedDocument } from "./types";

const RULE_ID = "STE-3.6";
const RULE_NAME = "Prohibited auxiliary verb";

/** Single-token prohibited auxiliaries (normalized lowercase). */
const PROHIBITED_SINGLE: Record<string, string> = {
  could:  "Replace 'could' with 'can' (ability) or 'may' (possibility).",
  would:  "Replace 'would' with 'will', or rephrase as a direct instruction.",
  should: "Replace 'should' with 'must' (if it is an obligation) or remove it (if it is advice).",
  might:  "Replace 'might' with 'may'.",
  ought:  "Replace 'ought' with 'must'.",
};

/**
 * Two-token prohibited auxiliaries: [first word, second word] → suggestion.
 * The second token for all of these is "to".
 */
const PROHIBITED_BIGRAM_FIRST: Record<string, string> = {
  need:  "Replace 'need to' with 'must'.",
  have:  "Replace 'have to' with 'must'.",
  has:   "Replace 'has to' with 'must'.",
  had:   "Replace 'had to' with 'must', or rephrase in simple present tense.",
  used:  "Do not use 'used to'. Describe current behavior using simple present tense.",
  ought: "Replace 'ought to' with 'must'.",
};

export interface Ste36Violation {
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

export interface Ste36EngineResult {
  violations: Ste36Violation[];
}

export function runSte36Check(doc: TokenizedDocument): Ste36EngineResult {
  const violations: Ste36Violation[] = [];

  for (const sentence of doc.sentences) {
    const docStart = sentence.offsetInDocument.start;
    const words = sentence.tokens.filter((t) => t.isWord);
    const wordCount = words.length;

    for (let i = 0; i < words.length; i++) {
      const w = words[i]!;
      const norm = w.normalized.toLowerCase();

      // Check two-token bigram first (e.g. "need to", "have to")
      // to avoid emitting a single-token violation for "ought" when "ought to" should be the match.
      if (i + 1 < words.length) {
        const next = words[i + 1]!;
        if (next.normalized.toLowerCase() === "to" && PROHIBITED_BIGRAM_FIRST[norm] !== undefined) {
          const suggestion = PROHIBITED_BIGRAM_FIRST[norm]!;
          const positionStart = docStart + w.offsetInSentence.start;
          const positionEnd   = docStart + next.offsetInSentence.end;
          violations.push({
            sentenceIndex:   sentence.index,
            sentenceExcerpt: sentence.text,
            tokenRaw:        `${w.raw} ${next.raw}`,
            tokenNormalized: `${norm} to`,
            positionStart,
            positionEnd,
            ruleId:     RULE_ID,
            ruleName:   RULE_NAME,
            severity:   "major",
            reason:     "prohibited_auxiliary",
            suggestion,
            wordCount,
          });
          i++; // skip the "to" token — already consumed
          continue;
        }
      }

      // Single-token check (could, would, should, might, ought without "to")
      if (PROHIBITED_SINGLE[norm] !== undefined) {
        const suggestion = PROHIBITED_SINGLE[norm]!;
        violations.push({
          sentenceIndex:   sentence.index,
          sentenceExcerpt: sentence.text,
          tokenRaw:        w.raw,
          tokenNormalized: norm,
          positionStart:   docStart + w.offsetInSentence.start,
          positionEnd:     docStart + w.offsetInSentence.end,
          ruleId:     RULE_ID,
          ruleName:   RULE_NAME,
          severity:   "major",
          reason:     "prohibited_auxiliary",
          suggestion,
          wordCount,
        });
      }
    }
  }

  return { violations };
}
