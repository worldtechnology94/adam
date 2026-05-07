/**
 * Shared sentence role classification for STE engines (instructional vs descriptive
 * vs safety-line). Aligns with STE-5 heuristic (verb-first → instructional) and
 * STE-7 warning prefixes.
 *
 * @see docs/extended-rule-coverage-plan.md — Prerequisites P1
 */

import type { Sentence } from "./types";

export type SentenceRole = "instructional" | "descriptive" | "warning_like";

const WARNING_PREFIX = /^\s*(WARNING|CAUTION|DANGER)\s*:/i;

/**
 * Classifies a tokenized sentence for rule engines.
 * - **warning_like:** starts with WARNING:/CAUTION:/DANGER:
 * - **instructional:** first word POS heuristic is verb (`v`)
 * - **descriptive:** otherwise
 */
export function classifySentenceRole(sentence: Sentence): SentenceRole {
  const trimmed = sentence.text.trim();
  if (WARNING_PREFIX.test(trimmed)) return "warning_like";

  const firstWord = sentence.tokens.find((t) => t.isWord);
  if (!firstWord) return "descriptive";
  const pos = (firstWord.posHeuristic ?? "").toLowerCase();
  return pos === "v" ? "instructional" : "descriptive";
}
