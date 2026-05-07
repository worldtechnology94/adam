/**
 * ADAM — STE-4.2 rule engine (do not omit words to shorten sentences)
 *
 * ASD-STE100 Issue 9 (summary): Do not omit words or use contractions to make
 * your sentences shorter.
 *
 * **Contractions** are checked separately by STE-8.4 (`ste84-engine.ts`) to avoid
 * duplicate violations on the same token.
 *
 * This engine flags a common **omission** pattern: a **sentence fragment** that
 * starts with a coordinating conjunction (omitted subject / prior clause), e.g.
 * "And open the valve." — not valid as a standalone STE sentence.
 *
 * @see docs/extended-rule-coverage-plan.md — Phase 2
 */

import type { TokenizedDocument } from "./types";

const RULE_ID = "STE-4.2";
const RULE_NAME = "Do not omit words";
const SUGGESTION =
  "Write a complete sentence with an explicit subject where required. Do not start a standalone sentence with And, But, or Or (omitted words).";

/** Standalone sentence begins with conjunction — often a fragment with omitted subject. */
const FRAGMENT_START = /^\s*(And|But|Or)\s+/i;

export interface Ste42Violation {
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

export interface Ste42EngineResult {
  violations: Ste42Violation[];
}

export function runSte42Check(doc: TokenizedDocument): Ste42EngineResult {
  const violations: Ste42Violation[] = [];

  for (const sentence of doc.sentences) {
    const trimmed = sentence.text.trim();
    if (!trimmed) continue;

    if (!FRAGMENT_START.test(trimmed)) continue;

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
      severity: "minor",
      reason: "sentence_fragment",
      suggestion: SUGGESTION,
      wordCount: sentenceWordCount,
    });
  }

  return { violations };
}
