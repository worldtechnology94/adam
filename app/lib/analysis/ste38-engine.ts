/**
 * ADAM — STE-3.8 rule engine (Verb voice — get-passive)
 *
 * ASD-STE100 Issue 9: Use the active voice.
 *
 * STE-3.2 already detects the standard be-passive (be + past participle).
 * This engine covers the one passive construction that STE-3.2 cannot catch:
 *
 *   GET-PASSIVE — get/gets/got/gotten + past participle
 *     "The bolt gets tightened by the technician."   → non-STE
 *     "The filter got replaced during the last service." → non-STE
 *
 * Exclusions:
 *   - "get" (or its forms) as the first word token of a sentence → imperative
 *     ("Get the tool." or "Get started.") — not a passive construction
 *   - "gotten" when used as part of a known idiom (kept minimal to avoid complexity)
 *
 * isPastParticiple is defined locally to avoid modifying ste32-engine.ts.
 * The logic is identical to the helper in that file.
 *
 * @see remaining-ste-rules.md — STE-3.8
 * @see ste32-engine.ts — STE-3.2 (be-passive, already implemented)
 */

import type { TokenizedDocument } from "./types";

const RULE_ID   = "STE-3.6";
const RULE_NAME = "Use the active voice";

const SUGGESTION =
  "Use the active voice. Rewrite the sentence so the subject performs the action. " +
  "For example, instead of 'The bolt gets tightened', write 'Tighten the bolt'.";

const GET_FORMS = new Set(["get", "gets", "got", "gotten", "getting"]);

/** Common irregular past participles (identical list to ste32-engine.ts). */
const IRREGULAR_PAST_PARTICIPLES = new Set([
  "been",    "done",    "gone",    "seen",    "taken",   "given",
  "written", "driven",  "ridden",  "broken",  "spoken",  "chosen",
  "frozen",  "woven",   "worn",    "torn",    "borne",   "sworn",
  "grown",   "known",   "blown",   "flown",   "thrown",  "drawn",
  "shown",   "made",    "built",   "held",    "sold",    "told",
  "found",   "bound",   "wound",   "ground",  "closed",  "opened",
  "used",    "raised",  "led",     "kept",    "sent",    "left",
  "felt",    "meant",   "lost",    "put",     "set",     "cut",
]);

function isPastParticiple(normalized: string): boolean {
  if (!normalized || !/^[a-z]+$/.test(normalized)) return false;
  if (IRREGULAR_PAST_PARTICIPLES.has(normalized)) return true;
  if (normalized.length >= 3 && normalized.endsWith("ed")) return true;
  return false;
}

export interface Ste38Violation {
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

export interface Ste38EngineResult {
  violations: Ste38Violation[];
}

export function runSte38Check(doc: TokenizedDocument): Ste38EngineResult {
  const violations: Ste38Violation[] = [];

  for (const sentence of doc.sentences) {
    const docStart  = sentence.offsetInDocument.start;
    const words     = sentence.tokens.filter((t) => t.isWord);
    const wordCount = words.length;

    for (let i = 0; i < words.length - 1; i++) {
      const w0   = words[i]!;
      const w1   = words[i + 1]!;
      const norm0 = w0.normalized.toLowerCase();
      const norm1 = w1.normalized.toLowerCase();

      if (!GET_FORMS.has(norm0)) continue;
      if (!isPastParticiple(norm1)) continue;

      // EXCLUSION: "get" as the first word token of the sentence → imperative, not passive
      if (i === 0) continue;

      violations.push({
        sentenceIndex:   sentence.index,
        sentenceExcerpt: sentence.text,
        tokenRaw:        `${w0.raw} ${w1.raw}`,
        tokenNormalized: `${norm0} ${norm1}`,
        positionStart:   docStart + w0.offsetInSentence.start,
        positionEnd:     docStart + w1.offsetInSentence.end,
        ruleId:          RULE_ID,
        ruleName:        RULE_NAME,
        severity:        "major",
        reason:          "get_passive",
        suggestion:      SUGGESTION,
        wordCount,
      });
    }
  }

  return { violations };
}
