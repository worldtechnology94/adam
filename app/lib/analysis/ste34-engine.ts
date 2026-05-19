/**
 * ADAM — STE-3.2 rule engine (Present Perfect detection)
 *
 * ASD-STE100 Issue 9 Rule 3.2: Use only approved verb forms and tenses.
 * Approved forms: infinitive, imperative, simple present, simple past,
 *                 simple future, past participle used as an adjective.
 * NOT approved:   present perfect (have/has + past participle),
 *                 past perfect, progressive tenses.
 *
 * This engine detects PRESENT PERFECT constructions: have/has + past participle.
 *
 *   Non-STE: "The operator has adjusted the linkage."
 *   STE:     "The operator adjusted the linkage."
 *
 *   Non-STE: "The technician has already installed the filter."
 *   STE:     "The technician already installed the filter."
 *
 * Also detects present-perfect passive: have/has + been + past participle.
 *   Non-STE: "The valve has been replaced."
 *   STE:     "Replace the valve." (imperative) or "The valve was replaced." (simple past passive)
 *
 * False-positive avoidance:
 *   - "have/has" followed by an article (a/an/the) → main verb ("have a look"), skip
 *   - "have/has" followed by a pronoun or "to" → main verb or "have to" (ste36), skip
 *
 * @see ste35-engine.ts — STE-3.2 (progressive and past perfect)
 * @see ste36-engine.ts — STE-3.4 (complex verb constructions)
 */

import type { TokenizedDocument } from "./types";

const RULE_ID   = "STE-3.2";
const RULE_NAME = "Use only approved verb forms and tenses";

const HAVE_HAS = new Set(["have", "has"]);

/** Words that, when following "have/has", indicate it is a main verb (not auxiliary). */
const MAIN_VERB_SIGNALS = new Set([
  "a", "an", "the",
  "i", "you", "he", "she", "it", "we", "they", "me", "him", "her", "us", "them",
  "to",   // "have to" = prohibited auxiliary, handled by ste36
  "no",   // "have no idea" etc.
  "not",  // "have not" = present perfect negative, but catch via next word
  "your", "my", "our", "their", "its", "his", "her",
  "this", "that", "these", "those",
  "what", "some", "any", "enough", "more", "less",
]);

/**
 * Irregular past participles that do not end in -ed.
 * Deliberately limited to unambiguous forms in technical writing.
 */
const IRREGULAR_PAST_PARTICIPLES = new Set([
  "been", "done", "gone", "known", "seen", "taken", "given", "made",
  "come", "become", "begun", "broken", "brought", "built", "bought",
  "caught", "chosen", "driven", "fallen", "felt", "found", "forgotten",
  "grown", "held", "kept", "left", "lost", "met", "paid", "proven",
  "put", "run", "said", "sent", "shown", "shut", "spoken", "stolen",
  "stood", "told", "thought", "thrown", "understood", "worn", "written",
  "blown", "drawn", "eaten", "flown", "frozen", "hidden", "ridden",
  "risen", "shaken", "sunk", "swum", "sworn", "torn", "woken",
]);

function isPastParticiple(norm: string): boolean {
  if (norm.length >= 4 && norm.endsWith("ed")) return true;
  return IRREGULAR_PAST_PARTICIPLES.has(norm);
}

