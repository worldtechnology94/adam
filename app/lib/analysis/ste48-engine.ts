/**
 * ADAM — STE-4.8 rule engine (procedure completeness)
 *
 * Heuristic for **incomplete** procedural wording: placeholders and explicit
 * “to be completed” markers that leave the procedure undefined. Complements
 * STE-10.2 (e.g. etc.) and dictionary checks.
 *
 * Scope: **instructional** sentences (verb-first) only.
 *
 * @see docs/extended-rule-coverage-plan.md — STE-4.8
 */

import type { Sentence, TokenizedDocument } from "./types";
import { classifySentenceRole } from "./sentence-classifier";

const RULE_ID = "STE-4.8";
const RULE_NAME = "Procedure completeness";

const SUGGESTION =
  "Replace placeholders (TBD, TBC, …) with the completed procedure text, or remove the step until the content is known.";

/** Incomplete / placeholder markers in procedures (case-insensitive). */
const INCOMPLETE_MARKERS =
  /\b(TBD|TBC|TO\s+BE\s+(COMPLETED|DONE|ADDED|CONFIRMED)|PLACEHOLDER|\[TBD\]|\[TBC\])\b/i;

/**
 * Imperative openers not always tagged POS `v` (e.g. "tighten"); treat as procedural.
 */
const IMPERATIVE_OPENER =
  /^(open|close|tighten|loosen|remove|install|check|make|ensure|disconnect|connect|turn|press|pull|push|rotate|set|verify|apply|use|replace|drain|fill|add|clean|inspect|hold|release|lock|unlock|start|stop|reset|clear|cut|move|lift|lower|insert|attach|detach)\b/i;

function isProceduralInstruction(sentence: Sentence): boolean {
  if (classifySentenceRole(sentence) === "warning_like") return false;
  if (classifySentenceRole(sentence) === "instructional") return true;
  const trimmed = sentence.text.trim();
  return IMPERATIVE_OPENER.test(trimmed);
}

export interface Ste48Violation {
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

export interface Ste48EngineResult {
  violations: Ste48Violation[];
}

export function runSte48Check(doc: TokenizedDocument): Ste48EngineResult {
  const violations: Ste48Violation[] = [];

  for (const sentence of doc.sentences) {
    const trimmed = sentence.text.trim();
    if (!trimmed) continue;

    if (!isProceduralInstruction(sentence)) continue;

    if (!INCOMPLETE_MARKERS.test(trimmed)) continue;

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
      reason: "incomplete_procedure_placeholder",
      suggestion: SUGGESTION,
      wordCount: words.length,
    });
  }

  return { violations };
}
