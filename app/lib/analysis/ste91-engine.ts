/**
 * ADAM — STE-9.1 rule engine (Ambiguous pronoun references)
 *
 * ASD-STE100 Issue 9 Rule 9.1: Use a different sentence construction when
 * a word-for-word replacement is not sufficient.
 *
 * This rule applies especially when a direct word-for-word replacement in
 * translation (or rephrasing) would produce an unclear or ambiguous sentence.
 * The most common structural problem that requires rewriting is an ambiguous
 * pronoun reference — when "it", "they", "this", "these", or "those" begins
 * a sentence and could refer to two or more nouns from the preceding sentence.
 *
 * If the antecedent is unclear, the reader — or a translator doing a
 * word-for-word replacement — cannot resolve the reference correctly.
 * The fix is to use a different sentence construction: name the referent
 * explicitly rather than using a pronoun.
 *
 *   Non-STE: "Connect the pump to the valve. It must be lubricated first."
 *             — "It" could mean the pump or the valve. Ambiguous.
 *   STE:     "Connect the pump to the valve. Lubricate the pump before connection."
 *             — Referent named explicitly; no pronoun ambiguity.
 *
 *   Non-STE: "Remove the cover and the retaining clip. This can be discarded."
 *             — "This" could mean the cover or the retaining clip.
 *   STE:     "Remove the cover and the retaining clip. Discard the retaining clip."
 *
 * Detection (sentence-pair, document-level):
 *   1. For each sentence that STARTS with an ambiguous pronoun
 *      (It/They/This/These/Those as the first word token):
 *   2. Check the PREVIOUS sentence for the number of distinct nouns
 *      (posHeuristic = "n" OR capitalized mid-sentence tokens).
 *   3. If the previous sentence contains 2 or more distinct nouns →
 *      the pronoun reference is potentially ambiguous → flag.
 *
 * Only flags sentences that begin with the pronoun (subject position),
 * where the ambiguity is most acute. Mid-sentence pronoun uses are not flagged
 * as they are harder to assess without semantic understanding.
 *
 * Severity: minor (advisory — the writer must confirm ambiguity exists).
 *
 * @see ste44-engine.ts — STE-4.4 (connecting words and phrases)
 */

import type { TokenizedDocument, Token } from "./types";

const RULE_ID   = "STE-9.1";
const RULE_NAME = "Use a different sentence construction when needed for clarity";

/**
 * Pronouns that, when used as the first word of a sentence and referring
 * back to a previous sentence with multiple nouns, create ambiguity.
 */
const AMBIGUOUS_SUBJECT_PRONOUNS = new Set(["it", "they", "this", "these", "those"]);

/**
 * Minimum number of distinct nouns in the preceding sentence to consider
 * the pronoun reference ambiguous.
 */
const MIN_NOUNS_FOR_AMBIGUITY = 2;

/**
 * Returns the number of distinct noun-like tokens in a sentence.
 * Uses posHeuristic "n" and capitalized mid-sentence tokens as heuristics.
 */
function countDistinctNouns(words: Token[]): number {
  const nouns = new Set<string>();
  for (let i = 0; i < words.length; i++) {
    const token = words[i]!;
    const pos   = (token.posHeuristic ?? "").toLowerCase();
    const norm  = token.normalized.toLowerCase();

    if (norm.length < 3) continue;

    const isNounPos = pos === "n";
    const isMidCapitalized = i > 0 && /^[A-Z]/.test(token.raw) && token.raw.length > 1;
    // Words immediately after an article are almost always nouns
    const prevNorm = i > 0 ? words[i - 1]!.normalized.toLowerCase() : "";
    const followsArticle = prevNorm === "a" || prevNorm === "an" || prevNorm === "the";

    if (isNounPos || isMidCapitalized || followsArticle) {
      nouns.add(norm);
    }
  }
  return nouns.size;
}

export interface Ste91Violation {
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

export interface Ste91EngineResult {
  violations: Ste91Violation[];
}

export function runSte91Check(doc: TokenizedDocument): Ste91EngineResult {
  const violations: Ste91Violation[] = [];
  const sentences = doc.sentences;

  for (let i = 1; i < sentences.length; i++) {
    const curr = sentences[i]!;
    const prev = sentences[i - 1]!;

    const currWords = curr.tokens.filter((t) => t.isWord);
    if (currWords.length < 2) continue;

    // Check if the current sentence begins with an ambiguous subject pronoun
    const firstWord = currWords[0]!;
    const firstNorm = firstWord.normalized.toLowerCase();
    if (!AMBIGUOUS_SUBJECT_PRONOUNS.has(firstNorm)) continue;

    // Count distinct nouns in the previous sentence
    const prevWords   = prev.tokens.filter((t) => t.isWord);
    const prevNounCount = countDistinctNouns(prevWords);
    if (prevNounCount < MIN_NOUNS_FOR_AMBIGUITY) continue;

    // Pronoun is ambiguous — flag
    const docStart  = curr.offsetInDocument.start;
    const wordCount = currWords.length;

    violations.push({
      sentenceIndex:   curr.index,
      sentenceExcerpt: curr.text,
      tokenRaw:        firstWord.raw,
      tokenNormalized: firstNorm,
      positionStart:   docStart + firstWord.offsetInSentence.start,
      positionEnd:     docStart + firstWord.offsetInSentence.end,
      ruleId:          RULE_ID,
      ruleName:        RULE_NAME,
      severity:        "minor",
      reason:          "ambiguous_pronoun_reference",
      suggestion:
        `'${firstWord.raw}' at the start of this sentence could refer to any of the ` +
        `${prevNounCount} nouns in the preceding sentence, creating an ambiguous reference ` +
        `(ASD-STE100 Rule 9.1: use a different sentence construction for clarity). ` +
        `Name the referent explicitly instead of using a pronoun: ` +
        `e.g. replace '${firstWord.raw}' with the specific noun it refers to.`,
      wordCount,
    });
  }

  return { violations };
}
