/**
 * ADAM — STE-3.4 rule engine (Complex verb constructions)
 *
 * ASD-STE100 Issue 9 Rule 3.4: Do not use auxiliary verbs to make complex
 * verb constructions.
 *
 * Three violation patterns:
 *
 * Pattern 1 — Prohibited modal auxiliaries (ambiguous or conditional):
 *   could, would, should, might, ought (to), need to, have to, has to,
 *   had to, used to, ought to.
 *   These introduce ambiguity or conditional tone not approved by STE.
 *   Approved modals are: can, may, must, shall, will.
 *
 * Pattern 2 — Modal passive construction: [modal] + be + past participle
 *   Non-STE: "The volume control can be adjusted."
 *   STE:     "You can adjust the volume control."
 *   Non-STE: "The temperature must be adjusted."
 *   STE:     "Adjust the temperature."
 *   Applies to ALL modals (approved and prohibited), because passive voice
 *   obscures who performs the action.
 *
 * Pattern 3 — "is/are/was/were to be" construction: be-form + to + be + verb
 *   Non-STE: "The seat is to be installed before you install the cushion."
 *   STE:     "Before you install the cushion, install the seat."
 *   This construction delays the action and removes the actor.
 *
 * @see ste34-engine.ts — STE-3.2 (present perfect: have/has + past participle)
 * @see ste35-engine.ts — STE-3.2 (progressive and past perfect tenses)
 */

import type { TokenizedDocument } from "./types";

const RULE_ID   = "STE-3.4";
const RULE_NAME = "Do not use auxiliary verbs for complex verb constructions";

// ── Pattern 1: Prohibited single-word auxiliaries ─────────────────────────────

const PROHIBITED_SINGLE: Record<string, string> = {
  could:  "Replace 'could' with 'can' (ability) or 'may' (possibility).",
  would:  "Replace 'would' with 'will', or rephrase as a direct instruction.",
  should: "Replace 'should' with 'must' (obligation) or remove it (advice).",
  might:  "Replace 'might' with 'may'.",
  ought:  "Replace 'ought' with 'must'.",
};

/**
 * Two-token prohibited auxiliaries: first word → suggestion.
 * All have "to" as the second token.
 */
const PROHIBITED_BIGRAM_FIRST: Record<string, string> = {
  need:  "Replace 'need to' with 'must'.",
  have:  "Replace 'have to' with 'must'.",
  has:   "Replace 'has to' with 'must'.",
  had:   "Replace 'had to' with 'must', or rephrase using simple past tense.",
  used:  "Do not use 'used to'. Describe the current state using simple present tense.",
  ought: "Replace 'ought to' with 'must'.",
};

// ── Pattern 2: Modal passive (modal + be + past participle) ───────────────────

const ALL_MODALS = new Set(["can", "may", "must", "shall", "will",
                            "could", "would", "should", "might"]);
const BE_LEMMAS  = new Set(["be", "been"]);

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

// ── Pattern 3: "is/are/was/were to be" construction ───────────────────────────

const FINITE_BE_FORMS = new Set(["is", "are", "was", "were"]);

// ─────────────────────────────────────────────────────────────────────────────

