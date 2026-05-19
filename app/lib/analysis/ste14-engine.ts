/**
 * ADAM — STE-1.4 rule engine (Technical noun consistency)
 *
 * ASD-STE100 Issue 9: A technical noun must be used consistently throughout
 * the document. The same part or concept must always be referred to by the
 * same term — including the same capitalisation and spelling.
 *
 * This engine is synchronous and requires no dictionary lookup. It identifies
 * candidate technical nouns by their surface form:
 *
 *   Category A — Acronyms / initialisms
 *     ALL-CAPS tokens of 2–8 uppercase letters (optionally followed by digits).
 *     e.g. LRU, APU, EFIS, LH, FWD, IDG
 *
 *   Category B — Proper-noun-style technical names
 *     Title-Case tokens (first letter uppercase, rest lowercase, 3+ chars)
 *     appearing after the first word position in a sentence.
 *     e.g. Widget, Airbus, Gripen
 *
 * For each unique normalised form (lowercase), the engine records the first
 * raw form seen. Any subsequent occurrence with a different raw form is flagged
 * as a minor consistency violation.
 *
 * Examples that trigger a violation:
 *   "Install the LRU." … "Remove the lru."     (LRU vs lru)
 *   "Check the Widget." … "Remove the widget." (Widget vs widget)
 *
 * @see remaining-ste-rules.md — STE-1.4
 */

import type { TokenizedDocument } from "./types";

const RULE_ID   = "STE-1.11";
const RULE_NAME = "Do not use different technical nouns for the same item";

/** Matches ALL-CAPS acronyms (2–8 uppercase letters, optional trailing digits). */
const ACRONYM_RE = /^[A-Z]{2,8}\d*$/;

/** Matches Title-Case single words (capital + lowercase letters, min 3 chars). */
const TITLE_CASE_RE = /^[A-Z][a-z]{2,}$/;

export interface Ste14Violation {
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

export interface Ste14EngineResult {
  violations: Ste14Violation[];
}

export function runSte14Check(doc: TokenizedDocument): Ste14EngineResult {
  const violations: Ste14Violation[] = [];

  /** Map: normalised form → first raw form seen in the document. */
  const firstSeen = new Map<string, string>();

  for (const sentence of doc.sentences) {
    const docStart  = sentence.offsetInDocument.start;
    const words     = sentence.tokens.filter((t) => t.isWord);
    const wordCount = words.length;

    for (let i = 0; i < words.length; i++) {
      const token = words[i]!;
      const raw   = token.raw;
      const norm  = token.normalized.toLowerCase();

      // Determine if this token looks like a technical noun
      const isAcronym    = ACRONYM_RE.test(raw);
      // Title-case only when NOT the first word (sentence-start capitals are normal)
      const isTitleCase  = i > 0 && TITLE_CASE_RE.test(raw);

      if (!isAcronym && !isTitleCase) continue;

      if (!firstSeen.has(norm)) {
        // Record first usage — no violation
        firstSeen.set(norm, raw);
        continue;
      }

      const firstRaw = firstSeen.get(norm)!;
      if (firstRaw === raw) continue; // consistent — same form as first usage

      // Different raw form for the same normalised technical noun → violation
      violations.push({
        sentenceIndex:   sentence.index,
        sentenceExcerpt: sentence.text,
        tokenRaw:        raw,
        tokenNormalized: norm,
        positionStart:   docStart + token.offsetInSentence.start,
        positionEnd:     docStart + token.offsetInSentence.end,
        ruleId:          RULE_ID,
        ruleName:        RULE_NAME,
        severity:        "minor",
        reason:          "technical_noun_inconsistent_form",
        suggestion:
          `'${raw}' was first written as '${firstRaw}'. ` +
          `Use '${firstRaw}' consistently throughout the document.`,
        wordCount,
      });
    }
  }

  return { violations };
}
