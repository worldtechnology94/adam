/**
 * ADAM — STE-3.9 rule engine (Complex verb phrases)
 *
 * ASD-STE100 Issue 9: Use a simple verb, not a complex verb phrase.
 * A complex verb phrase is a verb + noun construction that can be replaced
 * by a single simple verb (e.g. "make a decision" → "decide").
 *
 * Detection: verb token, optional article (a/an/the), noun token.
 * The noun is matched by prefix so inflected forms (decisions, adjustments) are caught.
 *
 * @see remaining-ste-rules.md — STE-3.9
 */

import type { TokenizedDocument } from "./types";

const RULE_ID = "STE-3.9";
const RULE_NAME = "Complex verb phrase";

const ARTICLES = new Set(["a", "an", "the"]);

/**
 * [verb (normalized), noun stem, simple verb suggestion]
 * Noun stem is matched as a prefix of the actual token so plurals/inflections are caught.
 */
const COMPLEX_PHRASES: [string, string, string][] = [
  // make + noun
  ["make", "decision",     "Use 'decide' instead of 'make a decision'."],
  ["make", "adjustment",   "Use 'adjust' instead of 'make an adjustment'."],
  ["make", "correction",   "Use 'correct' instead of 'make a correction'."],
  ["make", "connection",   "Use 'connect' instead of 'make a connection'."],
  ["make", "inspection",   "Use 'inspect' instead of 'make an inspection'."],
  ["make", "measurement",  "Use 'measure' instead of 'make a measurement'."],
  ["make", "modification", "Use 'modify' instead of 'make a modification'."],
  ["make", "replacement",  "Use 'replace' instead of 'make a replacement'."],
  ["make", "selection",    "Use 'select' instead of 'make a selection'."],
  ["make", "record",       "Use 'record' instead of 'make a record'."],
  ["make", "note",         "Use 'note' instead of 'make a note'."],
  // perform + noun
  ["perform", "inspection",   "Use 'inspect' instead of 'perform an inspection'."],
  ["perform", "test",         "Use 'test' instead of 'perform a test'."],
  ["perform", "check",        "Use 'check' instead of 'perform a check'."],
  ["perform", "analysis",     "Use 'analyze' instead of 'perform an analysis'."],
  ["perform", "installation", "Use 'install' instead of 'perform an installation'."],
  ["perform", "removal",      "Use 'remove' instead of 'perform a removal'."],
  ["perform", "calibration",  "Use 'calibrate' instead of 'perform a calibration'."],
  ["perform", "verification", "Use 'verify' instead of 'perform a verification'."],
  // conduct + noun
  ["conduct", "test",            "Use 'test' instead of 'conduct a test'."],
  ["conduct", "inspection",      "Use 'inspect' instead of 'conduct an inspection'."],
  ["conduct", "investigation",   "Use 'investigate' instead of 'conduct an investigation'."],
  ["conduct", "analysis",        "Use 'analyze' instead of 'conduct an analysis'."],
  // give + noun
  ["give", "indication",  "Use 'indicate' instead of 'give an indication'."],
  ["give", "description", "Use 'describe' instead of 'give a description'."],
  ["give", "explanation", "Use 'explain' instead of 'give an explanation'."],
  ["give", "warning",     "Use 'warn' instead of 'give a warning'."],
  // take + noun
  ["take", "measurement", "Use 'measure' instead of 'take a measurement'."],
  ["take", "reading",     "Use 'read' instead of 'take a reading'."],
  ["take", "sample",      "Use 'sample' instead of 'take a sample'."],
  // do + noun
  ["do", "analysis",   "Use 'analyze' instead of 'do an analysis'."],
  ["do", "inspection", "Use 'inspect' instead of 'do an inspection'."],
  ["do", "check",      "Use 'check' instead of 'do a check'."],
  ["do", "test",       "Use 'test' instead of 'do a test'."],
];

export interface Ste39Violation {
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

export interface Ste39EngineResult {
  violations: Ste39Violation[];
}

export function runSte39Check(doc: TokenizedDocument): Ste39EngineResult {
  const violations: Ste39Violation[] = [];

  for (const sentence of doc.sentences) {
    const docStart = sentence.offsetInDocument.start;
    const words = sentence.tokens.filter((t) => t.isWord);
    const wordCount = words.length;

    for (let i = 0; i < words.length; i++) {
      const verbToken = words[i]!;
      const verbNorm = verbToken.normalized.toLowerCase();

      // Quick reject: only process words that appear as verb stems in our list
      // Build a set on first use for O(1) lookups
      const relevantVerbs = VERB_SET;
      if (!relevantVerbs.has(verbNorm)) continue;

      // Determine noun token index: either i+1 (no article) or i+2 (article in between)
      let nounIndex = -1;
      if (i + 1 < words.length) {
        const candidate = words[i + 1]!.normalized.toLowerCase();
        if (ARTICLES.has(candidate)) {
          // Article at i+1 — noun should be at i+2
          if (i + 2 < words.length) {
            nounIndex = i + 2;
          }
        } else {
          // No article — noun should be at i+1
          nounIndex = i + 1;
        }
      }

      if (nounIndex < 0) continue;

      const nounToken = words[nounIndex]!;
      const nounNorm  = nounToken.normalized.toLowerCase();

      // Scan phrase table for a matching (verb, noun-stem) pair
      for (const [verb, nounStem, suggestion] of COMPLEX_PHRASES) {
        if (verbNorm === verb && nounNorm.startsWith(nounStem)) {
          const positionStart = docStart + verbToken.offsetInSentence.start;
          const positionEnd   = docStart + nounToken.offsetInSentence.end;
          const rawPhrase = words
            .slice(i, nounIndex + 1)
            .map((w) => w.raw)
            .join(" ");

          violations.push({
            sentenceIndex:   sentence.index,
            sentenceExcerpt: sentence.text,
            tokenRaw:        rawPhrase,
            tokenNormalized: rawPhrase.toLowerCase(),
            positionStart,
            positionEnd,
            ruleId:     RULE_ID,
            ruleName:   RULE_NAME,
            severity:   "major",
            reason:     "complex_verb_phrase",
            suggestion,
            wordCount,
          });
          break; // one violation per verb token
        }
      }
    }
  }

  return { violations };
}

/** Pre-built set of all verb stems that appear in COMPLEX_PHRASES for fast lookup. */
const VERB_SET: Set<string> = new Set(COMPLEX_PHRASES.map(([v]) => v));
