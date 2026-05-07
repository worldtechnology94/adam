/**
 * ADAM — STE-9.2 rule engine (Reference format)
 *
 * Reference labels (Section, Figure, Table, Chapter, Appendix) should be
 * capitalized when used with a number (e.g. "Section 4", not "section 4").
 *
 * @see ruleplan.md — STE-9.2
 */

import type { TokenizedDocument } from "./types";

const RULE_ID = "STE-9.2";
const RULE_NAME = "Reference format";

const REFERENCE_LABELS = new Set(["section", "figure", "table", "chapter", "appendix"]);

function looksLikeNumber(token: { normalized?: string; raw: string }): boolean {
  const n = (token.normalized ?? token.raw).trim();
  if (!n) return false;
  return /^\d+$/.test(n) || /^\d+[a-z]?$/i.test(n) || /^\d+-\d+$/.test(n);
}

/** Violation shape compatible with analyze route (persistence). */
export interface Ste92Violation {
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

export interface Ste92EngineResult {
  violations: Ste92Violation[];
}

/**
 * Runs STE-9.2 check: reference labels (section, figure, table, etc.) with a number
 * should be capitalized (e.g. "Section 4" not "section 4").
 */
export function runSte92Check(doc: TokenizedDocument): Ste92EngineResult {
  const violations: Ste92Violation[] = [];

  for (const sentence of doc.sentences) {
    const docStart = sentence.offsetInDocument.start;
    const sentenceWordCount = sentence.tokens.filter((t) => t.isWord).length;
    const tokens = sentence.tokens;

    for (let i = 0; i < tokens.length - 1; i++) {
      const t0 = tokens[i];
      const t1 = tokens[i + 1];
      if (!t0.isWord || !t0.normalized) continue;

      const norm0 = t0.normalized.toLowerCase();
      if (!REFERENCE_LABELS.has(norm0)) continue;
      if (!looksLikeNumber(t1)) continue;

      const firstChar = t0.raw.trim().charAt(0);
      if (firstChar === firstChar.toUpperCase() && firstChar !== firstChar.toLowerCase()) continue;

      const positionStart = docStart + t0.offsetInSentence.start;
      const positionEnd = docStart + t0.offsetInSentence.end;
      const capitalized = norm0.charAt(0).toUpperCase() + norm0.slice(1);
      violations.push({
        sentenceIndex: sentence.index,
        sentenceExcerpt: sentence.text,
        tokenRaw: t0.raw,
        tokenNormalized: norm0,
        positionStart,
        positionEnd,
        ruleId: RULE_ID,
        ruleName: RULE_NAME,
        severity: "minor",
        reason: "reference_format",
        suggestion: `Capitalize the reference label: write "${capitalized} ${t1.raw.trim()}" instead of "${t0.raw} ${t1.raw.trim()}".`,
        wordCount: sentenceWordCount,
      });
    }
  }

  return { violations };
}
