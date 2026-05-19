/**
 * ADAM — STE-6.2 rule engine (Key words for logical structure)
 *
 * ASD-STE100 Issue 9 Rule 6.2: Use words and phrases that are repeated in
 * related sentences to show that the sentences are connected. The same
 * terminology links ideas and helps the reader follow the logical structure.
 *
 * This engine detects pairs of consecutive sentences within the same paragraph
 * that share no significant content words. When two adjacent sentences have
 * entirely different vocabulary, the reader cannot see how they are connected —
 * the text lacks the key-word linkage that STE-6.2 requires.
 *
 *   Non-STE (no shared key words between sentences):
 *     "The hydraulic pump generates system pressure."
 *     "Inspect the connector bracket for cracks."
 *
 *   STE (shared key word "pressure" links both sentences):
 *     "The hydraulic pump generates system pressure."
 *     "If the pressure is low, check the pump for leaks."
 *
 * Detection method:
 *   For each consecutive pair of sentences in a paragraph:
 *     1. Extract content words from each sentence (nouns, technical terms,
 *        significant words ≥ 4 characters, excluding common stop words).
 *     2. If both sentences have enough content words (≥ 3 each) and they
 *        share NONE → flag the later sentence as lacking key-word linkage.
 *
 * Only checks DESCRIPTIVE sentence pairs (non-imperative). Procedural steps
 * may legitimately refer to different components in each step.
 *
 * Severity: minor (advisory).
 *
 * @see ste64-engine.ts — STE-6.4 (paragraph topic sentence / structure)
 * @see ste44-engine.ts — STE-4.4 (connecting words and phrases)
 */

import type { Sentence, TokenizedDocument } from "./types";
import { getParagraphSpans, paragraphIndexForOffset } from "./paragraph";

const RULE_ID   = "STE-6.2";
const RULE_NAME = "Use key words and phrases for logical structure";

const MIN_SENTENCE_WORDS = 5;   // don't flag very short sentences
const MIN_CONTENT_WORDS  = 3;   // each sentence must have this many content words to check

/**
 * Common stop words that are not "key" technical words.
 * Any word in this set is excluded from the content-word comparison.
 */
const STOP_WORDS = new Set([
  // articles / determiners
  "a", "an", "the", "this", "that", "these", "those", "some", "any",
  "all", "both", "each", "every", "no", "other",
  // pronouns
  "i", "you", "he", "she", "it", "we", "they", "me", "him", "her", "us",
  "them", "its", "their", "your", "our", "my", "his",
  // prepositions
  "of", "in", "to", "for", "with", "on", "at", "by", "from", "into",
  "through", "over", "under", "between", "after", "before", "during",
  "within", "without", "about", "above", "below", "around", "along",
  "against", "across", "among", "behind", "beyond", "near", "off",
  // conjunctions
  "and", "but", "or", "nor", "so", "yet", "because", "since", "as",
  "while", "when", "if", "then", "that", "than", "though", "although",
  "unless", "until", "whether", "where", "which",
  // common auxiliary / copula verbs
  "is", "are", "was", "were", "be", "been", "being", "have", "has",
  "had", "do", "does", "did", "will", "would", "can", "could", "may",
  "might", "must", "shall", "should",
  // other very common words (not technical)
  "not", "also", "only", "just", "very", "more", "most", "first",
  "second", "third", "new", "same", "such", "use", "used", "make",
  "made", "get", "let", "see", "set", "may", "well", "one", "two",
  "three", "four", "five", "per", "etc", "ie", "eg", "sure", "sure",
]);

function getContentWords(sentence: Sentence): Set<string> {
  const words  = sentence.tokens.filter((t) => t.isWord);
  const result = new Set<string>();
  for (const token of words) {
    const norm = token.normalized.toLowerCase();
    if (norm.length < 4) continue;                 // too short to be significant
    if (STOP_WORDS.has(norm)) continue;
    result.add(norm);
  }
  return result;
}

function setsIntersect(a: Set<string>, b: Set<string>): boolean {
  for (const word of a) {
    if (b.has(word)) return true;
  }
  return false;
}

function isDescriptive(sentence: Sentence): boolean {
  const firstWord = sentence.tokens.find((t) => t.isWord);
  if (!firstWord) return true;
  return (firstWord.posHeuristic ?? "").toLowerCase() !== "v";
}

export interface Ste62Violation {
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

export interface Ste62EngineResult {
  violations: Ste62Violation[];
}

export function runSte62Check(doc: TokenizedDocument): Ste62EngineResult {
  const violations: Ste62Violation[] = [];
  const spans  = getParagraphSpans(doc.sourceText);

  // Group sentences by paragraph
  const byPara = new Map<number, typeof doc.sentences>();
  for (const sentence of doc.sentences) {
    const pi = paragraphIndexForOffset(spans, sentence.offsetInDocument.start);
    if (pi < 0) continue;
    if (!byPara.has(pi)) byPara.set(pi, []);
    byPara.get(pi)!.push(sentence);
  }

  for (const [, sentences] of byPara) {
    if (sentences.length < 2) continue;
    const ordered = [...sentences].sort((a, b) => a.index - b.index);

    for (let i = 1; i < ordered.length; i++) {
      const prev = ordered[i - 1]!;
      const curr = ordered[i]!;

      // Only check descriptive sentence pairs (not procedural steps)
      if (!isDescriptive(prev) || !isDescriptive(curr)) continue;

      const prevWords = prev.tokens.filter((t) => t.isWord).length;
      const currWords = curr.tokens.filter((t) => t.isWord).length;
      if (prevWords < MIN_SENTENCE_WORDS || currWords < MIN_SENTENCE_WORDS) continue;

      const prevContent = getContentWords(prev);
      const currContent = getContentWords(curr);

      if (prevContent.size < MIN_CONTENT_WORDS || currContent.size < MIN_CONTENT_WORDS) continue;

      if (!setsIntersect(prevContent, currContent)) {
        violations.push({
          sentenceIndex:   curr.index,
          sentenceExcerpt: curr.text,
          tokenRaw:        "",
          tokenNormalized: "",
          positionStart:   curr.offsetInDocument.start,
          positionEnd:     curr.offsetInDocument.end,
          ruleId:          RULE_ID,
          ruleName:        RULE_NAME,
          severity:        "minor",
          reason:          "missing_key_word_linkage",
          suggestion:
            "This sentence shares no key words with the previous sentence " +
            "(ASD-STE100 Rule 6.2: repeat key words across related sentences to show logical structure). " +
            "Use the same terminology as the previous sentence, or add a connecting word " +
            "(and, but, then, thus, as a result) or a pronoun (this, it, they) to link the ideas.",
          wordCount: currWords,
        });
      }
    }
  }

  return { violations };
}
