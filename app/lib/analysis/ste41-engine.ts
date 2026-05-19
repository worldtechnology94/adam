/**
 * ADAM — STE-4.1 rule engine (Imperative in procedures)
 *
 * Procedures should use imperative form (verb at start). Sentences that contain
 * procedural modals (should, must, shall) but do not start with a verb are flagged:
 * e.g. "The technician should open the valve" → violation; "Open the valve" → pass.
 *
 * @see ruleplan.md — STE-4.1
 */

import type { TokenizedDocument } from "./types";

const RULE_ID = "STE-5.3";
const RULE_NAME = "Write instructions in the imperative form";
const SUGGESTION = "Use imperative form. For example, instead of 'The technician should open the valve', write 'Open the valve'.";

const PROCEDURAL_MODALS = new Set(["should", "must", "shall", "can"]);

/** Violation shape compatible with analyze route (persistence). */
export interface Ste41Violation {
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

export interface Ste41EngineResult {
  violations: Ste41Violation[];
}

/**
 * Runs STE-4.1 check: procedural sentences should use imperative (verb first).
 * If sentence contains "should", "must", or "shall" but does not start with a verb → violation.
 */
export function runSte41Check(doc: TokenizedDocument): Ste41EngineResult {
  const violations: Ste41Violation[] = [];

  for (const sentence of doc.sentences) {
    const tokens = sentence.tokens.filter((t) => t.isWord);
    if (tokens.length === 0) continue;

    const firstWord = tokens[0];
    const firstPos = (firstWord.posHeuristic ?? "").toLowerCase();
    const startsWithVerb = firstPos === "v";

    const hasModal = tokens.some(
      (t) => t.normalized && PROCEDURAL_MODALS.has(t.normalized.toLowerCase())
    );

    if (hasModal && !startsWithVerb) {
      const start = sentence.offsetInDocument.start;
      const end = sentence.offsetInDocument.end;
      violations.push({
        sentenceIndex: sentence.index,
        sentenceExcerpt: sentence.text,
        tokenRaw: "",
        tokenNormalized: "",
        positionStart: start,
        positionEnd: end,
        ruleId: RULE_ID,
        ruleName: RULE_NAME,
        severity: "major",
        reason: "non_imperative_procedure",
        suggestion: SUGGESTION,
        wordCount: tokens.length,
      });
    }
  }

  return { violations };
}