export interface Ste34Violation {
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

export interface Ste34EngineResult {
  violations: Ste34Violation[];
}

export function runSte34Check(doc: TokenizedDocument): Ste34EngineResult {
  const violations: Ste34Violation[] = [];

  for (const sentence of doc.sentences) {
    const docStart  = sentence.offsetInDocument.start;
    const words     = sentence.tokens.filter((t) => t.isWord);
    const wordCount = words.length;

    if (wordCount < 2) continue;

    for (let i = 0; i < words.length - 1; i++) {
      const w    = words[i]!;
      const norm = w.normalized.toLowerCase();

      if (!HAVE_HAS.has(norm)) continue;

      const next1     = words[i + 1]!;
      const next1Norm = next1.normalized.toLowerCase();

      // "have/has" followed by a main-verb signal word → not an auxiliary
      if (MAIN_VERB_SIGNALS.has(next1Norm)) continue;

      // "have/has" + "not" + past participle → present perfect negative ("has not adjusted")
      if (next1Norm === "not" && i + 2 < words.length) {
        const next2Norm = words[i + 2]!.normalized.toLowerCase();
        if (isPastParticiple(next2Norm)) {
          violations.push({
            sentenceIndex:   sentence.index,
            sentenceExcerpt: sentence.text,
            tokenRaw:        `${w.raw} ${next1.raw} ${words[i + 2]!.raw}`,
            tokenNormalized: `${norm} not ${next2Norm}`,
            positionStart:   docStart + w.offsetInSentence.start,
            positionEnd:     docStart + words[i + 2]!.offsetInSentence.end,
            ruleId:          RULE_ID,
            ruleName:        RULE_NAME,
            severity:        "major",
            reason:          "present_perfect_tense",
            suggestion:
              `'${w.raw} ${next1.raw} ${words[i + 2]!.raw}' is present perfect tense, which is not ` +
              `approved by ASD-STE100 Rule 3.2. Use simple past tense instead ` +
              `(e.g. 'did not adjust', 'was not adjusted').`,
            wordCount,
          });
        }
        continue;
      }

      // Pattern A: have/has + past participle (present perfect active)
      //   "has adjusted", "have removed", "has been"
      if (isPastParticiple(next1Norm)) {
        let spanRaw  = `${w.raw} ${next1.raw}`;
        let spanNorm = `${norm} ${next1Norm}`;
        let endPos   = docStart + next1.offsetInSentence.end;

        // Special case: "have/has been + past participle" (present perfect passive)
        if (next1Norm === "been" && i + 2 < words.length) {
          const next2Norm = words[i + 2]!.normalized.toLowerCase();
          if (isPastParticiple(next2Norm)) {
            spanRaw  = `${w.raw} ${next1.raw} ${words[i + 2]!.raw}`;
            spanNorm = `${norm} been ${next2Norm}`;
            endPos   = docStart + words[i + 2]!.offsetInSentence.end;
          }
        }

        violations.push({
          sentenceIndex:   sentence.index,
          sentenceExcerpt: sentence.text,
          tokenRaw:        spanRaw,
          tokenNormalized: spanNorm,
          positionStart:   docStart + w.offsetInSentence.start,
          positionEnd:     endPos,
          ruleId:          RULE_ID,
          ruleName:        RULE_NAME,
          severity:        "major",
          reason:          "present_perfect_tense",
          suggestion:
            `'${spanRaw}' is present perfect tense, which is not approved by ASD-STE100 Rule 3.2. ` +
            `Use simple past tense instead (e.g. replace '${spanRaw}' with the simple past form).`,
          wordCount,
        });
        continue;
      }

      // Pattern B: have/has + adverb(-ly) + past participle
      //   "has already adjusted", "have never seen"
      if (
        i + 2 < words.length &&
        (next1Norm.endsWith("ly") || next1Norm === "already" || next1Norm === "never" ||
         next1Norm === "just" || next1Norm === "recently" || next1Norm === "finally" ||
         next1Norm === "always")
      ) {
        const next2Norm = words[i + 2]!.normalized.toLowerCase();
        if (isPastParticiple(next2Norm)) {
          violations.push({
            sentenceIndex:   sentence.index,
            sentenceExcerpt: sentence.text,
            tokenRaw:        `${w.raw} ${next1.raw} ${words[i + 2]!.raw}`,
            tokenNormalized: `${norm} ${next1Norm} ${next2Norm}`,
            positionStart:   docStart + w.offsetInSentence.start,
            positionEnd:     docStart + words[i + 2]!.offsetInSentence.end,
            ruleId:          RULE_ID,
            ruleName:        RULE_NAME,
            severity:        "major",
            reason:          "present_perfect_tense",
            suggestion:
              `'${w.raw} ${next1.raw} ${words[i + 2]!.raw}' is present perfect tense, which is not ` +
              `approved by ASD-STE100 Rule 3.2. Use simple past tense instead.`,
            wordCount,
          });
        }
      }
    }
  }

  return { violations };
}
