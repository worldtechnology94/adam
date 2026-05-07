/**
 * ADAM — STE-4.4 rule engine (connecting words and phrases)
 *
 * ASD-STE100 Issue 9 (summary): Use connecting words and phrases to connect
 * sentences that contain related topics. TechScribe notes this rule is hard to
 * automate; ADAM uses **pairwise heuristics** on consecutive sentences:
 *
 * 1. **Weak discourse openers** — Sentence starts with Also / Additionally /
 *    Furthermore / Moreover / Besides when a previous sentence exists (prefer
 *    clearer STEMG-style links such as And, But, Then, Thus, As a result, or
 *    a pronoun).
 * 2. **Repeated “The + noun”** — Two consecutive **descriptive** sentences both
 *    begin with the same article + noun (“The valve X. The valve Y.”). Suggest
 *    linking with a pronoun or connector.
 *
 * Does not overlap STE-4.2 (And/But/Or fragments); does not resolve the spec
 * tension where And-initial sentences are allowed in some Issue 9 examples.
 *
 * @see docs/extended-rule-coverage-plan.md — STE-4.4
 */

import type { Sentence, TokenizedDocument } from "./types";
import { classifySentenceRole } from "./sentence-classifier";

const RULE_ID = "STE-4.4";
const RULE_NAME = "Connecting words and phrases";

const SUGGEST_WEAK =
  "Prefer an approved STEMG-style link (e.g. And, But, Then, Thus, As a result) or a pronoun (this, it, they) to connect related sentences, instead of weak openers like Also, Additionally, or Furthermore at the start of the sentence.";

const SUGGEST_REPEAT =
  "Consider connecting these related sentences with a pronoun or approved connector (e.g. This valve, It, Then) instead of repeating the same article + noun.";

/** Weak openers when a prior sentence exists (heuristic). */
const WEAK_OPENER = /^\s*(also|additionally|furthermore|moreover|besides)\b/i;

function wordTokens(sentence: Sentence) {
  return sentence.tokens.filter((t) => t.isWord);
}

function absOffset(sentence: Sentence, tokenIndex: number): number {
  const t = sentence.tokens[tokenIndex];
  if (!t) return sentence.offsetInDocument.start;
  return sentence.offsetInDocument.start + t.offsetInSentence.start;
}

function absEnd(sentence: Sentence, tokenIndex: number): number {
  const t = sentence.tokens[tokenIndex];
  if (!t) return sentence.offsetInDocument.end;
  return sentence.offsetInDocument.start + t.offsetInSentence.end;
}

export interface Ste44Violation {
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

export interface Ste44EngineResult {
  violations: Ste44Violation[];
}

export function runSte44Check(doc: TokenizedDocument): Ste44EngineResult {
  const violations: Ste44Violation[] = [];
  const sentences = doc.sentences;

  for (let i = 0; i < sentences.length; i++) {
    const curr = sentences[i];
    const trimmed = curr.text.trim();
    if (!trimmed) continue;

    const currRole = classifySentenceRole(curr);
    if (currRole === "warning_like") continue;

    const words = wordTokens(curr);
    const currWordCount = words.length;

    if (i > 0) {
      const prev = sentences[i - 1]!;
      const prevRole = classifySentenceRole(prev);
      if (prevRole !== "warning_like") {
        if (WEAK_OPENER.test(trimmed)) {
          const start = curr.offsetInDocument.start;
          const end = curr.offsetInDocument.end;
          violations.push({
            sentenceIndex: curr.index,
            sentenceExcerpt: curr.text,
            tokenRaw: words[0]?.raw ?? "",
            tokenNormalized: words[0]?.normalized ?? "",
            positionStart: start,
            positionEnd: end,
            ruleId: RULE_ID,
            ruleName: RULE_NAME,
            severity: "minor",
            reason: "weak_sentence_connector",
            suggestion: SUGGEST_WEAK,
            wordCount: currWordCount,
          });
          continue;
        }
      }

      // Repeated "The" + same noun: consecutive descriptive only
      if (prevRole === "descriptive" && currRole === "descriptive") {
        const prevWords = wordTokens(prev);
        if (
          prevWords.length >= 2 &&
          words.length >= 2 &&
          prevWords[0].normalized.toLowerCase() === "the" &&
          words[0].normalized.toLowerCase() === "the" &&
          prevWords[1].normalized.toLowerCase() === words[1].normalized.toLowerCase()
        ) {
          const i0 = curr.tokens.indexOf(words[0]);
          const i1 = curr.tokens.indexOf(words[1]);
          const start = absOffset(curr, i0);
          const end = absEnd(curr, i1);
          violations.push({
            sentenceIndex: curr.index,
            sentenceExcerpt: curr.text,
            tokenRaw: `${words[0].raw} ${words[1].raw}`,
            tokenNormalized: `${words[0].normalized} ${words[1].normalized}`,
            positionStart: start,
            positionEnd: end,
            ruleId: RULE_ID,
            ruleName: RULE_NAME,
            severity: "minor",
            reason: "repeated_article_noun_pair",
            suggestion: SUGGEST_REPEAT,
            wordCount: currWordCount,
          });
        }
      }
    }
  }

  return { violations };
}
