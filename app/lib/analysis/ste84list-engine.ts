/**
 * ADAM — STE-8.4 rule engine (Colon before a vertical list)
 *
 * ASD-STE100 Issue 9 Rule 8.4: Use a colon (:) at the end of the introductory
 * sentence or phrase that precedes a vertical list.
 *
 * Two complementary requirements:
 *
 * Requirement A — The introductory text MUST be a complete thought.
 *   The text that introduces the list must make sense without the list — it
 *   cannot be a fragmentary lead-in that the list completes grammatically.
 *
 * Requirement B — A colon MUST follow the introductory text.
 *   The last character of the intro line (or the character before the first
 *   list item) must be a colon.
 *
 *   Compliant example:
 *     "Portable fire extinguishers are installed in these areas:
 *      - The cockpit
 *      - The cabin
 *      - The crew rest compartment."
 *
 * Two detectable violation patterns:
 *
 * Violation 1 — Missing colon:
 *   A vertical list is introduced by a line that does NOT end with a colon.
 *
 *   Non-STE: "Check the following components
 *             - Pump
 *             - Valve
 *             - Filter"
 *   STE:     "Check the following components:
 *             - Pump
 *             - Valve
 *             - Filter"
 *
 * Violation 2 — Incomplete introductory phrase:
 *   The intro line ends with a colon but the sentence is grammatically
 *   incomplete without the list (the list continues the sentence rather than
 *   being introduced by it). In STE, the intro must be a COMPLETE thought.
 *
 *   Non-STE: "The components are:
 *             - Pump
 *             - Valve"
 *   STE:     "The assembly consists of the following components:
 *             - Pump
 *             - Valve"
 *   (or write as a sentence: "The components are a pump and a valve.")
 *
 * Detection operates at the source-text level (line by line) since list
 * structure is lost after sentence tokenisation. Violations are mapped back
 * to the nearest sentence for reporting.
 *
 * Vertical list markers recognised:
 *   - Hyphen bullet:        "- Item"  or  "– Item"  or  "— Item"
 *   - Dot bullet:           "• Item"  or  "· Item"
 *   - Asterisk bullet:      "* Item"
 *   - Numbered (decimal):   "1. Item"  or  "1) Item"
 *   - Lettered lower:       "a. Item"  or  "a) Item"  or  "(a) Item"
 *   - Lettered upper:       "A. Item"  or  "A) Item"  or  "(A) Item"
 *
 * @see ste85-engine.ts — STE-8.5 (text in parentheses counts as one word)
 * @see ste43-engine.ts — STE-4.3 (use a vertical list for complex text)
 */

import type { TokenizedDocument, Sentence } from "./types";

const RULE_ID   = "STE-8.4";
const RULE_NAME = "Use a colon before a vertical list";

/**
 * Recognises a line that is a vertical list item.
 * Must be anchored to the start of the trimmed line.
 */
const LIST_ITEM_RE =
  /^\s*(?:[-–—•·*]|\d+[.)]\s|[a-zA-Z][.)]\s|\([a-zA-Z]\)\s*)\s*\S/;

/**
 * Patterns signalling that an introductory phrase is grammatically INCOMPLETE
 * without the list (the list continues the sentence). These are "dangling
 * colon" patterns where the intro cannot stand alone.
 *
 * Examples of incomplete intros:
 *   "The system includes:"   — "includes" is a transitive verb that needs an object
 *   "The options are:"       — "are" is a linking verb that needs a complement
 *   "There are:"             — incomplete clause
 *   "Such as:"               — not a complete sentence at all
 *   "As follows:"            — not a complete sentence
 *   "For example:"           — acceptable only in a NOTE context; otherwise use a sentence
 *   "Including:"             — participial phrase, not a complete sentence
 */
const INCOMPLETE_INTRO_RE =
  /\b(?:is|are|was|were|include[sd]?|includes?|consists?\s+of|comprised?\s+of|consist(?:ing)?\s+of|compris(?:es?|ing)\s+of|follow[s]?|following|such\s+as|as\s+follows|including|of|and|or|to|for|by|at|in|on|with):\s*$/i;

/**
 * Finds the sentence in `sentences` whose document offset range contains the
 * given character `offset`. Falls back to the closest sentence if no exact match.
 */
function findSentenceAtOffset(sentences: Sentence[], offset: number): Sentence | undefined {
  // Exact containment first
  for (const s of sentences) {
    if (offset >= s.offsetInDocument.start && offset < s.offsetInDocument.end) {
      return s;
    }
  }
  // Nearest by end offset (intro line may be after the last sentence's period)
  let nearest: Sentence | undefined;
  let minDist = Infinity;
  for (const s of sentences) {
    const dist = Math.abs(s.offsetInDocument.end - offset);
    if (dist < minDist) { minDist = dist; nearest = s; }
  }
  return nearest;
}

