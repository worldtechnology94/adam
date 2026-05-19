/**
 * ADAM — STE-10.5 rule engine (Terminology consistency)
 *
 * ASD-STE100 Issue 9: Use the same technical term for the same part, system,
 * or concept throughout the document. Do not use different spellings,
 * capitalizations, or hyphenation patterns for the same technical name.
 *
 * Document-level check. Tracks every capitalised noun token (Title Case or
 * ALL CAPS) that is not sentence-initial. When the same normalised key appears
 * again with a different raw form, a violation is emitted.
 *
 * Normalisation: lowercase + strip hyphens. "Main Landing Gear Door" and
 * "main landing-gear door" share the same key → inconsistency flagged.
 *
 * @see ste101-engine.ts — STE-10.1 (synonym cluster consistency)
 * @see ste14-engine.ts  — STE-1.4  (technical noun form consistency)
 * @see remaining-ste-rules.md — STE-10.5
 */

import type { TokenizedDocument } from "./types";

const RULE_ID   = "STE-9.4";
const RULE_NAME = "Use a consistent style";

const ACRONYM_RE = /^[A-Z]{2,8}\d*$/;
const TITLE_RE   = /^[A-Z][a-z]{2,}/;

function normKey(raw: string): string {
  return raw.toLowerCase().replace(/-/g, "").replace(/\s+/g, "");
}

export interface Ste105Violation {
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

export interface Ste105EngineResult {
  violations: Ste105Violation[];
}

export function runSte105Check(doc: TokenizedDocument): Ste105EngineResult {
  const violations: Ste105Violation[] = [];

  /** Maps normalised key → first seen { rawForm, sentenceIndex } */
  const firstSeen = new Map<string, { rawForm: string; sentenceIndex: number }>();

  for (const sentence of doc.sentences) {
    const docStart  = sentence.offsetInDocument.start;
    const words     = sentence.tokens.filter((t) => t.isWord);
    const wordCount = words.length;

    for (let i = 0; i < words.length; i++) {
      const token = words[i]!;
      const raw   = token.raw;

      // Only track mid-sentence capitalised tokens (not sentence-initial caps)
      const isAcronym    = ACRONYM_RE.test(raw);
      const isTitleCase  = i > 0 && TITLE_RE.test(raw);
      if (!isAcronym && !isTitleCase) continue;

      const key = normKey(raw);
      if (key.length < 3) continue;

      if (!firstSeen.has(key)) {
        firstSeen.set(key, { rawForm: raw, sentenceIndex: sentence.index });
        continue;
      }

      const first = firstSeen.get(key)!;
      if (first.rawForm === raw) continue; // same form — consistent

      violations.push({
        sentenceIndex:   sentence.index,
        sentenceExcerpt: sentence.text,
        tokenRaw:        raw,
        tokenNormalized: key,
        positionStart:   docStart + token.offsetInSentence.start,
        positionEnd:     docStart + token.offsetInSentence.end,
        ruleId:          RULE_ID,
        ruleName:        RULE_NAME,
        severity:        "minor",
        reason:          "inconsistent_technical_term_form",
        suggestion:
          `Use the same form of this technical term throughout. ` +
          `It was first written as '${first.rawForm}'. ` +
          `Change '${raw}' to '${first.rawForm}'.`,
        wordCount,
      });
    }
  }

  return { violations };
}
