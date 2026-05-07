/**
 * ADAM — STE-1.6 rule engine (Unapproved word used outside technical noun context)
 *
 * ASD-STE100 Issue 9: Use a word that is not in the STE dictionary only when it
 * is a technical noun or part of a technical noun.
 *
 * STE-1.1 already flags every unknown word. This engine adds a more specific
 * violation when the unknown word is unambiguously in a non-noun grammatical
 * position — meaning it cannot be a technical noun and must be replaced.
 *
 * Detection: word is not in dictionary (lookup returns null) AND the POS heuristic
 * shows it is being used as an adverb (ends in -ly / -wise) or as an adjective
 * with a clearly derivational suffix (-ful, -less, -ous/-ious).
 *
 * These suffix patterns are reliable enough on their own and do not suffer from
 * the plural-noun/verb confusion that plagues the -s/-ed/-ing heuristic.
 *
 * Exclusions:
 *   - ALL-CAPS tokens (acronyms) — always treated as technical noun candidates
 *   - Purely numeric tokens
 *   - Tokens shorter than 4 characters
 *
 * @see remaining-ste-rules.md — STE-1.6
 * @see ste11-engine.ts — STE-1.1 (unknown / forbidden words — complementary check)
 */

import type { TokenizedDocument } from "./types";
import type { DictionaryLookup } from "./ste11-types";

const RULE_ID   = "STE-1.6";
const RULE_NAME = "Unapproved word outside technical noun context";

/** Regex for an ALL-CAPS acronym token (2–8 uppercase letters, optional trailing digits). */
const ACRONYM_RE = /^[A-Z]{2,8}\d*$/;

/** Adverb-forming suffixes — a word with these is grammatically an adverb, never a TN. */
const ADVERB_SUFFIXES = ["ly", "wise"];

/**
 * Adjective-forming derivational suffixes that unambiguously mark the word as an
 * adjective — not a technical noun.
 * Note: -able/-ible excluded because technical terms like "serviceable" are common.
 */
const ADJ_SUFFIXES = ["ful", "less", "ous", "ious"];

function isAdverbForm(normalized: string): boolean {
  return ADVERB_SUFFIXES.some((s) => normalized.endsWith(s));
}

function isAdjectiveForm(normalized: string): boolean {
  return ADJ_SUFFIXES.some((s) => normalized.endsWith(s));
}

export interface Ste16Violation {
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

export interface Ste16EngineResult {
  violations: Ste16Violation[];
}

export async function runSte16Check(
  doc: TokenizedDocument,
  lookup: DictionaryLookup,
): Promise<Ste16EngineResult> {
  const violations: Ste16Violation[] = [];

  for (const sentence of doc.sentences) {
    const docStart  = sentence.offsetInDocument.start;
    const wordCount = sentence.tokens.filter((t) => t.isWord).length;

    for (const token of sentence.tokens) {
      if (!token.isWord || !token.normalized) continue;

      const norm = token.normalized.toLowerCase();

      // Skip very short tokens and pure numbers
      if (norm.length < 4 || /^\d+$/.test(norm)) continue;

      // Skip ALL-CAPS acronyms — always candidate technical nouns
      if (ACRONYM_RE.test(token.raw)) continue;

      // Word must be absent from the dictionary (entry == null)
      const entry = await lookup(norm);
      if (entry !== null) continue; // known word — STE-1.1 handles it

      // Determine if the usage is unambiguously non-noun
      let reason   = "";
      let partOfSpeech = "";

      if (isAdverbForm(norm)) {
        reason = "unapproved_adverb";
        partOfSpeech = "adverb";
      } else if (isAdjectiveForm(norm)) {
        reason = "unapproved_adjective";
        partOfSpeech = "adjective";
      } else {
        continue; // cannot confidently determine it's non-noun — leave to STE-1.1
      }

      violations.push({
        sentenceIndex:   sentence.index,
        sentenceExcerpt: sentence.text,
        tokenRaw:        token.raw,
        tokenNormalized: norm,
        positionStart:   docStart + token.offsetInSentence.start,
        positionEnd:     docStart + token.offsetInSentence.end,
        ruleId:          RULE_ID,
        ruleName:        RULE_NAME,
        severity:        "major",
        reason,
        suggestion:
          `'${token.raw}' is not in the STE dictionary and is used as an ${partOfSpeech}. ` +
          "Unapproved words may only appear as technical nouns (names of parts, equipment, or systems). " +
          "Replace with an approved STE word or rephrase the sentence.",
        wordCount,
      });
    }
  }

  return { violations };
}
