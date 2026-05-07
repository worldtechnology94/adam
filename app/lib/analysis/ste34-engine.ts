/**
 * ADAM — STE-3.4 rule engine (Infinitives)
 *
 * ASD-STE100 Issue 9: Use an infinitive only to express the purpose of an action.
 * Do not use an infinitive as the subject of a sentence, and do not split infinitives.
 *
 * STE-compliant (purpose clause — allowed):
 *   "To remove the panel, undo the six screws."
 *   "Use the torque wrench to tighten the bolt."
 *
 * Non-compliant examples:
 *   "To remove the panel is the first step."    (infinitive as subject — major)
 *   "You need to carefully inspect the valve."  (split infinitive — minor)
 *
 * Two detection patterns:
 *
 *   Pattern 1 — Infinitive as sentence subject (major)
 *     Sentence starts with word token "to" followed immediately by a non-ing word,
 *     AND no comma appears in the first 10 tokens (which would signal a purpose clause).
 *     A purpose clause like "To remove the panel, ..." always has an early comma.
 *
 *   Pattern 2 — Split infinitive (minor)
 *     Word token "to" followed by an adverb (posHeuristic "adv", i.e. ends in -ly)
 *     followed by a third word token — "to carefully remove", "to quickly check".
 *     Only flagged when "to" is NOT the first word of the sentence (to avoid overlap
 *     with Pattern 1 or purpose-clause openings).
 *
 * @see remaining-ste-rules.md — STE-3.4
 */

import type { TokenizedDocument } from "./types";

const RULE_ID   = "STE-3.4";
const RULE_NAME = "Incorrect use of infinitive";

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
    const allTokens = sentence.tokens; // includes punctuation
    const words     = allTokens.filter((t) => t.isWord);
    const wordCount = words.length;

    if (wordCount < 2) continue;

    // ── Pattern 1 ─────────────────────────────────────────────────────────
    // Infinitive as sentence subject:
    //   First word token is "to", second word token is not an -ing form,
    //   and no comma appears in the first 10 tokens (all tokens, not just words).
    const firstWord  = words[0]!;
    const secondWord = words[1]!;

    if (firstWord.normalized.toLowerCase() === "to") {
      const secondNorm = secondWord.normalized.toLowerCase();

      // Skip if second word is an -ing form (that would be "to + gerund", a different issue)
      // or another "to" (double-to is uncommon but skip it)
      if (!secondNorm.endsWith("ing") && secondNorm !== "to") {
        // Check for a purpose-clause comma within the first 10 raw tokens
        const first10 = allTokens.slice(0, Math.min(10, allTokens.length));
        const hasPurposeComma = first10.some((t) => !t.isWord && t.raw.trim() === ",");

        if (!hasPurposeComma) {
          violations.push({
            sentenceIndex:   sentence.index,
            sentenceExcerpt: sentence.text,
            tokenRaw:        `${firstWord.raw} ${secondWord.raw}`,
            tokenNormalized: `to ${secondNorm}`,
            positionStart:   docStart + firstWord.offsetInSentence.start,
            positionEnd:     docStart + secondWord.offsetInSentence.end,
            ruleId:          RULE_ID,
            ruleName:        RULE_NAME,
            severity:        "major",
            reason:          "infinitive_as_subject",
            suggestion:
              "Do not use an infinitive as the subject of a sentence. " +
              "Use an infinitive only to express purpose, always followed by a comma: " +
              "e.g. 'To remove the panel, undo the screws.' " +
              "Rewrite this sentence with a direct verb or a noun as the subject.",
            wordCount,
          });
        }
      }
    }

    // ── Pattern 2 ─────────────────────────────────────────────────────────
    // Split infinitive: "to" + adverb (-ly word) + third word
    // Only scan from position 1 onwards to avoid overlapping with Pattern 1.
    for (let i = 1; i < words.length - 2; i++) {
      const w0 = words[i]!;
      const w1 = words[i + 1]!;
      const w2 = words[i + 2]!;

      if (w0.normalized.toLowerCase() !== "to") continue;

      // Middle word must be an adverb (ends in -ly per the heuristic)
      const midNorm = w1.normalized.toLowerCase();
      if (!midNorm.endsWith("ly")) continue;

      // Third word should not itself be an adverb (avoid "to very carefully remove" edge)
      const thirdNorm = w2.normalized.toLowerCase();
      if (thirdNorm.endsWith("ly")) continue;

      violations.push({
        sentenceIndex:   sentence.index,
        sentenceExcerpt: sentence.text,
        tokenRaw:        `${w0.raw} ${w1.raw} ${w2.raw}`,
        tokenNormalized: `to ${midNorm} ${thirdNorm}`,
        positionStart:   docStart + w0.offsetInSentence.start,
        positionEnd:     docStart + w2.offsetInSentence.end,
        ruleId:          RULE_ID,
        ruleName:        RULE_NAME,
        severity:        "minor",
        reason:          "split_infinitive",
        suggestion:
          `Do not split the infinitive 'to ${thirdNorm}' with an adverb. ` +
          `Move '${w1.raw}' before 'to' or after '${w2.raw}': ` +
          `e.g. '${w1.raw} to ${thirdNorm}' or 'to ${thirdNorm} ${w1.raw}'.`,
        wordCount,
      });
    }
  }

  return { violations };
}
