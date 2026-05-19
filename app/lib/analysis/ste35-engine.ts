/**
 * ADAM — STE-3.2 rule engine (Progressive tense and Past Perfect detection)
 *
 * ASD-STE100 Issue 9 Rule 3.2: Use only approved verb forms and tenses.
 * Approved forms: infinitive, imperative, simple present, simple past,
 *                 simple future, past participle used as an adjective.
 * NOT approved:   progressive tenses (be + -ing), past perfect (had + past participle).
 *
 * This engine detects:
 *
 * Pattern 1 — Present/Past progressive: is/are/was/were/am + -ing verb
 *   Non-STE: "The technician is adjusting the valve."
 *   STE:     "The technician adjusts the valve." (or simple past if action is completed)
 *
 *   Non-STE: "The pump was leaking oil."
 *   STE:     "The pump leaked oil."
 *
 * Pattern 2 — Past perfect: had + past participle
 *   Non-STE: "The operator had adjusted the linkage before the inspection."
 *   STE:     "The operator adjusted the linkage before the inspection."
 *
 * False-positive avoidance:
 *   - Common -ing words used as adjectives or nouns in technical documents
 *     (e.g. "existing", "following", "remaining") are excluded.
 *   - "had to" is a prohibited auxiliary bigram handled by ste36, not flagged here.
 *   - Progressive passive "is being adjusted" is caught as "is + being" first,
 *     since "being" ends in -ing.
 *
 * @see ste34-engine.ts — STE-3.2 (present perfect: have/has + past participle)
 * @see ste36-engine.ts — STE-3.4 (complex verb constructions, prohibited auxiliaries)
 */

import type { TokenizedDocument } from "./types";

const RULE_ID   = "STE-3.2";
const RULE_NAME = "Use only approved verb forms and tenses";

const PROGRESSIVE_BE_FORMS = new Set(["is", "are", "was", "were", "am"]);

/**
 * -ing words that are almost always adjectives or nouns in technical writing
 * and therefore do not signal a progressive verb construction.
 */
const ING_ADJECTIVE_EXCEPTIONS = new Set([
  "existing", "following", "remaining", "resulting", "corresponding",
  "ongoing", "leading", "increasing", "decreasing", "operating",
  "mounting", "rotating", "moving", "locking", "sealing", "loading",
  "supporting", "connecting", "covering", "protecting", "cooling",
  "heating", "bleeding", "draining", "filling", "housing", "opening",
  "closing", "manufacturing", "processing", "surrounding", "affecting",
  "indicating", "including", "excluding", "according", "regarding",
  "during", "concerning", "following", "preceding", "outstanding",
]);

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

export interface Ste35Violation {
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

export interface Ste35EngineResult {
  violations: Ste35Violation[];
}

export function runSte35Check(doc: TokenizedDocument): Ste35EngineResult {
  const violations: Ste35Violation[] = [];

  for (const sentence of doc.sentences) {
    const docStart  = sentence.offsetInDocument.start;
    const words     = sentence.tokens.filter((t) => t.isWord);
    const wordCount = words.length;

    if (wordCount < 2) continue;

    for (let i = 0; i < words.length - 1; i++) {
      const w    = words[i]!;
      const norm = w.normalized.toLowerCase();

      // ── Pattern 1: Progressive tense (be-form + -ing word) ──────────────
      if (PROGRESSIVE_BE_FORMS.has(norm)) {
        const next     = words[i + 1]!;
        const nextNorm = next.normalized.toLowerCase();

        if (
          nextNorm.endsWith("ing") &&
          nextNorm.length >= 5 &&
          !ING_ADJECTIVE_EXCEPTIONS.has(nextNorm)
        ) {
          const isPassiveProgressive = nextNorm === "being" && i + 2 < words.length;
          let spanRaw  = `${w.raw} ${next.raw}`;
          let spanNorm = `${norm} ${nextNorm}`;
          let endPos   = docStart + next.offsetInSentence.end;

          // "is being + past participle" = progressive passive
          if (isPassiveProgressive) {
            const next2Norm = words[i + 2]!.normalized.toLowerCase();
            if (isPastParticiple(next2Norm)) {
              spanRaw  = `${w.raw} ${next.raw} ${words[i + 2]!.raw}`;
              spanNorm = `${norm} being ${next2Norm}`;
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
            reason:          "progressive_tense",
            suggestion:
              `'${spanRaw}' is progressive tense, which is not approved by ASD-STE100 Rule 3.2. ` +
              `Use simple present or simple past tense instead ` +
              `(e.g. replace '${spanRaw}' with the simple form of the verb).`,
            wordCount,
          });
        }
        continue;
      }

      // ── Pattern 2: Past perfect (had + past participle) ─────────────────
      if (norm === "had") {
        const next     = words[i + 1]!;
        const nextNorm = next.normalized.toLowerCase();

        // "had to" is handled by ste36 as a prohibited auxiliary bigram
        if (nextNorm === "to") continue;

        if (isPastParticiple(nextNorm)) {
          violations.push({
            sentenceIndex:   sentence.index,
            sentenceExcerpt: sentence.text,
            tokenRaw:        `${w.raw} ${next.raw}`,
            tokenNormalized: `had ${nextNorm}`,
            positionStart:   docStart + w.offsetInSentence.start,
            positionEnd:     docStart + next.offsetInSentence.end,
            ruleId:          RULE_ID,
            ruleName:        RULE_NAME,
            severity:        "major",
            reason:          "past_perfect_tense",
            suggestion:
              `'${w.raw} ${next.raw}' is past perfect tense, which is not approved by ASD-STE100 Rule 3.2. ` +
              `Use simple past tense instead ` +
              `(e.g. replace '${w.raw} ${next.raw}' with just the simple past form).`,
            wordCount,
          });
        }
      }
    }
  }

  return { violations };
}
