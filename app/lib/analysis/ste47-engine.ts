/**
 * ADAM — STE-4.7 rule engine (notes: information only, not instructions)
 *
 * ASD-STE100 Issue 9 **rule 5.5**: write notes only to give information, not
 * instructions. ADAM maps **STE-4.7** to this **NOTE:** line heuristic (Issue 9
 * §4 numbering may differ in the PDF; see project `ste-rules.json`).
 *
 * Flags sentences that start with **NOTE:** (case-insensitive) when the text
 * after the colon looks like an **instruction** (verb-first per POS heuristic,
 * or cues like "you must", "do not", "shall").
 *
 * @see docs/extended-rule-coverage-plan.md — STE-4.7
 */

import type { Sentence, Token, TokenizedDocument } from "./types";
import { tokenizeText } from "./tokenize";

const RULE_ID = "STE-4.7";
const RULE_NAME = "Notes: information only";

const SUGGESTION =
  "Write notes only to give information, not instructions. Move commands to a procedural step or rephrase as descriptive information.";

const NOTE_PREFIX = /^\s*NOTE\s*:\s*/i;

/** Instruction-like wording after NOTE: (not covered by verb-first alone). */
const INSTRUCTION_CUE = /\b(you must|you shall|we must|must not|do not|don't|shall not)\b/i;

function firstWordAfterNoteColon(sentence: Sentence): { token: Token | undefined; restText: string } {
  const text = sentence.text;
  const m = text.match(NOTE_PREFIX);
  if (!m) return { token: undefined, restText: "" };

  const afterPrefixLen = m[0].length;
  const firstWord = sentence.tokens.find((t) => t.isWord && t.offsetInSentence.start >= afterPrefixLen);
  const restText = text.slice(afterPrefixLen).trim();
  return { token: firstWord, restText };
}

export interface Ste47Violation {
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

export interface Ste47EngineResult {
  violations: Ste47Violation[];
}

export function runSte47Check(doc: TokenizedDocument): Ste47EngineResult {
  const violations: Ste47Violation[] = [];

  for (const sentence of doc.sentences) {
    const trimmed = sentence.text.trim();
    if (!trimmed) continue;

    if (!NOTE_PREFIX.test(trimmed)) continue;

    const { token: firstAfter, restText } = firstWordAfterNoteColon(sentence);
    if (!restText) continue;

    let looksInstructional = false;

    if (INSTRUCTION_CUE.test(restText)) {
      looksInstructional = true;
    } else if (firstAfter) {
      const pos = (firstAfter.posHeuristic ?? "").toLowerCase();
      if (pos === "v") looksInstructional = true;
      else {
        /** Re-tokenize the substring so POS applies to the first word after NOTE: */
        const mini = tokenizeText(restText, { applyPosHeuristic: true });
        const s0 = mini.sentences[0];
        if (s0) {
          const fw = s0.tokens.find((t) => t.isWord);
          const p = (fw?.posHeuristic ?? "").toLowerCase();
          if (p === "v") looksInstructional = true;
        }
      }
    }

    if (!looksInstructional) continue;

    const words = sentence.tokens.filter((t) => t.isWord);
    const start = sentence.offsetInDocument.start;
    const end = sentence.offsetInDocument.end;

    violations.push({
      sentenceIndex: sentence.index,
      sentenceExcerpt: sentence.text,
      tokenRaw: firstAfter?.raw ?? "",
      tokenNormalized: firstAfter?.normalized ?? "",
      positionStart: start,
      positionEnd: end,
      ruleId: RULE_ID,
      ruleName: RULE_NAME,
      severity: "minor",
      reason: "note_contains_instruction",
      suggestion: SUGGESTION,
      wordCount: words.length,
    });
  }

  return { violations };
}
