/**
 * ADAM — STE-6.6 rule engine (Structure clarity)
 *
 * ASD-STE100 Issue 9: The structure of the document must make it easy for
 * the reader to find the information they need.
 *
 * This engine detects one automatable structure problem:
 *
 *   Three or more consecutive single-sentence paragraphs.
 *
 * In technical writing this pattern usually means the writer has fragmented
 * related information into disconnected chunks. The reader cannot tell how
 * the items relate to each other. The fix is either to group them into one
 * paragraph with a topic sentence, or convert them into a bulleted list.
 *
 * A violation is emitted at the FIRST sentence of the run. The tokenRaw
 * field records how many consecutive single-sentence paragraphs were found.
 *
 * Severity: minor (advisory).
 *
 * @see ste62-engine.ts — STE-6.2 (list structure)
 * @see remaining-ste-rules.md — STE-6.6
 */

import type { TokenizedDocument } from "./types";
import { getParagraphSpans, paragraphIndexForOffset } from "./paragraph";

const RULE_ID              = "STE-6.4";
const RULE_NAME            = "Use paragraphs to show related information";
const MIN_CONSECUTIVE_SOLO = 3; // flag when this many single-sentence paragraphs appear in a row

export interface Ste66Violation {
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

export interface Ste66EngineResult {
  violations: Ste66Violation[];
}

export function runSte66Check(doc: TokenizedDocument): Ste66EngineResult {
  const violations: Ste66Violation[] = [];
  const spans = getParagraphSpans(doc.sourceText);

  // Build paragraph → sentence count and first sentence map
  const paraInfo: { sentenceCount: number; firstSentence: typeof doc.sentences[0] | null }[] =
    spans.map(() => ({ sentenceCount: 0, firstSentence: null }));

  for (const sentence of doc.sentences) {
    const pi = paragraphIndexForOffset(spans, sentence.offsetInDocument.start);
    if (pi < 0) continue;
    const info = paraInfo[pi]!;
    info.sentenceCount++;
    if (info.firstSentence === null || sentence.index < info.firstSentence.index) {
      info.firstSentence = sentence;
    }
  }

  // Scan for runs of consecutive single-sentence paragraphs
  let runStart = -1;
  let runLen   = 0;

  for (let pi = 0; pi <= paraInfo.length; pi++) {
    const info = paraInfo[pi];
    const isSolo = info !== undefined && info.sentenceCount === 1;

    if (isSolo) {
      if (runLen === 0) runStart = pi;
      runLen++;
    } else {
      if (runLen >= MIN_CONSECUTIVE_SOLO) {
        // Emit violation at first sentence of the run
        const firstParaInfo = paraInfo[runStart]!;
        const anchor = firstParaInfo.firstSentence;
        if (anchor) {
          violations.push({
            sentenceIndex:   anchor.index,
            sentenceExcerpt: anchor.text,
            tokenRaw:        `${runLen} consecutive single-sentence paragraphs`,
            tokenNormalized: `${runLen} consecutive single-sentence paragraphs`,
            positionStart:   anchor.offsetInDocument.start,
            positionEnd:     anchor.offsetInDocument.end,
            ruleId:          RULE_ID,
            ruleName:        RULE_NAME,
            severity:        "minor",
            reason:          "consecutive_single_sentence_paragraphs",
            suggestion:
              `There are ${runLen} consecutive single-sentence paragraphs here. ` +
              "Group related items into one paragraph with a topic sentence, " +
              "or convert them to a bulleted list to show their relationship.",
            wordCount: anchor.tokens.filter((t) => t.isWord).length,
          });
        }
      }
      runStart = -1;
      runLen   = 0;
    }
  }

  return { violations };
}
