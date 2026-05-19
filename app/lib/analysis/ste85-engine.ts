/**
 * ADAM — STE-8.5 rule engine (Parenthetical word count)
 *
 * ASD-STE100 Issue 9 Rule 8.5: Text in parentheses counts as one word in
 * that sentence.
 *
 * This rule defines how parenthetical text is counted for the purpose of
 * the sentence-length limits (STE-5.1 max 20 words procedural, STE-6.3 max
 * 25 words descriptive). Regardless of how many words are inside the
 * parentheses, the entire parenthetical expression counts as ONE word.
 *
 * Violation: A writer places a long nominal phrase (4+ words, no finite verb)
 * inside parentheses, effectively hiding text from the word count. This makes
 * the sentence appear shorter than it reads, defeating the word-count limits.
 * Long parenthetical phrases should be moved outside the parentheses, placed
 * in a NOTE, or written as a separate sentence.
 *
 *   Non-STE: "Install the seal (the inner diameter bearing isolation seal)."
 *             — "(the inner diameter bearing isolation seal)" = 5 words hidden
 *   STE:     "Install the inner diameter bearing isolation seal."
 *             — name it directly, no parentheses needed
 *
 *   Non-STE: "Check the pump (the primary hydraulic supply pump) for leaks."
 *   STE:     "Check the primary hydraulic supply pump for leaks."
 *
 * Detection: parenthetical content that contains 4+ words (≥ 3 spaces) and
 * does NOT contain a finite verb (clausal parentheses are handled by ste83).
 * Brief references "(Section 4)", abbreviations "(ECU)", and single/plural
 * forms "bolt(s)" are excluded.
 *
 * @see ste83-engine.ts — STE-8.3 (parenthetical clause with finite verb)
 * @see ste41-engine.ts — STE-5.1 (max 20 words per procedural sentence)
 */

import type { TokenizedDocument } from "./types";

const RULE_ID   = "STE-8.5";
const RULE_NAME = "Do not hide words in long parenthetical phrases";

/**
 * Words that indicate a cross-reference or abbreviation — these are valid
 * short parenthetical uses that should never be flagged.
 */
const XREF_OPENER_RE  = /^\s*(see|refer\s+to|go\s+to|section|figure|table|chapter|appendix|step|p\/n|part\s+no)/i;

/** Finite-verb markers — if present the violation belongs to ste83, not ste85. */
const FINITE_VERB_RE =
  /\b(is|are|was|were|will|shall|can|may|must|does|did|have|has|had|been|being|exceeds|prevents|causes|requires|means|shows|contains|includes|operates|depends|applies)\b/i;

/** Matches parenthetical content with at least 4 characters inside. */
const PAREN_CONTENT_RE = /\(([^)]{8,})\)/g;

/** `word(s)` pattern — valid singular/plural notation per STE-8.3. */
const WORD_S_RE = /^\w+\(s\)$/i;

function countSpaces(s: string): number {
  let n = 0;
  for (const ch of s) { if (ch === " ") n++; }
  return n;
}

export interface Ste85Violation {
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

export interface Ste85EngineResult {
  violations: Ste85Violation[];
}

export function runSte85Check(doc: TokenizedDocument): Ste85EngineResult {
  const violations: Ste85Violation[] = [];

  for (const sentence of doc.sentences) {
    const text      = sentence.text;
    const docStart  = sentence.offsetInDocument.start;
    const wordCount = sentence.tokens.filter((t) => t.isWord).length;

    PAREN_CONTENT_RE.lastIndex = 0;
    let m: RegExpExecArray | null;

    while ((m = PAREN_CONTENT_RE.exec(text)) !== null) {
      const fullMatch = m[0]!;
      const innerText = m[1]!.trim();

      // Valid: word(s) notation
      if (WORD_S_RE.test(fullMatch.replace(/\s/g, ""))) continue;

      // Valid: cross-reference or short abbreviation opener
      if (XREF_OPENER_RE.test(innerText)) continue;

      // Clausal parenthetical — handled by ste83, skip here
      if (FINITE_VERB_RE.test(innerText)) continue;

      // Flag only when 4+ words inside (≥ 3 spaces)
      if (countSpaces(innerText) < 3) continue;

      const matchStart = m.index;
      const matchEnd   = matchStart + fullMatch.length;

      violations.push({
        sentenceIndex:   sentence.index,
        sentenceExcerpt: sentence.text,
        tokenRaw:        fullMatch,
        tokenNormalized: fullMatch.toLowerCase(),
        positionStart:   docStart + matchStart,
        positionEnd:     docStart + matchEnd,
        ruleId:          RULE_ID,
        ruleName:        RULE_NAME,
        severity:        "minor",
        reason:          "overlong_parenthetical_phrase",
        suggestion:
          `The parenthetical '${fullMatch}' contains 4 or more words ` +
          `(ASD-STE100 Rule 8.5: text in parentheses counts as ONE word, so this text ` +
          `is hidden from the word count). Move the information outside: write it as ` +
          `part of the main sentence or in a separate NOTE.`,
        wordCount,
      });
    }
  }

  return { violations };
}
