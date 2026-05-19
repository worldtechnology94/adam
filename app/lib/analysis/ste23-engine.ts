/**
 * ADAM — STE-2.3 rule engine (Noun cluster consistency)
 *
 * ASD-STE100 Issue 9: When you use a noun cluster to refer to a specific part
 * or concept, use the same noun cluster throughout the document.
 *
 * Document-level check. Collects every 2-3 word noun cluster detected during
 * tokenisation (using the same NOUN_CLUSTER_POS set as STE-2.1/2.2). For each
 * cluster it stores both the exact word sequence and a sorted-word key (words
 * sorted alphabetically). When two different exact sequences share the same
 * sorted key, the same words are being used in a different order — a likely
 * cluster consistency problem. The second (and subsequent) occurrence is flagged.
 *
 * Example:
 *   "Check the oil pressure gauge."  → cluster "oil pressure gauge"
 *   "Inspect the pressure oil gauge." → cluster "pressure oil gauge"
 *   Sorted key for both: "gauge oil pressure" → inconsistency detected.
 *
 * Severity: minor — advisory, the writer should confirm they mean different things.
 *
 * @see ste21-engine.ts — STE-2.1 (cluster detection logic)
 * @see ste22-engine.ts — STE-2.2 (clarity advisory)
 * @see remaining-ste-rules.md — STE-2.3
 */

import type { TokenizedDocument, Token } from "./types";

const RULE_ID   = "STE-2.2";
const RULE_NAME = "Multi-word noun — use a shorter form or hyphens if more than three words";

const NOUN_CLUSTER_POS = new Set(["art", "adj", "n"]);
const MIN_CLUSTER = 2;
const MAX_CLUSTER = 3;

function isNounClusterPos(pos: string | undefined): boolean {
  return pos != null && NOUN_CLUSTER_POS.has(pos.toLowerCase());
}

interface ClusterRecord {
  exactKey:      string; // normalized words joined in sequence order
  raw:           string; // original raw form of the cluster
  sentenceIndex: number;
  positionStart: number;
  positionEnd:   number;
}

export interface Ste23Violation {
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

export interface Ste23EngineResult {
  violations: Ste23Violation[];
}

export function runSte23Check(doc: TokenizedDocument): Ste23EngineResult {
  const violations: Ste23Violation[] = [];

  // sortedKey → first ClusterRecord seen with that key
  const firstSeen = new Map<string, ClusterRecord>();

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
        const len = runTokens.length;

        if (len >= MIN_CLUSTER && len <= MAX_CLUSTER) {
          // Must include at least one non-article token (real noun/adj content)
          const hasContent = runTokens.some((w) => w.posHeuristic !== "art");
          if (hasContent) {
            const words    = runTokens.map((w) => w.normalized.toLowerCase());
            const exactKey = words.join(" ");
            const sortedKey = [...words].sort().join(" ");
            const raw      = runTokens.map((w) => w.raw).join(" ");
            const first    = runTokens[0]!;
            const last     = runTokens[runTokens.length - 1]!;

            const record: ClusterRecord = {
              exactKey,
              raw,
              sentenceIndex: sentence.index,
              positionStart: docStart + first.offsetInSentence.start,
              positionEnd:   docStart + last.offsetInSentence.end,
            };

            if (!firstSeen.has(sortedKey)) {
              firstSeen.set(sortedKey, record);
            } else {
              const prev = firstSeen.get(sortedKey)!;
              // Only flag when the exact sequence is different (genuinely inconsistent order)
              if (prev.exactKey !== exactKey) {
                violations.push({
                  sentenceIndex:   sentence.index,
                  sentenceExcerpt: sentence.text,
                  tokenRaw:        raw,
                  tokenNormalized: exactKey,
                  positionStart:   record.positionStart,
                  positionEnd:     record.positionEnd,
                  ruleId:          RULE_ID,
                  ruleName:        RULE_NAME,
                  severity:        "minor",
                  reason:          "noun_cluster_inconsistent_order",
                  suggestion:
                    `'${raw}' uses the same words as '${prev.raw}' but in a different order. ` +
                    `Use the same noun cluster consistently — prefer '${prev.raw}' throughout.`,
                  wordCount,
                });
              }
            }
          }
        }

        runTokens = [];
      }
    }
  }

  return { violations };
}
