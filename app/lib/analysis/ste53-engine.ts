/**
 * ADAM — STE-5.3 rule engine (instructions in imperative form)
 *
 * ASD-STE100 Issue 9: Write instructions in the imperative (command) form.
 * TechScribe notes that "You + modal + verb base" (e.g. You must open) is a
 * pattern the term checker does not always catch separately from other rules.
 *
 * Heuristic: flag sentences that start with **You** + modal + verb (instruction
 * phrased as second person + modal instead of imperative).
 *
 * @see ruleplan.md — STE-5.3
 */

import type { TokenizedDocument } from "./types";

const RULE_ID = "STE-5.3";
const RULE_NAME = "Instructions in imperative form";

const SUGGESTION =
  "Write the instruction as an imperative (e.g. Open the valve) instead of You must / You should + verb, unless your project style explicitly allows it.";

/** You + modal + following word (verb stem) — sentence-initial procedural pattern. */
const YOU_MODAL_VERB = /^\s*You\s+(must|should|shall|need to|have to|can|may|will)\s+/i;

export interface Ste53Violation {
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

export interface Ste53EngineResult {
  violations: Ste53Violation[];
}

export function runSte53Check(doc: TokenizedDocument): Ste53EngineResult {
  const violations: Ste53Violation[] = [];

  for (const sentence of doc.sentences) {
    const trimmed = sentence.text.trim();
    if (!trimmed) continue;

    if (!YOU_MODAL_VERB.test(trimmed)) continue;

    const words = sentence.tokens.filter((t) => t.isWord);
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
      severity: "minor",
      reason: "you_modal_instruction",
      suggestion: SUGGESTION,
      wordCount: words.length,
    });
  }

  return { violations };
}
