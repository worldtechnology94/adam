/**
 * ADAM — STE-6.2 rule engine (List structure)
 *
 * ASD-STE100 Issue 9: When you give three or more parallel items in a sentence,
 * use a list instead of a run-on prose sentence.
 *
 * Detection: a sentence containing two or more comma tokens AND at least one
 * "and" or "or" word token appearing after the last comma. This pattern reliably
 * identifies a series of 3+ parallel items written as prose:
 *
 *   "Check the oil level, the coolant level, and the brake fluid level."
 *   "Connect to port A, port B, or port C."
 *
 * Only sentences with ≥ 8 word tokens are checked to avoid flagging short,
 * trivial enumerations like "red, green, or blue" in labelling contexts.
 *
 * Position: the violation is anchored to the first comma in the series, spanning
 * to the end of the sentence so the full list is highlighted.
 *
 * @see remaining-ste-rules.md — STE-6.2
 */

import type { TokenizedDocument } from "./types";

const RULE_ID   = "STE-6.2";
const RULE_NAME = "Parallel items should be a list";

const MIN_WORD_COUNT   = 8;  // ignore very short sentences
const CONNECTORS       = new Set(["and", "or"]);

export interface Ste62Violation {
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

export interface Ste62EngineResult {
  violations: Ste62Violation[];
}

export function runSte62Check(doc: TokenizedDocument): Ste62EngineResult {
  const violations: Ste62Violation[] = [];

  for (const sentence of doc.sentences) {
    const docStart  = sentence.offsetInDocument.start;
    const allTokens = sentence.tokens;
    const wordCount = allTokens.filter((t) => t.isWord).length;

    if (wordCount < MIN_WORD_COUNT) continue;

    // Collect indices (in allTokens) of all comma tokens
    const commaIndices: number[] = [];
    for (let i = 0; i < allTokens.length; i++) {
      const t = allTokens[i]!;
      if (!t.isWord && t.raw.trim() === ",") {
        commaIndices.push(i);
      }
    }

    // Need at least 2 commas to form a 3-item series
    if (commaIndices.length < 2) continue;

    // Check whether a connector ("and" / "or") appears after the last comma
    const lastCommaIdx    = commaIndices[commaIndices.length - 1]!;
    const tokensAfterLast = allTokens.slice(lastCommaIdx + 1);
    const hasConnector    = tokensAfterLast.some(
      (t) => t.isWord && CONNECTORS.has(t.normalized.toLowerCase()),
    );

    if (!hasConnector) continue;

    // Anchor the violation at the first comma in the series
    const firstCommaToken = allTokens[commaIndices[0]!]!;
    const lastToken       = allTokens[allTokens.length - 1]!;

    const positionStart = docStart + firstCommaToken.offsetInSentence.start;
    const positionEnd   = docStart + lastToken.offsetInSentence.end;

    violations.push({
      sentenceIndex:   sentence.index,
      sentenceExcerpt: sentence.text,
      tokenRaw:        sentence.text,
      tokenNormalized: sentence.text.toLowerCase(),
      positionStart,
      positionEnd,
      ruleId:          RULE_ID,
      ruleName:        RULE_NAME,
      severity:        "minor",
      reason:          "parallel_items_should_be_list",
      suggestion:
        `This sentence lists ${commaIndices.length + 1} parallel items separated by commas. ` +
        "Convert them to a bulleted or numbered list so the reader can scan each item easily.",
      wordCount,
    });
  }

  return { violations };
}
