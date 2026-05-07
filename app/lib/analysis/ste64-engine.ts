/**
 * ADAM — STE-6.4 rule engine (Topic sentences)
 *
 * ASD-STE100 Issue 9: Every descriptive paragraph must begin with a topic
 * sentence that tells the reader what the paragraph is about.
 *
 * STE-6.1 flags paragraphs whose first sentence is too short (≤3 words).
 * STE-6.4 handles a different failure mode: paragraphs whose first sentence
 * begins with a connector word or a back-reference pronoun, signalling that
 * the paragraph picks up mid-thought rather than establishing a clear topic.
 *
 * Detection (first sentence of any paragraph with 2+ sentences):
 *   - First word token is a connector  ("however", "also", "therefore", …)
 *   - First two-word phrase is a connector phrase ("in addition", "as a result", …)
 *   - First word token is a back-reference pronoun ("it", "they", "this", …)
 *
 * Only fires when the paragraph has ≥ 2 sentences (single-sentence paragraphs
 * are handled by STE-6.6 structure check).
 *
 * @see ste61-engine.ts — STE-6.1 (short topic sentence)
 * @see remaining-ste-rules.md — STE-6.4
 */

import type { TokenizedDocument } from "./types";
import { getParagraphSpans, paragraphIndexForOffset } from "./paragraph";

const RULE_ID   = "STE-6.4";
const RULE_NAME = "Missing topic sentence";

const CONNECTOR_WORDS = new Set([
  "also", "however", "furthermore", "additionally", "moreover",
  "therefore", "thus", "consequently", "nevertheless", "meanwhile",
  "subsequently", "similarly", "otherwise", "alternatively",
  "nonetheless", "besides", "still", "yet", "instead",
]);

const CONNECTOR_BIGRAMS = new Set([
  "in addition", "as a result", "for example", "for instance",
  "in contrast", "on the other hand", "in other words",
  "at the same time", "in the same way", "as well",
  "in conclusion", "to summarise", "to summarize",
]);

const BACK_REFERENCE_PRONOUNS = new Set([
  "it", "its", "they", "their", "them",
  "this", "these", "those",
]);

export interface Ste64Violation {
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

export interface Ste64EngineResult {
  violations: Ste64Violation[];
}

export function runSte64Check(doc: TokenizedDocument): Ste64EngineResult {
  const violations: Ste64Violation[] = [];
  const spans = getParagraphSpans(doc.sourceText);

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
    const first   = ordered[0]!;
    const words   = first.tokens.filter((t) => t.isWord);
    if (words.length === 0) continue;

    const w0 = words[0]!.normalized.toLowerCase();
    const w1 = words[1]?.normalized.toLowerCase() ?? "";
    const bigram = `${w0} ${w1}`.trim();

    let reason      = "";
    let triggerWord = "";

    if (CONNECTOR_WORDS.has(w0)) {
      reason      = "paragraph_starts_with_connector";
      triggerWord = w0;
    } else if (CONNECTOR_BIGRAMS.has(bigram)) {
      reason      = "paragraph_starts_with_connector";
      triggerWord = bigram;
    } else if (BACK_REFERENCE_PRONOUNS.has(w0)) {
      reason      = "paragraph_starts_with_back_reference";
      triggerWord = w0;
    }

    if (!reason) continue;

    violations.push({
      sentenceIndex:   first.index,
      sentenceExcerpt: first.text,
      tokenRaw:        words[0]!.raw,
      tokenNormalized: triggerWord,
      positionStart:   first.offsetInDocument.start,
      positionEnd:     first.offsetInDocument.end,
      ruleId:          RULE_ID,
      ruleName:        RULE_NAME,
      severity:        "major",
      reason,
      suggestion:
        reason === "paragraph_starts_with_back_reference"
          ? `The paragraph starts with the pronoun '${triggerWord}'. ` +
            "Begin with a topic sentence that names the subject directly, " +
            "so the reader does not need to refer back to find what '${triggerWord}' means."
          : `The paragraph starts with the connector '${triggerWord}'. ` +
            "Begin with a topic sentence that states the paragraph's main point. " +
            "Move connector words to a later sentence or remove them.",
      wordCount: words.length,
    });
  }

  return { violations };
}
