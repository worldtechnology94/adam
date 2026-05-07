/**
 * ADAM — STE-2.1 rule engine (Noun cluster length)
 *
 * Max 3 words in a noun cluster. A "noun cluster" is a maximal run of
 * consecutive tokens tagged as article, adjective, or noun (art, adj, n).
 * Uses POS heuristic; 4+ words in such a run → violation.
 *
 * @see ruleplan.md — STE-2.1
 */

import type { TokenizedDocument, Token } from "./types";

const RULE_ID = "STE-2.1";
const RULE_NAME = "Noun cluster length";
const MAX_NOUN_CLUSTER_WORDS = 3;

const NOUN_CLUSTER_POS = new Set(["art", "adj", "n"]);

function isNounClusterPos(pos: string | undefined): boolean {
  return pos != null && NOUN_CLUSTER_POS.has(pos.toLowerCase());
}

/** Violation shape compatible with analyze route (persistence). */
export interface Ste21Violation {
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

export interface Ste21EngineResult {
  violations: Ste21Violation[];
}

/**
 * Runs STE-2.1 check: no noun cluster longer than 3 words.
 */
export function runSte21Check(doc: TokenizedDocument): Ste21EngineResult {
  const violations: Ste21Violation[] = [];

  for (const sentence of doc.sentences) {
    const docStart = sentence.offsetInDocument.start;
    const sentenceWordCount = sentence.tokens.filter((t) => t.isWord).length;
    const tokens = sentence.tokens;

    let runStart: number | null = null;
    let runTokens: Token[] = [];

    for (let i = 0; i <= tokens.length; i++) {
      const t = tokens[i];
      const inCluster = t?.isWord && isNounClusterPos(t.posHeuristic);

      if (inCluster) {
        if (runStart === null) runStart = i;
        runTokens.push(t);
      } else {
        if (runTokens.length > MAX_NOUN_CLUSTER_WORDS) {
          const first = runTokens[0];
          const last = runTokens[runTokens.length - 1];
          const positionStart = docStart + first.offsetInSentence.start;
          const positionEnd = docStart + last.offsetInSentence.end;
          const excerpt = runTokens.map((x) => x.raw).join(" ");
          violations.push({
            sentenceIndex: sentence.index,
            sentenceExcerpt: sentence.text,
            tokenRaw: excerpt,
            tokenNormalized: excerpt.toLowerCase(),
            positionStart,
            positionEnd,
            ruleId: RULE_ID,
            ruleName: RULE_NAME,
            severity: "major",
            reason: "noun_cluster_too_long",
            suggestion: `Shorten this noun cluster to ${MAX_NOUN_CLUSTER_WORDS} words or fewer (current: ${runTokens.length}). Use a shorter phrase or rephrase.`,
            wordCount: sentenceWordCount,
          });
        }
        runStart = null;
        runTokens = [];
      }
    }
  }

  return { violations };
}
