/**
 * ADAM — STE-8.3 rule engine (Parentheses usage)
 *
 * ASD-STE100 Issue 9 Rule 8.3: You can use parentheses for:
 *   (a) References           — (Section 4), (Figure 2-1)
 *   (b) Identifiers          — (P/N 12345), (serial number: 001)
 *   (c) Abbreviations        — Electronic Control Unit (ECU), or ECU (Electronic Control Unit)
 *   (d) Singular/plural      — bolt(s), valve(s)
 *   (e) Alternatives         — (or), (and/or)
 *
 * Violation: Using parentheses to contain a full explanatory clause —
 * text with a finite verb that should be its own sentence or a note.
 *
 *   Non-STE: "Remove the panel (which protects the hydraulic lines)."
 *   STE:     "Remove the panel. The panel protects the hydraulic lines."
 *
 *   Non-STE: "Adjust the valve (the pressure must not exceed 3000 psi)."
 *   STE:     "Adjust the valve. Make sure that the pressure does not exceed 3000 psi."
 *
 * Detection: parenthetical content that contains a finite verb — indicating
 * a full clause rather than a brief reference, identifier, or abbreviation.
 * Cross-reference openers (see, refer to, go to) are excluded as they are
 * valid references.
 *
 * @see ste85-engine.ts — STE-8.5 (overlong parenthetical phrase without a verb)
 */

import type { TokenizedDocument } from "./types";

const RULE_ID   = "STE-8.3";
const RULE_NAME = "Use parentheses only for approved purposes";

/**
 * Finite verbs that, when found inside parentheses, indicate a full clause
 * (not a brief reference, identifier, or abbreviation).
 * Excludes cross-reference imperatives: see, refer, go.
 */
const CLAUSE_VERB_RE =
  /\b(is|are|was|were|will|shall|can|may|must|does|did|have|has|had|been|being|exceeds|prevents|causes|indicates|requires|means|shows|results|occurs|increases|decreases|contains|includes|provides|operates|applies|affects|controls|allows|enables|triggers|activates|supplies|measures|indicates|depends)\b/i;

/** Cross-reference openers inside parentheses — these are valid. */
const XREF_OPENER_RE = /^\s*(see|refer\s+to|go\s+to|refer|check)\b/i;

/** Matches content inside any pair of parentheses. */
const PAREN_CONTENT_RE = /\(([^)]{4,})\)/g;

export interface Ste83Violation {
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

export interface Ste83EngineResult {
  violations: Ste83Violation[];
}

export function runSte83Check(doc: TokenizedDocument): Ste83EngineResult {
  const violations: Ste83Violation[] = [];

  for (const sentence of doc.sentences) {
    const text      = sentence.text;
    const docStart  = sentence.offsetInDocument.start;
    const wordCount = sentence.tokens.filter((t) => t.isWord).length;

    PAREN_CONTENT_RE.lastIndex = 0;
    let m: RegExpExecArray | null;

    while ((m = PAREN_CONTENT_RE.exec(text)) !== null) {
      const innerText = m[1]!;

      // Skip cross-reference openers — these are valid parenthetical references
      if (XREF_OPENER_RE.test(innerText)) continue;

      // Flag only when the inner text contains a finite verb (= is a clause)
      if (!CLAUSE_VERB_RE.test(innerText)) continue;

      const matchStart = m.index;
      const matchEnd   = matchStart + m[0].length;

      violations.push({
        sentenceIndex:   sentence.index,
        sentenceExcerpt: sentence.text,
        tokenRaw:        m[0],
        tokenNormalized: m[0].toLowerCase(),
        positionStart:   docStart + matchStart,
        positionEnd:     docStart + matchEnd,
        ruleId:          RULE_ID,
        ruleName:        RULE_NAME,
        severity:        "minor",
        reason:          "parenthetical_clause",
        suggestion:
          `The parenthetical '${m[0]}' contains a full clause (ASD-STE100 Rule 8.3). ` +
          `Parentheses are approved only for brief references, identifiers, abbreviations, ` +
          `and singular/plural alternatives. Move the clause outside: write it as a separate ` +
          `sentence or a NOTE.`,
        wordCount,
      });
    }
  }

  return { violations };
}
