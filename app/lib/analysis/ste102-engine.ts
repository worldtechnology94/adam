/**
 * ADAM — STE-10.2 rule engine (Abbreviations)
 *
 * STE prefers full forms over Latin and other abbreviations.
 * Flags e.g., i.e., etc., and similar; suggests the full form.
 *
 * @see ruleplan.md — STE-10.2
 */

import type { TokenizedDocument } from "./types";

const RULE_ID = "STE-10.2";
const RULE_NAME = "Abbreviations";

/** Latin/common abbreviations (lowercase, with or without period) → full form. */
const ABBREVIATIONS: Record<string, string> = {
  "e.g.": "for example",
  "eg.": "for example",
  eg: "for example",
  "e.g": "for example",
  "i.e.": "that is",
  "ie.": "that is",
  ie: "that is",
  "i.e": "that is",
  "etc.": "and so on",
  etc: "and so on",
  "cf.": "compare",
  cf: "compare",
  "vs.": "versus",
  vs: "versus",
  "viz.": "namely",
  viz: "namely",
};

/** Violation shape compatible with analyze route (persistence). */
export interface Ste102Violation {
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

export interface Ste102EngineResult {
  violations: Ste102Violation[];
}

function normalizeForMatch(raw: string): string {
  return raw.trim().toLowerCase();
}

/**
 * Runs STE-10.2 check: do not use Latin/common abbreviations; use full form.
 */
export function runSte102Check(doc: TokenizedDocument): Ste102EngineResult {
  const violations: Ste102Violation[] = [];

  for (const sentence of doc.sentences) {
    const docStart = sentence.offsetInDocument.start;
    const sentenceWordCount = sentence.tokens.filter((t) => t.isWord).length;

    for (const token of sentence.tokens) {
      const rawNorm = normalizeForMatch(token.raw);
      const tokenNorm = (token.normalized ?? token.raw).toLowerCase().replace(/\.$/, "");
      const expansion = ABBREVIATIONS[rawNorm] ?? ABBREVIATIONS[rawNorm.replace(/\.$/, "")] ?? ABBREVIATIONS[tokenNorm] ?? ABBREVIATIONS[tokenNorm + "."];
      if (!expansion) continue;

      const positionStart = docStart + token.offsetInSentence.start;
      const positionEnd = docStart + token.offsetInSentence.end;
      violations.push({
        sentenceIndex: sentence.index,
        sentenceExcerpt: sentence.text,
        tokenRaw: token.raw,
        tokenNormalized: tokenNorm,
        positionStart,
        positionEnd,
        ruleId: RULE_ID,
        ruleName: RULE_NAME,
        severity: "minor",
        reason: "abbreviation",
        suggestion: `Use the full form in STE. Write "${expansion}" instead of "${token.raw}".`,
        wordCount: sentenceWordCount,
      });
    }
  }

  return { violations };
}
