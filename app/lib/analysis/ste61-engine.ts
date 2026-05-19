/**
 * ADAM — STE-6.1 rule engine (Give information gradually)
 *
 * ASD-STE100 Issue 9 Rule 6.1: Give information gradually.
 *   - Each sentence must have only one subject.
 *   - Start with general information, then give specific information.
 *   - Do not give all information in the first sentence of a paragraph.
 *
 * Two violation patterns (both on DESCRIPTIVE sentences only):
 *
 * Pattern 1 — Overloaded opening sentence with relative clause:
 *   The first sentence of a multi-sentence paragraph is long (≥ 15 words)
 *   AND contains a relative clause ("which" or "that" mid-sentence, or a
 *   "where" clause). Relative clauses pack specific detail into the first
 *   sentence before the reader is oriented, violating "give info gradually."
 *
 *   Non-STE: "The hydraulic system, which controls the landing gear and was
 *             designed for 3000 psi operation, requires monthly inspection."
 *   STE:     "The hydraulic system controls the landing gear.
 *             It operates at 3000 psi. Inspect it every month."
 *
 * Pattern 2 — Multiple coordinated topics in one descriptive sentence:
 *   A descriptive sentence (≥ 15 words) contains two or more "and"/"but"
 *   connectors each flanked by finite-verb-like words — indicating the
 *   sentence contains multiple independent topics.
 *
 *   Non-STE: "The pump operates continuously and the valve regulates flow
 *             and the sensor monitors pressure."
 *   STE:     (three separate sentences, one topic each)
 *
 * Only flags first sentences of multi-sentence paragraphs for Pattern 1
 * (the opening determines whether info is given gradually).
 * Pattern 2 is checked on all descriptive sentences (any position).
 *
 * @see ste64-engine.ts — STE-6.4 (paragraph topic sentence)
 * @see ste65-engine.ts — STE-6.5 (logical order)
 */

import type { TokenizedDocument, Token } from "./types";
import { getParagraphSpans, paragraphIndexForOffset } from "./paragraph";

const RULE_ID   = "STE-6.1";
const RULE_NAME = "Give information gradually";

const MIN_WORDS_OVERLOADED = 15;

/** Finite-verb-like words or patterns indicating a full clause. */
const FINITE_VERBS = new Set([
  "is", "are", "was", "were", "will", "can", "may", "must", "shall",
  "does", "do", "did", "has", "have", "had",
  "operates", "provides", "controls", "requires", "includes", "contains",
  "connects", "allows", "enables", "prevents", "causes", "indicates",
]);

function isDescriptive(words: Token[]): boolean {
  if (words.length === 0) return false;
  const firstPos = words[0]!.posHeuristic ?? "";
  return firstPos.toLowerCase() !== "v";
}

function hasRelativeClause(sentence: { text: string; tokens: Token[] }): boolean {
  const words = sentence.tokens.filter((t) => t.isWord);
  // Look for "which" or "where" appearing after at least the 3rd word token
  for (let i = 2; i < words.length; i++) {
    const norm = words[i].normalized.toLowerCase();
    if (norm === "which" || norm === "where") return true;
    // "that" as relative pronoun: appears after a noun (position ≥ 3, not sentence-initial)
    if (norm === "that" && i >= 3) return true;
  }
  return false;
}

function countAndConnectors(words: Token[]): number {
  let count = 0;
  for (let i = 1; i < words.length - 1; i++) {
    const norm = words[i].normalized.toLowerCase();
    if (norm !== "and" && norm !== "but") continue;
    // Check both surrounding words for verb-like tokens
    const prevNorm = words[i - 1]!.normalized.toLowerCase();
    const nextNorm = words[i + 1]!.normalized.toLowerCase();
    const prevIsVerb =
      FINITE_VERBS.has(prevNorm) ||
      (words[i - 1]!.posHeuristic === "v") ||
      prevNorm.endsWith("s") || prevNorm.endsWith("ed") || prevNorm.endsWith("ing");
    const nextIsVerb =
      FINITE_VERBS.has(nextNorm) ||
      (words[i + 1]!.posHeuristic === "v") ||
      nextNorm.endsWith("s") || nextNorm.endsWith("ed");
    if (prevIsVerb && nextIsVerb) count++;
  }
  return count;
}

export interface Ste61Violation {
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

export interface Ste61EngineResult {
  violations: Ste61Violation[];
}

export function runSte61Check(doc: TokenizedDocument): Ste61EngineResult {
  const violations: Ste61Violation[] = [];
  const spans = getParagraphSpans(doc.sourceText);

  // Build paragraph → sentences map for Pattern 1 (first-sentence detection)
  const byPara = new Map<number, typeof doc.sentences>();
  for (const sentence of doc.sentences) {
    const pi = paragraphIndexForOffset(spans, sentence.offsetInDocument.start);
    if (pi < 0) continue;
    if (!byPara.has(pi)) byPara.set(pi, []);
    byPara.get(pi)!.push(sentence);
  }

  // Track which sentences were already flagged (avoid duplicates)
  const flagged = new Set<number>();

  // ── Pattern 1: Overloaded first sentence with relative clause ────────────
  for (const [, sentences] of byPara) {
    if (sentences.length < 2) continue;
    const ordered = [...sentences].sort((a, b) => a.index - b.index);
    const first   = ordered[0]!;
    const words   = first.tokens.filter((t) => t.isWord);

    if (!isDescriptive(words)) continue;
    if (words.length < MIN_WORDS_OVERLOADED) continue;
    if (!hasRelativeClause(first)) continue;

    flagged.add(first.index);
    violations.push({
      sentenceIndex:   first.index,
      sentenceExcerpt: first.text,
      tokenRaw:        "",
      tokenNormalized: "",
      positionStart:   first.offsetInDocument.start,
      positionEnd:     first.offsetInDocument.end,
      ruleId:          RULE_ID,
      ruleName:        RULE_NAME,
      severity:        "minor",
      reason:          "overloaded_opening_sentence",
      suggestion:
        "This opening sentence is long and contains a relative clause that adds specific detail " +
        "before the reader is oriented (ASD-STE100 Rule 6.1: give information gradually). " +
        "Split it: state the main topic first, then give the detail in a separate sentence.",
      wordCount:       words.length,
    });
  }

  // ── Pattern 2: Multiple coordinated topics in one descriptive sentence ───
  for (const sentence of doc.sentences) {
    if (flagged.has(sentence.index)) continue;

    const words = sentence.tokens.filter((t) => t.isWord);
    if (words.length < MIN_WORDS_OVERLOADED) continue;
    if (!isDescriptive(words)) continue;

    const andCount = countAndConnectors(words);
    if (andCount < 2) continue;

    violations.push({
      sentenceIndex:   sentence.index,
      sentenceExcerpt: sentence.text,
      tokenRaw:        "",
      tokenNormalized: "",
      positionStart:   sentence.offsetInDocument.start,
      positionEnd:     sentence.offsetInDocument.end,
      ruleId:          RULE_ID,
      ruleName:        RULE_NAME,
      severity:        "minor",
      reason:          "multiple_topics_in_sentence",
      suggestion:
        `This sentence appears to contain ${andCount + 1} coordinated topics joined by 'and'/'but' ` +
        `(ASD-STE100 Rule 6.1: each sentence must have only one subject). ` +
        "Split it into separate sentences, one topic each.",
      wordCount: words.length,
    });
  }

  return { violations };
}
