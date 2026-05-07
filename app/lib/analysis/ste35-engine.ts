/**
 * ADAM — STE-3.5 rule engine (Verb tense consistency)
 *
 * ASD-STE100 Issue 9: Use the same verb tense throughout a technical text.
 * In descriptive text, always use simple present tense.
 * Do not mix past tense and present tense in the same type of text.
 *
 * Strategy (document-level):
 *   1. Process DESCRIPTIVE sentences only (first word token NOT posHeuristic "v",
 *      since instructional sentences use the imperative base form).
 *   2. Within descriptive sentences, identify past-tense verb signals:
 *        a. Word token ends in "-ed" (regular past) and is NOT immediately
 *           preceded by a BE form (which would indicate passive voice —
 *           already handled by STE-3.2).
 *        b. Word token is in the PAST_IRREGULAR set.
 *   3. Separately count tokens that look like present-tense verbs:
 *        posHeuristic === "v" and NOT an -ed / irregular past form.
 *   4. Emit violations for past-tense tokens only when:
 *        present-tense verb count > 2 × past-tense verb count
 *        (i.e. past tense is a minority — the document is predominantly present tense).
 *      This avoids penalising documents intentionally written in past tense.
 *
 * Severity: major.
 *
 * @see ste32-engine.ts — STE-3.2 (passive voice — be + past participle)
 * @see remaining-ste-rules.md — STE-3.5
 */

import type { TokenizedDocument, Sentence, Token } from "./types";

const RULE_ID   = "STE-3.5";
const RULE_NAME = "Inconsistent verb tense";

const BE_FORMS = new Set([
  "is", "are", "was", "were", "am", "be", "been", "being",
]);

/**
 * Irregular past-tense forms that are unambiguous in technical writing context.
 * Excludes forms that are commonly present-tense in other meanings (e.g. "read").
 */
const PAST_IRREGULAR = new Set([
  "was", "were", "had", "went", "came", "took", "gave", "got",
  "began", "broke", "chose", "drew", "drove", "froze", "grew",
  "knew", "spoke", "threw", "wore", "wrote", "flew", "fell",
  "held", "kept", "lost", "sent", "stood", "told", "sold", "found",
]);

function isDescriptive(sentence: Sentence): boolean {
  const firstWord = sentence.tokens.find((t) => t.isWord);
  if (!firstWord) return true;
  return (firstWord.posHeuristic ?? "unknown") !== "v";
}

function isPastTenseEd(
  token: Token,
  words: Token[],
  idx: number,
): boolean {
  const norm = token.normalized.toLowerCase();
  if (!norm.endsWith("ed") || norm.length < 4) return false;
  // Skip if previous word is a BE form → passive voice (STE-3.2 territory)
  if (idx > 0) {
    const prev = words[idx - 1]!.normalized.toLowerCase();
    if (BE_FORMS.has(prev)) return false;
  }
  return true;
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
  // Pass 1: collect past-tense candidates and count present-tense verbs
  type Candidate = {
    sentence:   Sentence;
    token:      Token;
    tokenIndex: number; // index in 'words' array of the sentence
  };

  const pastCandidates:   Candidate[] = [];
  let   presentVerbCount  = 0;

  for (const sentence of doc.sentences) {
    if (!isDescriptive(sentence)) continue;

    const words     = sentence.tokens.filter((t) => t.isWord);

    for (let i = 0; i < words.length; i++) {
      const token = words[i]!;
      const norm  = token.normalized.toLowerCase();

      if (PAST_IRREGULAR.has(norm)) {
        pastCandidates.push({ sentence, token, tokenIndex: i });
        continue;
      }

      if (isPastTenseEd(token, words, i)) {
        pastCandidates.push({ sentence, token, tokenIndex: i });
        continue;
      }

      // Count present-tense verbs (posHeuristic "v", not past-tense)
      if (token.posHeuristic === "v") {
        presentVerbCount++;
      }
    }
  }

  // Pass 2: emit violations only when past is a minority (document is predominantly present)
  const pastCount = pastCandidates.length;
  if (pastCount === 0) return { violations: [] };
  if (presentVerbCount <= 2 * pastCount) return { violations: [] }; // document is not predominantly present

  const violations: Ste35Violation[] = pastCandidates.map(({ sentence, token }) => {
    const docStart  = sentence.offsetInDocument.start;
    const words     = sentence.tokens.filter((t) => t.isWord);
    const wordCount = words.length;
    const norm      = token.normalized.toLowerCase();
    const isPastIrr = PAST_IRREGULAR.has(norm);

    return {
      sentenceIndex:   sentence.index,
      sentenceExcerpt: sentence.text,
      tokenRaw:        token.raw,
      tokenNormalized: norm,
      positionStart:   docStart + token.offsetInSentence.start,
      positionEnd:     docStart + token.offsetInSentence.end,
      ruleId:          RULE_ID,
      ruleName:        RULE_NAME,
      severity:        "major",
      reason:          "inconsistent_verb_tense",
      suggestion:
        isPastIrr
          ? `'${token.raw}' is past tense. Use simple present tense consistently ` +
            "in descriptive text (e.g. 'is', 'operates', 'provides')."
          : `'${token.raw}' appears to be past tense (-ed form). Use simple present tense ` +
            "consistently in descriptive text.",
      wordCount,
    };
  });

  return { violations };
}
