/**
 * ADAM — STE-5.4 rule engine (One instruction per sentence)
 *
 * ASD-STE100 Issue 9: Write only one instruction per sentence.
 * Do not combine two instructions with "and" or "or".
 *
 * Only applies to instructional sentences (first word token posHeuristic "v").
 * Fires when "and" / "or" is followed by a second imperative verb token.
 * One violation per sentence, anchored at the connector word.
 *
 * @see ste5-engine.ts — STE-5.1/5.2 (sentence length)
 * @see ste53-engine.ts — STE-5.3 ("You must" → imperative)
 * @see remaining-ste-rules.md — STE-5.4
 */

import type { TokenizedDocument } from "./types";

const RULE_ID   = "STE-5.2";
const RULE_NAME = "Write only one instruction per sentence";

const CONNECTORS = new Set(["and", "or"]);
const ARTICLES   = new Set(["a", "an", "the"]);

export interface Ste54Violation {
  sentenceIndex:   number;
  sentenceExcerpt: string;
  tokenRaw:        string;
  tokenNormalized: string;
  positionStart:   number;
  positionEnd:     number;
  ruleId:          string;
  ruleName:        string;
  severity:        "critical" | "major" | "minor";
  reason:          string;
  suggestion:      string;
  wordCount:       number;
}

export interface Ste54EngineResult {
  violations: Ste54Violation[];
}

export function runSte54Check(doc: TokenizedDocument): Ste54EngineResult {
  const violations: Ste54Violation[] = [];

  for (const sentence of doc.sentences) {
    const docStart  = sentence.offsetInDocument.start;
    const words     = sentence.tokens.filter((t) => t.isWord);
    const wordCount = words.length;

    if (wordCount < 3) continue;

    // Instructional sentences only — first word must be an imperative verb
    if (words[0]!.posHeuristic !== "v") continue;

    for (let i = 1; i < words.length - 1; i++) {
      const norm = words[i]!.normalized.toLowerCase();
      if (!CONNECTORS.has(norm)) continue;

      // Find the next non-article word after the connector
      let j = i + 1;
      while (j < words.length && ARTICLES.has(words[j]!.normalized.toLowerCase())) {
        j++;
      }
      if (j >= words.length) continue;

      const candidate = words[j]!;
      if (candidate.posHeuristic !== "v") continue;

      // Two imperative verbs joined by and/or → flag the connector
      const connector = words[i]!;
      violations.push({
        sentenceIndex:   sentence.index,
        sentenceExcerpt: sentence.text,
        tokenRaw:        connector.raw,
        tokenNormalized: norm,
        positionStart:   docStart + connector.offsetInSentence.start,
        positionEnd:     docStart + connector.offsetInSentence.end,
        ruleId:          RULE_ID,
        ruleName:        RULE_NAME,
        severity:        "major",
        reason:          "multiple_instructions_per_sentence",
        suggestion:
          `Write only one instruction per sentence. Split this sentence at '${connector.raw}' ` +
          `into two separate steps: end the first instruction with a full stop, ` +
          `then start the second instruction as a new sentence.`,
        wordCount,
      });
      break; // one violation per sentence
    }
  }

  return { violations };
}