export interface Ste84ListViolation {
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

export interface Ste84ListEngineResult {
  violations: Ste84ListViolation[];
}

export function runSte84ListCheck(doc: TokenizedDocument): Ste84ListEngineResult {
  const violations: Ste84ListViolation[] = [];

  const sourceText = doc.sourceText;
  if (!sourceText) return { violations };

  // Split into lines and compute the start-offset of each line in the document
  const rawLines = sourceText.split("\n");
  const lineStartOffsets: number[] = [];
  let runningOffset = 0;
  for (const line of rawLines) {
    lineStartOffsets.push(runningOffset);
    runningOffset += line.length + 1; // +1 for the '\n'
  }

  /**
   * Find the index of the last non-blank line strictly before lineIdx.
   * Returns -1 if none exists.
   */
  function findIntroLineIdx(firstListItemIdx: number): number {
    for (let i = firstListItemIdx - 1; i >= 0; i--) {
      if (rawLines[i]!.trim().length > 0) return i;
    }
    return -1;
  }

  let i = 0;
  while (i < rawLines.length) {
    const line = rawLines[i]!;

    // Is this line the FIRST item of a new list?
    if (!LIST_ITEM_RE.test(line)) { i++; continue; }
    // Check the previous non-blank line is NOT also a list item (i.e. we are at the start)
    const prevNonBlankIdx = findIntroLineIdx(i);
    if (prevNonBlankIdx >= 0 && LIST_ITEM_RE.test(rawLines[prevNonBlankIdx]!)) { i++; continue; }

    // Skip very short lists (single item) — ambiguous without context
    const nextLine = rawLines[i + 1] ?? "";
    if (!LIST_ITEM_RE.test(nextLine)) { i++; continue; }

    // We have a multi-item list starting at line i.
    // Find and evaluate the introductory line.
    const introIdx = findIntroLineIdx(i);
    if (introIdx < 0) { i++; continue; } // No intro line (list at top of doc)

    const introLine    = rawLines[introIdx]!;
    const introTrimmed = introLine.trim();
    if (introTrimmed.length === 0) { i++; continue; }

    const introOffset = lineStartOffsets[introIdx]!;
    const introSentence = findSentenceAtOffset(doc.sentences, introOffset);
    if (!introSentence) { i++; continue; }

    const sentWordCount = introSentence.tokens.filter((t) => t.isWord).length;

    // ── Violation 1: Missing colon ─────────────────────────────────────────
    if (!introTrimmed.endsWith(":")) {
      violations.push({
        sentenceIndex:   introSentence.index,
        sentenceExcerpt: introSentence.text,
        tokenRaw:        introTrimmed,
        tokenNormalized: introTrimmed.toLowerCase(),
        positionStart:   introOffset,
        positionEnd:     introOffset + introLine.length,
        ruleId:          RULE_ID,
        ruleName:        RULE_NAME,
        severity:        "minor",
        reason:          "missing_colon_before_list",
        suggestion:
          `The line '${introTrimmed}' introduces a vertical list but does not end with a colon ` +
          `(ASD-STE100 Rule 8.4: use a colon at the end of the introductory text before a vertical list). ` +
          `Add a colon at the end: '${introTrimmed}:'. ` +
          `Make sure the introductory text is also a complete sentence or phrase.`,
        wordCount: sentWordCount,
      });

      // Advance past the whole list
      while (i < rawLines.length && LIST_ITEM_RE.test(rawLines[i]!)) i++;
      continue;
    }

    // ── Violation 2: Colon present but introductory phrase is incomplete ──
    if (INCOMPLETE_INTRO_RE.test(introTrimmed)) {
      violations.push({
        sentenceIndex:   introSentence.index,
        sentenceExcerpt: introSentence.text,
        tokenRaw:        introTrimmed,
        tokenNormalized: introTrimmed.toLowerCase(),
        positionStart:   introOffset,
        positionEnd:     introOffset + introLine.length,
        ruleId:          RULE_ID,
        ruleName:        RULE_NAME,
        severity:        "minor",
        reason:          "incomplete_introductory_phrase_before_list",
        suggestion:
          `The introductory phrase '${introTrimmed}' is grammatically incomplete without the list ` +
          `(ASD-STE100 Rule 8.4: the introductory text must be a complete thought — ` +
          `do not use a colon if the list continues the sentence grammatically). ` +
          `Rewrite the introduction as a complete sentence, for example: ` +
          `'The assembly consists of the following components:' instead of 'The components are:'.`,
        wordCount: sentWordCount,
      });
    }

    // Advance past the whole list
    while (i < rawLines.length && LIST_ITEM_RE.test(rawLines[i]!)) i++;
  }

  return { violations };
}
