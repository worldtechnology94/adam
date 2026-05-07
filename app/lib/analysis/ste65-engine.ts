/**
 * ADAM — STE-6.5 rule engine (Logical order)
 *
 * ASD-STE100 Issue 9: Write information in the order that the reader needs it.
 * Prerequisites must come before the action that depends on them.
 *
 * Full logical-order analysis requires semantic understanding. This engine
 * detects two heuristic patterns that reliably indicate a potential ordering
 * problem in procedural text:
 *
 * Pattern 1 — "action AFTER prerequisite" stated in wrong order
 *   An imperative sentence (first word is a verb) contains "after" mid-sentence.
 *   e.g. "Remove the panel after you disconnect the power."
 *   The prerequisite (disconnect power) should precede the action (remove panel).
 *
 * Pattern 2 — "before" clause at the end of an imperative sentence
 *   An imperative sentence ends with a "before" clause, meaning the reader
 *   encounters the action before the prerequisite.
 *   e.g. "Install the pump before you close the valve."
 *
 * Both patterns are advisory (minor severity) — the writer must judge whether
 * a real ordering problem exists.
 *
 * @see remaining-ste-rules.md — STE-6.5
 */

import type { TokenizedDocument } from "./types";

const RULE_ID   = "STE-6.5";
const RULE_NAME = "Possible incorrect step order";

export interface Ste65Violation {
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

export interface Ste65EngineResult {
  violations: Ste65Violation[];
}

export function runSte65Check(doc: TokenizedDocument): Ste65EngineResult {
  const violations: Ste65Violation[] = [];

  for (const sentence of doc.sentences) {
    const docStart  = sentence.offsetInDocument.start;
    const words     = sentence.tokens.filter((t) => t.isWord);
    const wordCount = words.length;

    if (wordCount < 4) continue;

    const firstWord = words[0]!;
    const isImperative = firstWord.posHeuristic === "v";
    if (!isImperative) continue; // only check procedural (imperative) sentences

    // ── Pattern 1 ─────────────────────────────────────────────────────────
    // Imperative sentence containing "after" mid-sentence (not as first word)
    for (let i = 1; i < words.length; i++) {
      const w = words[i]!;
      if (w.normalized.toLowerCase() !== "after") continue;

      // Skip if "after" is the last word (dangling, no clause follows)
      if (i === words.length - 1) continue;

      violations.push({
        sentenceIndex:   sentence.index,
        sentenceExcerpt: sentence.text,
        tokenRaw:        w.raw,
        tokenNormalized: "after",
        positionStart:   docStart + w.offsetInSentence.start,
        positionEnd:     docStart + w.offsetInSentence.end,
        ruleId:          RULE_ID,
        ruleName:        RULE_NAME,
        severity:        "minor",
        reason:          "action_before_prerequisite",
        suggestion:
          "The prerequisite described in the 'after' clause should come before this action. " +
          "Consider splitting into two steps: first the prerequisite, then this action.",
        wordCount,
      });
      break; // one violation per sentence for this pattern
    }

    // ── Pattern 2 ─────────────────────────────────────────────────────────
    // "before" appears in the last 4 word tokens → prerequisite at end of sentence
    const tailWords = words.slice(Math.max(0, words.length - 4));
    const beforeToken = tailWords.find(
      (w) => w.normalized.toLowerCase() === "before",
    );

    if (beforeToken) {
      violations.push({
        sentenceIndex:   sentence.index,
        sentenceExcerpt: sentence.text,
        tokenRaw:        beforeToken.raw,
        tokenNormalized: "before",
        positionStart:   docStart + beforeToken.offsetInSentence.start,
        positionEnd:     docStart + beforeToken.offsetInSentence.end,
        ruleId:          RULE_ID,
        ruleName:        RULE_NAME,
        severity:        "minor",
        reason:          "prerequisite_stated_after_action",
        suggestion:
          "The 'before' clause states a prerequisite after the action it applies to. " +
          "Move the prerequisite to a separate earlier step, or start the sentence with " +
          "the 'before' clause: e.g. 'Before you close the valve, install the pump.'",
        wordCount,
      });
    }
  }

  return { violations };
}
