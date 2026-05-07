/**
 * ADAM — STE-10.1 rule engine (Word consistency)
 *
 * ASD-STE100 Issue 9: Use the same word for the same thing throughout the document.
 * Do not switch between synonyms for the same concept or action.
 *
 * Document-level check. A curated list of synonym clusters maps each member word
 * to its cluster index. The engine records the first synonym used from each cluster
 * and flags every later occurrence of a DIFFERENT synonym from the same cluster.
 *
 * The synonym clusters are deliberately conservative — only pairs or groups that
 * are near-synonymous in technical procedure writing are included. Ambiguous words
 * (e.g. "fix" = repair vs. secure) are excluded to minimise false positives.
 *
 * @see remaining-ste-rules.md — STE-10.1
 */

import type { TokenizedDocument } from "./types";

const RULE_ID   = "STE-10.1";
const RULE_NAME = "Inconsistent word choice";

/**
 * Each inner array is a cluster of near-synonyms in technical procedure writing.
 * Words within a cluster should not be mixed within the same document.
 * All entries must be unique across ALL clusters (no word in two clusters).
 */
const SYNONYM_CLUSTERS: string[][] = [
  // Removal
  ["remove", "detach", "extract"],
  // Installation
  ["install", "fit", "mount"],
  // Inspection
  ["inspect", "examine"],
  // Fastening (excluding "torque" — it carries a specific force meaning)
  ["tighten", "fasten"],
  // Loosening
  ["loosen", "undo", "unfasten"],
  // Connection
  ["connect", "couple"],
  // Cleaning
  ["clean", "flush", "purge"],
  // Replacement
  ["replace", "substitute"],
  // Lubrication
  ["lubricate", "grease"],
  // Verification
  ["verify", "validate"],
  // Activation
  ["activate", "energise", "energize"],
  // Deactivation
  ["deactivate", "de-energise", "de-energize"],
];

/** Map: normalised word → cluster index. Built once at module load. */
const WORD_TO_CLUSTER: Map<string, number> = new Map();
for (let i = 0; i < SYNONYM_CLUSTERS.length; i++) {
  for (const word of SYNONYM_CLUSTERS[i]!) {
    WORD_TO_CLUSTER.set(word.toLowerCase(), i);
  }
}

export interface Ste101Violation {
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

export interface Ste101EngineResult {
  violations: Ste101Violation[];
}

export function runSte101Check(doc: TokenizedDocument): Ste101EngineResult {
  const violations: Ste101Violation[] = [];

  /** Maps cluster index → first word (normalised) used for that cluster. */
  const clusterFirstWord = new Map<number, string>();

  for (const sentence of doc.sentences) {
    const docStart  = sentence.offsetInDocument.start;
    const words     = sentence.tokens.filter((t) => t.isWord);
    const wordCount = words.length;

    for (const token of words) {
      const norm       = token.normalized.toLowerCase();
      const clusterIdx = WORD_TO_CLUSTER.get(norm);

      if (clusterIdx === undefined) continue;

      if (!clusterFirstWord.has(clusterIdx)) {
        // First time this cluster is encountered — record and continue
        clusterFirstWord.set(clusterIdx, norm);
        continue;
      }

      const firstWord = clusterFirstWord.get(clusterIdx)!;
      if (firstWord === norm) continue; // same word — consistent

      // Different synonym from the same cluster — flag it
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
        reason:          "inconsistent_word_choice",
        suggestion:
          `You already used '${firstWord}' for this concept earlier in the document. ` +
          `Replace '${token.raw}' with '${firstWord}' to maintain consistency throughout.`,
        wordCount,
      });
    }
  }

  return { violations };
}
