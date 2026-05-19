/**
 * ADAM — STE-9.2 rule engine (Latin abbreviations — use each approved word correctly)
 *
 * ASD-STE100 Issue 9 Rule 9.2: Use each approved word correctly.
 *
 * Latin abbreviations (i.e., e.g., etc., cf., vs., viz.) are not approved
 * words in the STE Controlled Language Dictionary. Using them violates Rule 9.2
 * because the writer is substituting a non-approved Latin form for the correct
 * English expression.
 *
 * ASD-STE100 also includes this as General Recommendation 6 (GR-6): avoid
 * Latin abbreviations and use their full English equivalents instead.
 *
 *   Non-STE: "Check the oil level, e.g. with a dipstick."
 *   STE:     "Check the oil level, for example with a dipstick."
 *
 *   Non-STE: "Remove the filter, i.e. the one behind the panel."
 *   STE:     "Remove the filter, that is the one behind the panel."
 *             (Better: "Remove the filter that is behind the panel.")
 *
 *   Non-STE: "Tighten all bolts, etc."
 *   STE:     "Tighten all bolts." (list them explicitly if needed)
 *
 * @see ste92-engine.ts — STE-9.2 (other misused words)
 */

import type { TokenizedDocument } from "./types";

const RULE_ID = "STE-9.2";
const RULE_NAME = "Use each approved word correctly";

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
        suggestion: `Use the full English form (ASD-STE100 Rule 9.2: use each approved word correctly — Latin abbreviations are not approved STE words). Write "${expansion}" instead of "${token.raw}".`,
        wordCount: sentenceWordCount,
      });
    }
  }

  return { violations };
}
