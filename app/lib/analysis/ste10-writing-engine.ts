/**
 * ADAM — Writing practices engine (symbols, spelling, ellipsis)
 *
 * Checks three distinct ASD-STE100 Issue 9 rules:
 *
 * STE-4.2 — Do not omit words or use contractions
 *   Using the symbol '&' omits the word "and"; using '%' omits the word
 *   "percent". Both are word omissions that violate Rule 4.2.
 *   Non-STE: "Check the pump & valve."  → STE: "Check the pump and valve."
 *   Non-STE: "Set pressure to 80%."     → STE: "Set pressure to 80 percent."
 *
 * STE-1.14 — Use American English spelling
 *   British spellings (colour, centre, realise, etc.) must be replaced with
 *   their US equivalents (color, center, realize, etc.).
 *
 * STE-8.1 — Use standard punctuation; do not use semicolons
 *   The ellipsis (...) is non-standard punctuation in STE. It implies omitted
 *   text or trailing thought — both of which violate the requirement for
 *   complete, unambiguous sentences. Rephrase to a complete sentence.
 *   Non-STE: "Remove the panel..."  → STE: "Remove the panel."
 *
 * @see ste42-engine.ts  — STE-4.2 (contractions and word omission)
 * @see ste81-engine.ts  — STE-8.1 (semicolon prohibition)
 * @see ste87-engine.ts  — STE-8.1 (em dash prohibition)
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
  "STE-4.2":  "Do not omit words or use contractions",
  "STE-1.14": "Use American English spelling",
  "STE-8.1":  "Use standard punctuation; do not use semicolons",
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
 * Runs STE-4.2 (symbols), STE-1.14 (spelling), and STE-8.1 (ellipsis) checks.
 */
export function runSte10WritingCheck(doc: TokenizedDocument): Ste10WritingEngineResult {
  const violations: Ste10WritingViolation[] = [];

  for (const sentence of doc.sentences) {
    const docStart = sentence.offsetInDocument.start;

    for (const token of sentence.tokens) {
      const raw = token.raw;
      const norm = (token.normalized ?? raw).toLowerCase();

      // STE-4.2: symbol '&' omits the word "and"; '%' omits the word "percent"
      if (raw.includes("&")) {
        pushViolation(
          violations,
          sentence,
          docStart,
          "STE-4.2",
          token,
          "symbol_omits_word",
          "Use the word 'and' instead of the symbol '&' " +
          "(ASD-STE100 Rule 4.2: do not omit words — '&' omits the word 'and')."
        );
      }
      if (raw.includes("%")) {
        pushViolation(
          violations,
          sentence,
          docStart,
          "STE-4.2",
          token,
          "symbol_omits_word",
          "Use the word 'percent' instead of the symbol '%' " +
          "(ASD-STE100 Rule 4.2: do not omit words — '%' omits the word 'percent'). " +
          "Write '50 percent', not '50%'."
        );
      }

      // STE-1.14 Spelling: British → US
      if (token.isWord && norm && BRITISH_TO_US[norm]) {
        pushViolation(
          violations,
          sentence,
          docStart,
          "STE-1.14",
          token,
          "spelling",
          `Use consistent spelling. Prefer "${BRITISH_TO_US[norm]}" instead of "${norm}" (US spelling).`
        );
      }

      // STE-8.1: ellipsis is non-standard punctuation in STE
      if (raw.includes("...")) {
        pushViolation(
          violations,
          sentence,
          docStart,
          "STE-8.1",
          token,
          "ellipsis",
          "Avoid the ellipsis (...) in STE writing " +
          "(ASD-STE100 Rule 8.1: use only standard punctuation — the ellipsis implies " +
          "omitted text or an incomplete thought, which STE does not permit). " +
          "Rephrase as a complete sentence."
        );
      }
    }
  }

  return { violations };
}
