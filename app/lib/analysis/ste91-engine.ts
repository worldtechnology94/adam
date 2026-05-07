/**
 * ADAM — STE-9.1 rule engine (Cross-references)
 *
 * Use a clear reference when referring to another part of the document (e.g. "See Section 4").
 * Flags vague references like "the section", "the figure", "the table" without an exact identifier.
 *
 * @see ruleplan.md — STE-9.1
 * @see data/ste-rules.json — STE-9.1 compliant: "See Section 4"; non-compliant: "Refer to the section that describes..."
 */

import type { TokenizedDocument } from "./types";

const RULE_ID = "STE-9.1";
const RULE_NAME = "Cross-references";

const REFERENCE_NOUNS = new Set(["section", "figure", "table", "chapter", "appendix"]);

/** Violation shape compatible with analyze route (persistence). */
export interface Ste91Violation {
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

export interface Ste91EngineResult {
  violations: Ste91Violation[];
}

function looksLikeNumber(token: { normalized?: string; raw: string }): boolean {
  const n = (token.normalized ?? token.raw).toLowerCase();
  if (/^\d+$/.test(n)) return true;
  if (/^\d+[a-z]?$/i.test(n)) return true;
  if (/^\d+-\d+$/.test(n)) return true;
  return false;
}

/**
 * Runs STE-9.1 check: vague reference to section/figure/table (e.g. "the section" without number).
 * Flags "the" + "section|figure|table|chapter|appendix" when not followed by an identifier/number.
 */
export function runSte91Check(doc: TokenizedDocument): Ste91EngineResult {
  const violations: Ste91Violation[] = [];

  for (const sentence of doc.sentences) {
    const docStart = sentence.offsetInDocument.start;
    const sentenceWordCount = sentence.tokens.filter((t) => t.isWord).length;
    const tokens = sentence.tokens;

    for (let i = 0; i < tokens.length - 1; i++) {
      const t0 = tokens[i];
      const t1 = tokens[i + 1];
      if (!t0.isWord || !t1.isWord || !t0.normalized || !t1.normalized) continue;

      const n0 = t0.normalized.toLowerCase();
      const n1 = t1.normalized.toLowerCase();
      if (n0 !== "the" || !REFERENCE_NOUNS.has(n1)) continue;

      const nextToken = tokens[i + 2];
      const hasIdentifier = nextToken && looksLikeNumber(nextToken);
      if (hasIdentifier) continue;

      const positionStart = docStart + t0.offsetInSentence.start;
      const positionEnd = docStart + t1.offsetInSentence.end;
      const refType = n1.charAt(0).toUpperCase() + n1.slice(1);
      violations.push({
        sentenceIndex: sentence.index,
        sentenceExcerpt: sentence.text,
        tokenRaw: t0.raw + " " + t1.raw,
        tokenNormalized: n0 + " " + n1,
        positionStart,
        positionEnd,
        ruleId: RULE_ID,
        ruleName: RULE_NAME,
        severity: "minor",
        reason: "vague_reference",
        suggestion: `Give the exact reference. For example, write "See ${refType} 3" or "Refer to ${refType} 2-1" instead of "the ${n1}".`,
        wordCount: sentenceWordCount,
      });
    }
  }

  return { violations };
}
