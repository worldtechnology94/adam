/**
 * ADAM — STE-5.1 / STE-5.2 rule engine (Sentence length)
 *
 * STE-5.1: Max 20 words per instructional sentence.
 * STE-5.2: Max 25 words per descriptive sentence.
 * Heuristic for type: first word token has POS "v" (verb) → instructional; else descriptive.
 *
 * @see ruleplan.md — STE-5.1, STE-5.2
 */

import type { TokenizedDocument } from "./types";

const MAX_WORDS_INSTRUCTIONAL = 20;
const MAX_WORDS_DESCRIPTIVE = 25;

const RULE_ID_51 = "STE-5.1";
const RULE_NAME_51 = "Maximum 20 words per instructional sentence";
const RULE_ID_52 = "STE-6.3";
const RULE_NAME_52 = "Maximum 25 words per descriptive sentence";

export type SentenceType = "instructional" | "descriptive";

/** Violation shape compatible with analyze route (persistence). */
export interface Ste5Violation {
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
  sentenceType: SentenceType | null;
}

export interface Ste5EngineResult {
  violations: Ste5Violation[];
}

/**
 * Classifies a sentence as instructional (e.g. imperative) or descriptive.
 * Heuristic: if the first word token has POS "v" (verb), treat as instructional; else descriptive.
 */
function classifySentenceType(sentence: { tokens: { isWord: boolean; posHeuristic?: string }[] }): SentenceType {
  const firstWord = sentence.tokens.find((t) => t.isWord);
  if (!firstWord) return "descriptive";
  const pos = (firstWord.posHeuristic ?? "").toLowerCase();
  return pos === "v" ? "instructional" : "descriptive";
}

/**
 * Runs STE-5.1 and STE-5.2: sentence length limits by type.
 */
export function runSte5Check(doc: TokenizedDocument): Ste5EngineResult {
  const violations: Ste5Violation[] = [];

  for (const sentence of doc.sentences) {
    // Count letter-words plus standalone numeric tokens (e.g. "6 mm" → 2 words per STE)
    const wordCount = sentence.tokens.filter(
      (t) => t.isWord || (t.normalized !== "" && /^\d+(?:[.,]\d+)?$/.test(t.normalized))
    ).length;
    const sentenceType = classifySentenceType(sentence);
    const start = sentence.offsetInDocument.start;
    const end = sentence.offsetInDocument.end;

    if (sentenceType === "instructional" && wordCount > MAX_WORDS_INSTRUCTIONAL) {
      violations.push({
        sentenceIndex: sentence.index,
        sentenceExcerpt: sentence.text,
        tokenRaw: "",
        tokenNormalized: "",
        positionStart: start,
        positionEnd: end,
        ruleId: RULE_ID_51,
        ruleName: RULE_NAME_51,
        severity: "major",
        reason: "sentence_length_instructional",
        suggestion: `Shorten this instructional sentence to ${MAX_WORDS_INSTRUCTIONAL} words or fewer (current: ${wordCount}).`,
        wordCount,
        sentenceType: "instructional",
      });
    }

    if (sentenceType === "descriptive" && wordCount > MAX_WORDS_DESCRIPTIVE) {
      violations.push({
        sentenceIndex: sentence.index,
        sentenceExcerpt: sentence.text,
        tokenRaw: "",
        tokenNormalized: "",
        positionStart: start,
        positionEnd: end,
        ruleId: RULE_ID_52,
        ruleName: RULE_NAME_52,
        severity: "major",
        reason: "sentence_length_descriptive",
        suggestion: `Shorten this descriptive sentence to ${MAX_WORDS_DESCRIPTIVE} words or fewer (current: ${wordCount}).`,
        wordCount,
        sentenceType: "descriptive",
      });
    }
  }

  return { violations };
}
