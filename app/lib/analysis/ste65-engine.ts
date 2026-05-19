/**
 * ADAM — STE-6.5 rule engine (One topic per paragraph)
 *
 * ASD-STE100 Issue 9 Rule 6.5: Make sure that each paragraph has only one topic.
 *
 * When a descriptive paragraph mixes two or more separate topics, the reader
 * cannot follow the logic and the text becomes harder to translate and maintain.
 * Each distinct subject or system should have its own paragraph.
 *
 * Detection (document-level, paragraph scope):
 *   For each descriptive paragraph with ≥ 3 sentences:
 *   1. Extract "topic words" from the first sentence — significant content words
 *      (nouns, technical terms, ≥ 4 characters, not stop words).
 *   2. For each subsequent sentence, check whether it shares at least one topic word
 *      with the opening sentence.
 *   3. A sentence that shares ZERO topic words with the opening sentence is "off-topic."
 *   4. When 2 or more sentences in the same paragraph are off-topic, the paragraph
 *      likely discusses multiple subjects — flag the first off-topic sentence.
 *
 * Only checks DESCRIPTIVE sentences (non-imperative paragraphs). Procedural steps
 * naturally refer to different components in sequence and are not flagged.
 *
 * Severity: minor (advisory — the writer must judge whether topics genuinely differ).
 *
 * @see ste64-engine.ts — STE-6.4 (use paragraphs to show related information)
 * @see ste62-engine.ts — STE-6.2 (key-word linkage between consecutive sentences)
 */

import type { TokenizedDocument, Token } from "./types";
import { getParagraphSpans, paragraphIndexForOffset } from "./paragraph";

const RULE_ID   = "STE-6.5";
const RULE_NAME = "Make sure that each paragraph has only one topic";

const MIN_PARAGRAPH_SENTENCES = 3;
const MIN_CONTENT_WORDS       = 2;  // first sentence must have this many content words

const STOP_WORDS = new Set([
  "a", "an", "the", "this", "that", "these", "those", "some", "any",
  "all", "both", "each", "every", "no", "other",
  "i", "you", "he", "she", "it", "we", "they", "me", "him", "her", "us",
  "them", "its", "their", "your", "our", "my", "his",
  "of", "in", "to", "for", "with", "on", "at", "by", "from", "into",
  "through", "over", "under", "between", "after", "before", "during",
  "within", "without", "about", "above", "below", "around", "along",
  "against", "across", "among", "behind", "beyond", "near", "off",
  "and", "but", "or", "nor", "so", "yet", "because", "since", "as",
  "while", "when", "if", "then", "that", "than", "though", "although",
  "unless", "until", "whether", "where", "which",
  "is", "are", "was", "were", "be", "been", "being", "have", "has",
  "had", "do", "does", "did", "will", "would", "can", "could", "may",
  "might", "must", "shall", "should",
  "not", "also", "only", "just", "very", "more", "most", "first",
  "second", "third", "new", "same", "such", "use", "used", "make",
  "made", "get", "let", "see", "set", "sure", "one", "two", "per",
]);

function getContentWords(words: Token[]): Set<string> {
  const result = new Set<string>();
  for (const token of words) {
    const norm = token.normalized.toLowerCase();
    if (norm.length < 4) continue;
    if (STOP_WORDS.has(norm)) continue;
    result.add(norm);
  }
  return result;
}

function hasOverlap(a: Set<string>, b: Set<string>): boolean {
  for (const w of a) {
    if (b.has(w)) return true;
  }
  return false;
}

function isDescriptive(words: Token[]): boolean {
  if (words.length === 0) return false;
  return (words[0]!.posHeuristic ?? "").toLowerCase() !== "v";
}

export interface Ste65Violation {
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

export interface Ste65EngineResult {
  violations: Ste65Violation[];
}

export function runSte65Check(doc: TokenizedDocument): Ste65EngineResult {
  const violations: Ste65Violation[] = [];
  const spans = getParagraphSpans(doc.sourceText);

  const byPara = new Map<number, typeof doc.sentences>();
  for (const sentence of doc.sentences) {
    const pi = paragraphIndexForOffset(spans, sentence.offsetInDocument.start);
    if (pi < 0) continue;
    if (!byPara.has(pi)) byPara.set(pi, []);
    byPara.get(pi)!.push(sentence);
  }

  for (const [, sentences] of byPara) {
    if (sentences.length < MIN_PARAGRAPH_SENTENCES) continue;

    const ordered = [...sentences].sort((a, b) => a.index - b.index);

    // Only check descriptive paragraphs
    const firstWords = ordered[0]!.tokens.filter((t) => t.isWord);
    if (!isDescriptive(firstWords)) continue;

    // Extract topic words from the opening sentence
    const topicWords = getContentWords(firstWords);
    if (topicWords.size < MIN_CONTENT_WORDS) continue;

    // Find sentences that share zero topic words with the opening
    let offTopicCount = 0;
    let firstOffTopic: (typeof ordered)[number] | null = null;

    for (let i = 1; i < ordered.length; i++) {
      const sent  = ordered[i]!;
      const words = sent.tokens.filter((t) => t.isWord);
      if (words.length < 3) continue;

      const sentContent = getContentWords(words);
      if (sentContent.size === 0) continue;

      if (!hasOverlap(topicWords, sentContent)) {
        offTopicCount++;
        if (firstOffTopic === null) firstOffTopic = sent;
      }
    }

    if (offTopicCount >= 2 && firstOffTopic !== null) {
      const wc = firstOffTopic.tokens.filter((t) => t.isWord).length;
      violations.push({
        sentenceIndex:   firstOffTopic.index,
        sentenceExcerpt: firstOffTopic.text,
        tokenRaw:        "",
        tokenNormalized: "",
        positionStart:   firstOffTopic.offsetInDocument.start,
        positionEnd:     firstOffTopic.offsetInDocument.end,
        ruleId:          RULE_ID,
        ruleName:        RULE_NAME,
        severity:        "minor",
        reason:          "multiple_topics_in_paragraph",
        suggestion:
          `This paragraph appears to discuss more than one topic (ASD-STE100 Rule 6.5). ` +
          `${offTopicCount} sentence(s) in this paragraph share no vocabulary with its opening sentence. ` +
          `Split the paragraph so that each paragraph covers only one topic.`,
        wordCount: wc,
      });
    }
  }

  return { violations };
}
