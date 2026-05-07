/**
 * ADAM — STE-4.5 rule engine (article or demonstrative before a noun)
 *
 * ASD-STE100 Issue 9 (summary): When applicable, use an article or a demonstrative
 * adjective before a noun.
 *
 * Heuristic (narrow): On **instructional** sentences (first word POS = verb, same as
 * STE-5), if the sentence opens with **imperative + bare noun** (second word looks
 * like a noun and is not a/an/the/this/that…), flag. Skips adverbs, adjectives,
 * pronouns, and common non-noun second words after imperatives.
 *
 * Does not handle three-word opens ("Install new filter") in v1 — extend later.
 *
 * @see docs/extended-rule-coverage-plan.md — Phase 2
 */

import type { TokenizedDocument, Token } from "./types";

const RULE_ID = "STE-4.5";
const RULE_NAME = "Article or demonstrative before a noun";
const SUGGESTION =
  "When applicable, add a definite article (THE), indefinite article (A/AN), or a demonstrative adjective (THIS/THAT/THESE/THOSE) before the noun.";

const ARTICLES_AND_DEMS = new Set([
  "a",
  "an",
  "the",
  "this",
  "that",
  "these",
  "those",
]);

/** Second word after imperative that is not a noun object (reduce false positives). */
const NON_NOUN_SECOND = new Set([
  "not",
  "sure",
  "carefully",
  "slowly",
  "quickly",
  "fully",
  "here",
  "there",
  "now",
  "again",
  "away",
  "back",
  "together",
  "apart",
  "first",
  "then",
  "when",
  "if",
  "until",
]);

export interface Ste45Violation {
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

export interface Ste45EngineResult {
  violations: Ste45Violation[];
}

function isInstructionalFirstVerb(sentence: { tokens: Token[] }): boolean {
  const firstWord = sentence.tokens.find((t) => t.isWord);
  if (!firstWord) return false;
  return (firstWord.posHeuristic ?? "").toLowerCase() === "v";
}

function isLikelyObjectNoun(token: Token): boolean {
  const pos = (token.posHeuristic ?? "").toLowerCase();
  const n = token.normalized.toLowerCase();
  if (NON_NOUN_SECOND.has(n)) return false;
  if (pos === "n") return true;
  if (pos === "adj" || pos === "adv" || pos === "prep" || pos === "conj" || pos === "pron" || pos === "art") {
    return false;
  }
  if (pos === "v") return false;
  if (n.length < 2) return false;
  if (n.endsWith("ly")) return false;
  if (NON_NOUN_SECOND.has(n)) return false;
  if (pos === "unknown" && n.length >= 2) return true;
  return false;
}

export function runSte45Check(doc: TokenizedDocument): Ste45EngineResult {
  const violations: Ste45Violation[] = [];

  for (const sentence of doc.sentences) {
    if (!isInstructionalFirstVerb(sentence)) continue;

    const words = sentence.tokens.filter((t) => t.isWord);
    if (words.length < 2) continue;

    const t0 = words[0];
    const t1 = words[1];
    const w1 = t1.normalized.toLowerCase();

    if (ARTICLES_AND_DEMS.has(w1)) continue;
    if (!isLikelyObjectNoun(t1)) continue;

    const docStart = sentence.offsetInDocument.start;
    const positionStart = docStart + t1.offsetInSentence.start;
    const positionEnd = docStart + t1.offsetInSentence.end;
    const sentenceWordCount = words.length;

    violations.push({
      sentenceIndex: sentence.index,
      sentenceExcerpt: sentence.text,
      tokenRaw: t1.raw,
      tokenNormalized: t1.normalized,
      positionStart,
      positionEnd,
      ruleId: RULE_ID,
      ruleName: RULE_NAME,
      severity: "minor",
      reason: "missing_article_before_noun",
      suggestion: SUGGESTION,
      wordCount: sentenceWordCount,
    });
  }

  return { violations };
}
