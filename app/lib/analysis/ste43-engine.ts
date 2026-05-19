/**
 * ADAM — STE-4.3 rule engine (vertical list for complex text)
 *
 * ASD-STE100 Issue 9 (summary): Use a vertical list for complex text.
 *
 * Heuristic: On **instructional** sentences (verb-first, see `classifySentenceRole`),
 * if the sentence is **long** and has **many commas** (dense coordination), suggest
 * restructuring as a vertical list. Skips lines that already look like list items.
 *
 * Limitations: Does not parse PDF layout; tune MIN_WORDS / MIN_COMMAS from real manuals.
 *
 * @see docs/extended-rule-coverage-plan.md — Phase 2, STE-4.3
 */

import type { TokenizedDocument } from "./types";
import { classifySentenceRole } from "./sentence-classifier";

const RULE_ID = "STE-4.3";
const RULE_NAME = "Vertical list for complex text";

/** At or above this word count, a sentence may be "complex". */
const MIN_WORDS = 18;
/** At or above this comma count, coordination is considered dense. */
const MIN_COMMAS = 3;

const SUGGESTION =
  "Consider a vertical list (bullet or numbered steps) to make complex information easier to follow.";

/** Line already formatted as a list item (common plain-text markers). */
const LOOKS_LIKE_LIST_LINE =
  /^\s*(?:[-*•▪]\s|\d{1,2}[.)]\s|[a-z]\)\s|[(]?[a-z][.)]\s)/i;

function countCommas(text: string): number {
  return (text.match(/,/g) ?? []).length;
}

export interface Ste43Violation {
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

export interface Ste43EngineResult {
  violations: Ste43Violation[];
}

export function runSte43Check(doc: TokenizedDocument): Ste43EngineResult {
  const violations: Ste43Violation[] = [];

  for (const sentence of doc.sentences) {
    const trimmed = sentence.text.trim();
    if (!trimmed) continue;

    if (LOOKS_LIKE_LIST_LINE.test(trimmed)) continue;

    if (classifySentenceRole(sentence) === "warning_like") continue;

    const wordCount = sentence.tokens.filter((t) => t.isWord).length;
    if (wordCount < MIN_WORDS) continue;

    const commas = countCommas(sentence.text);
    if (commas < MIN_COMMAS) continue;

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
      reason: "complex_text_consider_list",
      suggestion: SUGGESTION,
      wordCount,
    });
  }

  return { violations };
}
