/**
 * ADAM — STE-6.3 rule engine (Paragraph length)
 *
 * ASD-STE100 Issue 9: A paragraph must not exceed 6 sentences.
 * Long paragraphs make information harder to find and process.
 *
 * Uses the same paragraph-grouping pattern as STE-6.1:
 * getParagraphSpans + paragraphIndexForOffset → byPara map.
 * A violation is emitted at the 7th sentence of any paragraph that exceeds 6.
 *
 * Severity: minor for 7–8 sentences, major for 9+.
 *
 * @see ste61-engine.ts — paragraph grouping pattern
 * @see remaining-ste-rules.md — STE-6.3
 */

import type { TokenizedDocument } from "./types";
import { getParagraphSpans, paragraphIndexForOffset } from "./paragraph";

const RULE_ID   = "STE-6.3";
const RULE_NAME = "Paragraph length";
const MAX_SENTENCES = 6;

export interface Ste63Violation {
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

export interface Ste63EngineResult {
  violations: Ste63Violation[];
}

export function runSte63Check(doc: TokenizedDocument): Ste63EngineResult {
  const violations: Ste63Violation[] = [];
  const spans = getParagraphSpans(doc.sourceText);

  // Group sentences by paragraph index
  const byPara = new Map<number, typeof doc.sentences>();
  for (const sentence of doc.sentences) {
    const pi = paragraphIndexForOffset(spans, sentence.offsetInDocument.start);
    if (pi < 0) continue;
    if (!byPara.has(pi)) byPara.set(pi, []);
    byPara.get(pi)!.push(sentence);
  }

  for (const [, sentences] of byPara) {
    if (sentences.length <= MAX_SENTENCES) continue;

    // Sort by sentence index to ensure correct ordering
    const ordered = [...sentences].sort((a, b) => a.index - b.index);
    const count   = ordered.length;

    // Violation anchored at the 7th sentence (index 6)
    const trigger = ordered[MAX_SENTENCES]!;
    const first   = ordered[0]!;

    violations.push({
      sentenceIndex:   trigger.index,
      sentenceExcerpt: first.text, // show paragraph opening for context
      tokenRaw:        `paragraph of ${count} sentences`,
      tokenNormalized: `paragraph of ${count} sentences`,
      positionStart:   first.offsetInDocument.start,
      positionEnd:     ordered[count - 1]!.offsetInDocument.end,
      ruleId:          RULE_ID,
      ruleName:        RULE_NAME,
      severity:        count >= 9 ? "major" : "minor",
      reason:          "paragraph_too_long",
      suggestion:
        `This paragraph has ${count} sentences. ` +
        `Split it into paragraphs of ${MAX_SENTENCES} sentences or fewer.`,
      wordCount: ordered.reduce(
        (sum, s) => sum + s.tokens.filter((t) => t.isWord).length,
        0,
      ),
    });
  }

  return { violations };
}
