/**
 * ADAM — STE-8.2 rule engine (Commas — serial comma)
 *
 * Use a serial (Oxford) comma before "and" or "or" in lists of three or more.
 * Detects pattern: comma, then one or more words, then "and"/"or" with no comma
 * before it (e.g. "A, B and C" → should be "A, B, and C").
 *
 * @see ruleplan.md — STE-8.2
 */

import type { TokenizedDocument } from "./types";

const RULE_ID = "STE-8.2";
const RULE_NAME = "Commas";
const SUGGESTION = "Use a serial comma before 'and' or 'or' in lists of three or more items (e.g. 'A, B, and C').";

const LIST_CONJUNCTIONS = new Set(["and", "or"]);

/** Violation shape compatible with analyze route (persistence). */
export interface Ste82Violation {
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

export interface Ste82EngineResult {
  violations: Ste82Violation[];
}

function tokenContainsComma(t: { raw: string }): boolean {
  return t.raw.includes(",");
}

/**
 * Runs STE-8.2 check: serial comma in lists.
 * Flags "word, word and word" or "word, word or word" (missing comma before and/or).
 * Tokenizer attaches comma to preceding word (e.g. "red,"), so we look for tokens containing ",".
 */
export function runSte82Check(doc: TokenizedDocument): Ste82EngineResult {
  const violations: Ste82Violation[] = [];

  for (const sentence of doc.sentences) {
    const docStart = sentence.offsetInDocument.start;
    const sentenceWordCount = sentence.tokens.filter((t) => t.isWord).length;
    const tokens = sentence.tokens;

    for (let i = 0; i < tokens.length; i++) {
      if (!tokenContainsComma(tokens[i])) continue;

      let j = i + 1;
      let sawComma = false;
      let andOrIndex = -1;

      while (j < tokens.length) {
        const next = tokens[j];
        if (tokenContainsComma(next)) {
          sawComma = true;
          break;
        }
        if (next.isWord && next.normalized && LIST_CONJUNCTIONS.has(next.normalized.toLowerCase())) {
          andOrIndex = j;
          break;
        }
        j++;
      }

      if (andOrIndex !== -1 && !sawComma && andOrIndex > i + 1) {
        const commaToken = tokens[i];
        const conj = tokens[andOrIndex];
        const positionStart = docStart + commaToken.offsetInSentence.start;
        const positionEnd = docStart + conj.offsetInSentence.end;
        violations.push({
          sentenceIndex: sentence.index,
          sentenceExcerpt: sentence.text,
          tokenRaw: commaToken.raw + " ... " + conj.raw,
          tokenNormalized: (commaToken.normalized ?? "") + " " + (conj.normalized ?? ""),
          positionStart,
          positionEnd,
          ruleId: RULE_ID,
          ruleName: RULE_NAME,
          severity: "minor",
          reason: "serial_comma",
          suggestion: SUGGESTION,
          wordCount: sentenceWordCount,
        });
      }
    }
  }

  return { violations };
}
