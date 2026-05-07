/**
 * ADAM — STE-6.1 rule engine (topic sentence — heuristic)
 *
 * ASD-STE100 Issue 9: Structure / descriptive writing often expects a clear topic
 * for each paragraph. Heuristic: if a paragraph has **two or more** sentences and
 * the **first** sentence is **very short** (≤3 words), flag it as a possible missing
 * or weak topic sentence.
 *
 * Limitations: Poetry, labels, and telegraphic style may false-positive; tune threshold.
 *
 * @see docs/extended-rule-coverage-plan.md — STE-6.1
 */

import type { TokenizedDocument } from "./types";
import { getParagraphSpans, paragraphIndexForOffset } from "./paragraph";

const RULE_ID = "STE-6.1";
const RULE_NAME = "Paragraph topic";

const SUGGESTION =
  "Consider a clear topic sentence that introduces the paragraph (usually one sentence with the main idea), unless this is a title, label, or intentional short line.";

const MAX_FIRST_SENTENCE_WORDS = 3;

export interface Ste61Violation {
  sentenceIndex: number;
  sentenceExcerpt: string;
  tokenRaw: string;
  tokenNormalized: string;
  positionStart: number;
  positionEnd: number;
  ruleId: string;
  ruleName: string;
  severity: "critical" | "major" | "minor";
  reason: string;
  suggestion: string;
  wordCount: number;
}

export interface Ste61EngineResult {
  violations: Ste61Violation[];
}

export function runSte61Check(doc: TokenizedDocument): Ste61EngineResult {
  const violations: Ste61Violation[] = [];
  const spans = getParagraphSpans(doc.sourceText);

  const byPara = new Map<number, typeof doc.sentences>();
  for (const sentence of doc.sentences) {
    const start = sentence.offsetInDocument.start;
    const pi = paragraphIndexForOffset(spans, start);
    if (pi < 0) continue;
    if (!byPara.has(pi)) byPara.set(pi, []);
    byPara.get(pi)!.push(sentence);
  }

  for (const [, sentences] of byPara) {
    if (sentences.length < 2) continue;
    const ordered = [...sentences].sort((a, b) => a.index - b.index);
    const first = ordered[0];
    if (!first) continue;
    const wc = first.tokens.filter((t) => t.isWord).length;
    if (wc > MAX_FIRST_SENTENCE_WORDS) continue;

    const start = first.offsetInDocument.start;
    const end = first.offsetInDocument.end;

    violations.push({
      sentenceIndex: first.index,
      sentenceExcerpt: first.text,
      tokenRaw: "",
      tokenNormalized: "",
      positionStart: start,
      positionEnd: end,
      ruleId: RULE_ID,
      ruleName: RULE_NAME,
      severity: "minor",
      reason: "short_topic_sentence",
      suggestion: SUGGESTION,
      wordCount: wc,
    });
  }

  return { violations };
}
