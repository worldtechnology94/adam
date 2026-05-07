/**
 * ADAM — STE-10.3 through STE-10.7 (Writing practices)
 *
 * Heuristics without full ASD-STE100 spec:
 * - STE-10.3 (Symbols): & → "and"; % → "percent"
 * - STE-10.4 (Spelling consistency): British → US spelling suggestion (e.g. colour → color)
 * - STE-10.5 (Terminology): placeholder (doc-level consistency; no sentence-level check)
 * - STE-10.6 (Writing practices): ellipsis "..." → suggest rephrase
 * - STE-10.7 (Document consistency): placeholder (doc-level)
 *
 * @see ruleplan.md — STE-10.3–10.7
 */

import type { TokenizedDocument } from "./types";

/** Violation shape compatible with analyze route (persistence). */
export interface Ste10WritingViolation {
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

export interface Ste10WritingEngineResult {
  violations: Ste10WritingViolation[];
}

const RULES: Record<string, string> = {
  "STE-10.3": "Symbols",
  "STE-10.4": "Spelling consistency",
  "STE-10.5": "Terminology",
  "STE-10.6": "Writing practices",
  "STE-10.7": "Document consistency",
};

/** British → US spelling (lowercase). Suggest US for consistency. */
const BRITISH_TO_US: Record<string, string> = {
  colour: "color",
  centre: "center",
  realise: "realize",
  organise: "organize",
  recognise: "recognize",
  behaviour: "behavior",
  favour: "favor",
  labour: "labor",
  neighbour: "neighbor",
  honour: "honor",
  armour: "armor",
  flavour: "flavor",
  metre: "meter",
  litre: "liter",
  fibre: "fiber",
};

function pushViolation(
  out: Ste10WritingViolation[],
  sentence: { index: number; text: string; offsetInDocument: { start: number; end: number }; tokens: { isWord: boolean; raw: string; normalized?: string; offsetInSentence: { start: number; end: number } }[] },
  docStart: number,
  ruleId: string,
  token: { raw: string; normalized?: string; offsetInSentence: { start: number; end: number } },
  reason: string,
  suggestion: string
): void {
  const sentenceWordCount = sentence.tokens.filter((t) => t.isWord).length;
  out.push({
    sentenceIndex: sentence.index,
    sentenceExcerpt: sentence.text,
    tokenRaw: token.raw,
    tokenNormalized: (token.normalized ?? token.raw).toLowerCase(),
    positionStart: docStart + token.offsetInSentence.start,
    positionEnd: docStart + token.offsetInSentence.end,
    ruleId,
    ruleName: RULES[ruleId] ?? ruleId,
    severity: "minor",
    reason,
    suggestion,
    wordCount: sentenceWordCount,
  });
}

/**
 * Runs STE-10.3, 10.4, 10.5, 10.6, 10.7 checks.
 * 10.5 and 10.7 are doc-level (no sentence-level violations from this engine).
 */
export function runSte10WritingCheck(doc: TokenizedDocument): Ste10WritingEngineResult {
  const violations: Ste10WritingViolation[] = [];

  for (const sentence of doc.sentences) {
    const docStart = sentence.offsetInDocument.start;

    for (const token of sentence.tokens) {
      const raw = token.raw;
      const norm = (token.normalized ?? raw).toLowerCase();

      // STE-10.3 Symbols: & and %
      if (raw.includes("&")) {
        pushViolation(
          violations,
          sentence,
          docStart,
          "STE-10.3",
          token,
          "symbol",
          "Use the word 'and' instead of the symbol '&'."
        );
      }
      if (raw.includes("%")) {
        pushViolation(
          violations,
          sentence,
          docStart,
          "STE-10.3",
          token,
          "symbol",
          "Use the word 'percent' instead of the symbol '%' (e.g. '50 percent')."
        );
      }

      // STE-10.4 Spelling: British → US
      if (token.isWord && norm && BRITISH_TO_US[norm]) {
        pushViolation(
          violations,
          sentence,
          docStart,
          "STE-10.4",
          token,
          "spelling",
          `Use consistent spelling. Prefer "${BRITISH_TO_US[norm]}" instead of "${norm}" (US spelling).`
        );
      }

      // STE-10.6 Writing practices: ellipsis
      if (raw.includes("...")) {
        pushViolation(
          violations,
          sentence,
          docStart,
          "STE-10.6",
          token,
          "ellipsis",
          "Avoid ellipsis (...) in STE. Rephrase the sentence completely."
        );
      }
    }
  }

  return { violations };
}
