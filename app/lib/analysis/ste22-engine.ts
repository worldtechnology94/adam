/**
 * ADAM — STE-2.2 rule engine (Noun cluster clarity)
 *
 * ASD-STE100 Issue 9: When possible, use a preposition or a different structure
 * to make the relationship between the words in a noun cluster clear.
 *
 * STE-2.1 prohibits noun clusters longer than 3 words (hard violation).
 * STE-2.2 is an advisory for clusters of EXACTLY 3 words: the cluster is
 * within the STE length limit but may still be ambiguous, and the writer
 * should consider whether a preposition would make the meaning clearer.
 *
 * Detection: uses the same NOUN_CLUSTER_POS set as STE-2.1
 * (art, adj, n — matched by posHeuristic). A run of exactly 3 such tokens
 * is flagged as a minor advisory when it contains at least 2 tokens whose
 * posHeuristic is NOT "art" (i.e. at least 2 content modifiers or nouns
 * that could benefit from a preposition to clarify their relationship).
 *
 * Note: runs of 4+ are already flagged by STE-2.1 — this engine only fires
 * for runs of exactly 3 to prevent duplicate violations.
 *
 * @see ste21-engine.ts — STE-2.1 (max 3-word noun clusters)
 * @see remaining-ste-rules.md — STE-2.2
 */

import type { TokenizedDocument, Token } from "./types";

const RULE_ID   = "STE-2.2";
const RULE_NAME = "Multi-word noun — use a shorter form or hyphens if more than three words";

const NOUN_CLUSTER_POS = new Set(["art", "adj", "n"]);
const EXACT_CLUSTER_SIZE = 3;

function isNounClusterPos(pos: string | undefined): boolean {
  return pos != null && NOUN_CLUSTER_POS.has(pos.toLowerCase());
}

export interface Ste22Violation {
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

export interface Ste22EngineResult {
  violations: Ste22Violation[];
}

export function runSte22Check(doc: TokenizedDocument): Ste22EngineResult {
  const violations: Ste22Violation[] = [];

  for (const sentence of doc.sentences) {
    const docStart  = sentence.offsetInDocument.start;
    const wordCount = sentence.tokens.filter((t) => t.isWord).length;
    const tokens    = sentence.tokens;

    let runTokens: Token[] = [];

    for (let i = 0; i <= tokens.length; i++) {
      const t         = tokens[i];
      const inCluster = t?.isWord && isNounClusterPos(t.posHeuristic);

      if (inCluster) {
        runTokens.push(t!);
      } else {
        if (runTokens.length === EXACT_CLUSTER_SIZE) {
          // Only flag when at least 2 of the 3 tokens are content words (not articles)
          const contentCount = runTokens.filter(
            (w) => w.posHeuristic !== "art",
          ).length;

          if (contentCount >= 2) {
            const first = runTokens[0]!;
            const last  = runTokens[runTokens.length - 1]!;
            const raw   = runTokens.map((w) => w.raw).join(" ");

            violations.push({
              sentenceIndex:   sentence.index,
              sentenceExcerpt: sentence.text,
              tokenRaw:        raw,
              tokenNormalized: raw.toLowerCase(),
              positionStart:   docStart + first.offsetInSentence.start,
              positionEnd:     docStart + last.offsetInSentence.end,
              ruleId:          RULE_ID,
              ruleName:        RULE_NAME,
              severity:        "minor",
              reason:          "noun_cluster_potentially_unclear",
              suggestion:
                `Consider using a preposition to clarify the relationship in '${raw}'. ` +
                "For example, 'engine oil temperature' could become " +
                "'temperature of the engine oil' or 'engine-oil temperature'.",
              wordCount,
            });
          }
        }
        runTokens = [];
      }
    }
  }

  return { violations };
}
