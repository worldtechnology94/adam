/**
 * ADAM — STE-8.4 rule engine (Apostrophes — no contractions)
 *
 * STE prefers full forms over contractions (e.g. "do not" not "don't").
 * Flags tokens that contain an apostrophe and match common contractions.
 *
 * @see ruleplan.md — STE-8.4
 */

import type { TokenizedDocument } from "./types";

const RULE_ID = "STE-4.2";
const RULE_NAME = "Do not use contractions";

/** Common contractions (lowercase) → expanded form for suggestion. */
const CONTRACTIONS: Record<string, string> = {
  "don't": "do not",
  "doesn't": "does not",
  "didn't": "did not",
  "won't": "will not",
  "wouldn't": "would not",
  "can't": "cannot",
  "couldn't": "could not",
  "shouldn't": "should not",
  "mustn't": "must not",
  "isn't": "is not",
  "aren't": "are not",
  "wasn't": "was not",
  "weren't": "were not",
  "haven't": "have not",
  "hasn't": "has not",
  "hadn't": "had not",
  "it's": "it is",
  "that's": "that is",
  "there's": "there is",
  "what's": "what is",
  "who's": "who is",
  "they're": "they are",
  "we're": "we are",
  "you're": "you are",
  "i'm": "I am",
  "let's": "let us",
};

/** Violation shape compatible with analyze route (persistence). */
export interface Ste84Violation {
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

export interface Ste84EngineResult {
  violations: Ste84Violation[];
}

/**
 * Runs STE-8.4 check: do not use contractions; use full forms.
 */
export function runSte84Check(doc: TokenizedDocument): Ste84EngineResult {
  const violations: Ste84Violation[] = [];

  for (const sentence of doc.sentences) {
    const docStart = sentence.offsetInDocument.start;
    const sentenceWordCount = sentence.tokens.filter((t) => t.isWord).length;

    for (const token of sentence.tokens) {
      if (!token.raw.includes("'")) continue;
      const norm = (token.normalized ?? token.raw).toLowerCase();
      const expansion = CONTRACTIONS[norm];
      if (!expansion) continue;

      const positionStart = docStart + token.offsetInSentence.start;
      const positionEnd = docStart + token.offsetInSentence.end;
      violations.push({
        sentenceIndex: sentence.index,
        sentenceExcerpt: sentence.text,
        tokenRaw: token.raw,
        tokenNormalized: norm,
        positionStart,
        positionEnd,
        ruleId: RULE_ID,
        ruleName: RULE_NAME,
        severity: "minor",
        reason: "contraction",
        suggestion: `Do not use contractions in STE. Write "${expansion}" instead of "${token.raw}".`,
        wordCount: sentenceWordCount,
      });
    }
  }

  return { violations };
}