export interface Ste36Violation {
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

export interface Ste36EngineResult {
  violations: Ste36Violation[];
}

export function runSte36Check(doc: TokenizedDocument): Ste36EngineResult {
  const violations: Ste36Violation[] = [];

  for (const sentence of doc.sentences) {
    const docStart  = sentence.offsetInDocument.start;
    const words     = sentence.tokens.filter((t) => t.isWord);
    const wordCount = words.length;

    for (let i = 0; i < words.length; i++) {
      const w    = words[i]!;
      const norm = w.normalized.toLowerCase();

      // ── Pattern 1a: Prohibited bigram (e.g. "need to", "have to") ─────────
      if (i + 1 < words.length) {
        const next     = words[i + 1]!;
        const nextNorm = next.normalized.toLowerCase();

        if (nextNorm === "to" && PROHIBITED_BIGRAM_FIRST[norm] !== undefined) {
          violations.push({
            sentenceIndex:   sentence.index,
            sentenceExcerpt: sentence.text,
            tokenRaw:        `${w.raw} ${next.raw}`,
            tokenNormalized: `${norm} to`,
            positionStart:   docStart + w.offsetInSentence.start,
            positionEnd:     docStart + next.offsetInSentence.end,
            ruleId:          RULE_ID,
            ruleName:        RULE_NAME,
            severity:        "major",
            reason:          "prohibited_auxiliary",
            suggestion:      PROHIBITED_BIGRAM_FIRST[norm]!,
            wordCount,
          });
          i++; // consume the "to" token
          continue;
        }
      }

      // ── Pattern 1b: Prohibited single-token auxiliary ─────────────────────
      if (PROHIBITED_SINGLE[norm] !== undefined) {
        violations.push({
          sentenceIndex:   sentence.index,
          sentenceExcerpt: sentence.text,
          tokenRaw:        w.raw,
          tokenNormalized: norm,
          positionStart:   docStart + w.offsetInSentence.start,
          positionEnd:     docStart + w.offsetInSentence.end,
          ruleId:          RULE_ID,
          ruleName:        RULE_NAME,
          severity:        "major",
          reason:          "prohibited_auxiliary",
          suggestion:      PROHIBITED_SINGLE[norm]!,
          wordCount,
        });
        continue;
      }

      // ── Pattern 2: Modal + be + past participle (modal passive) ───────────
      // e.g. "can be adjusted", "must be installed", "will be replaced"
      if (ALL_MODALS.has(norm) && i + 2 < words.length) {
        const w1     = words[i + 1]!;
        const w2     = words[i + 2]!;
        const w1Norm = w1.normalized.toLowerCase();
        const w2Norm = w2.normalized.toLowerCase();

        if (BE_LEMMAS.has(w1Norm) && isPastParticiple(w2Norm)) {
          violations.push({
            sentenceIndex:   sentence.index,
            sentenceExcerpt: sentence.text,
            tokenRaw:        `${w.raw} ${w1.raw} ${w2.raw}`,
            tokenNormalized: `${norm} ${w1Norm} ${w2Norm}`,
            positionStart:   docStart + w.offsetInSentence.start,
            positionEnd:     docStart + w2.offsetInSentence.end,
            ruleId:          RULE_ID,
            ruleName:        RULE_NAME,
            severity:        "major",
            reason:          "modal_passive_construction",
            suggestion:
              `'${w.raw} ${w1.raw} ${w2.raw}' is a modal passive construction not approved by ` +
              `ASD-STE100 Rule 3.4. Rewrite in active voice: identify who performs the action ` +
              `and make them the subject (e.g. '${w.raw} ${w2.raw}' → 'You ${w.raw} ${w2.raw.replace(/ed$/, "")}' ` +
              `or use an imperative: '${w2.raw.replace(/ed$/, "").replace(/e$/, "")}e the …').`,
            wordCount,
          });
          i += 2; // skip "be" and past participle, already consumed
          continue;
        }
      }

      // ── Pattern 3: "is/are/was/were to be" construction ───────────────────
      // e.g. "is to be installed", "are to be cleaned"
      if (FINITE_BE_FORMS.has(norm) && i + 2 < words.length) {
        const w1Norm = words[i + 1]!.normalized.toLowerCase();
        const w2Norm = words[i + 2]!.normalized.toLowerCase();

        if (w1Norm === "to" && w2Norm === "be") {
          const w1 = words[i + 1]!;
          const w2 = words[i + 2]!;
          // Span to end of "be" (the word following is the actual verb/participle)
          let spanEnd = docStart + w2.offsetInSentence.end;
          let spanRaw = `${w.raw} ${w1.raw} ${w2.raw}`;

          // Extend span to include the verb/past participle if present
          if (i + 3 < words.length) {
            const w3 = words[i + 3]!;
            spanRaw  = `${spanRaw} ${w3.raw}`;
            spanEnd  = docStart + w3.offsetInSentence.end;
          }

          violations.push({
            sentenceIndex:   sentence.index,
            sentenceExcerpt: sentence.text,
            tokenRaw:        spanRaw,
            tokenNormalized: `${norm} to be`,
            positionStart:   docStart + w.offsetInSentence.start,
            positionEnd:     spanEnd,
            ruleId:          RULE_ID,
            ruleName:        RULE_NAME,
            severity:        "major",
            reason:          "is_to_be_construction",
            suggestion:
              `'${spanRaw}' is a complex verb construction not approved by ASD-STE100 Rule 3.4. ` +
              `Rewrite as a direct imperative or active-voice instruction. ` +
              `For example, 'The seat is to be installed before …' → ` +
              `'Before you install the cushion, install the seat.'`,
            wordCount,
          });
          i += 2; // skip "to be", next iteration will handle the verb
          continue;
        }
      }
    }
  }

  return { violations };
}
