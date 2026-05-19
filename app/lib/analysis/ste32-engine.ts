/**
 * ADAM — STE-3.2 rule engine (No passive voice)
 *
 * Detects passive voice: "be" form (was, were, is, are, am, be, been, being)
 * followed by a past participle (e.g. -ed or irregular). One violation per construction.
 *
 * @see ruleplan.md — STE-3.2
 */

import type { TokenizedDocument } from "./types";

const RULE_ID = "STE-3.6";
const RULE_NAME = "Use the active voice";
const SUGGESTION = "Use active voice. For example, instead of 'The valve was opened', write 'Open the valve'.";

const BE_FORMS = new Set(["is", "are", "was", "were", "am", "be", "been", "being"]);

/** Common irregular past participles (lowercase). Not exhaustive; -ed forms handled by suffix. */
const IRREGULAR_PAST_PARTICIPLES = new Set([
  "been", "done", "gone", "seen", "taken", "given", "written", "driven", "ridden", "broken",
  "spoken", "chosen", "frozen", "woven", "worn", "torn", "borne", "sworn", "grown", "known",
  "blown", "flown", "thrown", "drawn", "known", "shown", "made", "built", "held", "sold",
  "told", "found", "bound", "wound", "ground", "closed", "opened", "used", "raised", "closed",
]);

function isPastParticiple(normalized: string): boolean {
  if (!normalized || !/^[a-z]+$/.test(normalized)) return false;
  if (IRREGULAR_PAST_PARTICIPLES.has(normalized)) return true;
  if (normalized.length >= 3 && normalized.endsWith("ed")) return true;
  return false;
}

/** Violation shape compatible with analyze route (persistence). */
export interface Ste32Violation {
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

export interface Ste32EngineResult {
  violations: Ste32Violation[];
}

/**
 * Runs STE-3.2 check: no passive voice (be + past participle).
 */
export function runSte32Check(doc: TokenizedDocument): Ste32EngineResult {
  const violations: Ste32Violation[] = [];

  for (const sentence of doc.sentences) {
    const docStart = sentence.offsetInDocument.start;
    const sentenceWordCount = sentence.tokens.filter((t) => t.isWord).length;
    const tokens = sentence.tokens;

    for (let i = 0; i < tokens.length - 1; i++) {
      const t0 = tokens[i];
      const t1 = tokens[i + 1];
      if (!t0.isWord || !t1.isWord || !t0.normalized || !t1.normalized) continue;

      const norm0 = t0.normalized.toLowerCase();
      const norm1 = t1.normalized.toLowerCase();
      if (!BE_FORMS.has(norm0) || !isPastParticiple(norm1)) continue;

      const positionStart = docStart + t0.offsetInSentence.start;
      const positionEnd = docStart + t1.offsetInSentence.end;

      violations.push({
        sentenceIndex: sentence.index,
        sentenceExcerpt: sentence.text,
        tokenRaw: `${t0.raw} ${t1.raw}`,
        tokenNormalized: `${norm0} ${norm1}`,
        positionStart,
        positionEnd,
        ruleId: RULE_ID,
        ruleName: RULE_NAME,
        severity: "major",
        reason: "passive_voice",
        suggestion: SUGGESTION,
        wordCount: sentenceWordCount,
      });
    }
  }

  return { violations };
}
