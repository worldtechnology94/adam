/**
 * ADAM — STE-8.1 rule engine (Em dash and double hyphen as sentence joiners)
 *
 * ASD-STE100 Issue 9 Rule 8.1: Do not use a semicolon. Write short sentences.
 * Like semicolons, em dashes (—) and double hyphens (--) are used in general
 * English to join two independent clauses into one sentence. This violates
 * the STE principle of short, simple sentences — each clause should be its
 * own sentence.
 *
 * ASD-STE100 Rule 8.7 clarifies that hyphenated compounds count as one word
 * for word-count purposes (e.g. "soap-and-water" = one word). The current
 * engine does NOT flag standard compound hyphens; it flags only em dashes
 * and spaced double hyphens used as clause separators.
 *
 * Violations:
 *   — (Unicode em dash)          — joins two clauses, obscures sentence boundary
 *   ` -- ` (spaced double hyphen) — informal em-dash substitute, same problem
 *
 * Non-STE: "Remove the panel — then disconnect the wiring harness."
 * STE:     "Remove the panel. Disconnect the wiring harness."
 *
 * Non-STE: "Check the oil level -- it must be above the MIN mark."
 * STE:     "Check the oil level. The oil level must be above the MIN mark."
 *
 * @see ste81-engine.ts — STE-8.1 (semicolons)
 */

import type { TokenizedDocument } from "./types";

const RULE_ID   = "STE-8.1";
const RULE_NAME = "Do not join clauses with em dashes or double hyphens";

const SUGGESTION =
  "Em dashes (—) and double hyphens (--) join independent clauses and make sentences complex " +
  "(ASD-STE100 Rule 8.1). Replace with a full stop and start a new sentence, " +
  "or use an approved connector (and, but, then, so).";

/** Matches spaced em dash or spaced double hyphen used as a clause separator. */
const EM_OR_DOUBLE_HYPHEN = /(?:—|\s--\s)/g;

export interface Ste87Violation {
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

export interface Ste87EngineResult {
  violations: Ste87Violation[];
}

export function runSte87Check(doc: TokenizedDocument): Ste87EngineResult {
  const violations: Ste87Violation[] = [];

  for (const sentence of doc.sentences) {
    const text      = sentence.text;
    const wordCount = sentence.tokens.filter((t) => t.isWord).length;

    EM_OR_DOUBLE_HYPHEN.lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = EM_OR_DOUBLE_HYPHEN.exec(text)) !== null) {
      const relStart = match.index;
      const relEnd   = relStart + match[0].length;

      violations.push({
        sentenceIndex:   sentence.index,
        sentenceExcerpt: sentence.text,
        tokenRaw:        match[0].trim(),
        tokenNormalized: match[0].trim() === "—" ? "em_dash" : "double_hyphen",
        positionStart:   sentence.offsetInDocument.start + relStart,
        positionEnd:     sentence.offsetInDocument.start + relEnd,
        ruleId:          RULE_ID,
        ruleName:        RULE_NAME,
        severity:        "minor",
        reason:          "em_dash_joins_clauses",
        suggestion:      SUGGESTION,
        wordCount,
      });
    }
  }

  return { violations };
}
