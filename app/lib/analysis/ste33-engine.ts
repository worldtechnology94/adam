/**
 * ADAM — STE-3.3 rule engine (Gerunds)
 *
 * ASD-STE100 Issue 9: Do not use the -ing form of a verb as a noun (gerund).
 * Gerunds make sentences ambiguous and harder to translate.
 * Use the noun form of the verb or restructure the sentence with a verb.
 *
 * Three detection patterns (conservative — avoids false positives given the
 * project's heuristic POS tagger, which tags -ing words as "v" and plurals as "v"):
 *
 *   Pattern 1 — article + [-ing word] + "of"
 *     "the checking of the valve" — article immediately before -ing, followed by "of"
 *
 *   Pattern 2 — gerund-introducing preposition immediately before [-ing word]
 *     "after installing", "before removing", "by checking", "without connecting"
 *
 *   Pattern 3 — [-ing word] is the first word token of the sentence AND a BE
 *     form appears within the next 5 word tokens (gerund as sentence subject)
 *     "Checking the valve is required."
 *
 * Exclusions (applied before any pattern):
 *   - The -ing word is a known technical noun ending in -ing (e.g. housing, wiring)
 *   - The word immediately before the -ing word is a BE form → progressive tense
 *     ("is checking", "was installing") — these are already handled by STE-3.2
 *
 * @see remaining-ste-rules.md — STE-3.3
 */

import type { TokenizedDocument } from "./types";

const RULE_ID   = "STE-3.5";
const RULE_NAME = "Use the -ing form only as a technical noun or modifier";

const SUGGESTION =
  "Do not use the -ing form of a verb as a noun. " +
  "Rewrite using a verb: e.g. 'The checking of X' → 'Check X' or 'You must check X'; " +
  "'After installing Y' → 'After you install Y'.";

const ING_MIN_LENGTH = 5; // excludes "ring", "king", "sing", "wing" (4 chars)

const BE_FORMS = new Set([
  "is", "are", "was", "were", "am", "be", "been", "being",
]);

const ARTICLES = new Set(["a", "an", "the"]);

/**
 * Prepositions that unambiguously introduce gerund phrases in technical writing.
 * Kept intentionally narrow to minimise false positives.
 */
const GERUND_PREPOSITIONS = new Set([
  "after", "before", "by", "without", "upon",
  "of",    // "the process of checking"
  "for",   // "a method for testing"
  "while", // "while operating" (non-STE; STE says "while you operate")
  "when",  // "when doing X" = gerund phrase; correct form is "when you do X"
  "during", // "during testing" → STE prefers "during the test"
]);

/**
 * Words that end in -ing but are common technical nouns in aerospace/defence
 * documentation — these are NOT gerunds and must not be flagged.
 */
const ING_TECHNICAL_NOUNS = new Set([
  "bearing", "housing", "tubing", "wiring", "coupling",
  "fitting", "lining", "coating", "threading", "casing",
  "fairing", "framing", "bracing", "ducting", "routing",
  "mounting", "sealing", "bonding", "shielding", "plating",
  "bushing", "porting", "machining", "tooling", "piping",
]);

export interface Ste33Violation {
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

export interface Ste33EngineResult {
  violations: Ste33Violation[];
}

export function runSte33Check(doc: TokenizedDocument): Ste33EngineResult {
  const violations: Ste33Violation[] = [];

  for (const sentence of doc.sentences) {
    const docStart  = sentence.offsetInDocument.start;
    const words     = sentence.tokens.filter((t) => t.isWord);
    const wordCount = words.length;

    for (let i = 0; i < words.length; i++) {
      const w    = words[i]!;
      const norm = w.normalized.toLowerCase();

      // Must be an -ing word of sufficient length
      if (norm.length < ING_MIN_LENGTH || !norm.endsWith("ing")) continue;

      // Skip known technical noun endings-in-ing
      if (ING_TECHNICAL_NOUNS.has(norm)) continue;

      const prev = i > 0 ? words[i - 1]! : null;
      const prevNorm = prev?.normalized.toLowerCase() ?? "";

      // EXCLUSION: previous word token is a BE form → progressive tense, not a gerund
      // ("is checking", "was installing", "are tightening")
      if (BE_FORMS.has(prevNorm)) continue;

      // ── Pattern 1 ─────────────────────────────────────────────────────────
      // article + [-ing] + "of"   →   "the checking of the valve"
      if (ARTICLES.has(prevNorm)) {
        const next = i + 1 < words.length ? words[i + 1]! : null;
        if (next?.normalized.toLowerCase() === "of") {
          violations.push(buildViolation(sentence, docStart, w, wordCount, "gerund_after_article"));
          continue;
        }
      }

      // ── Pattern 2 ─────────────────────────────────────────────────────────
      // gerund-introducing preposition + [-ing]   →   "after installing"
      if (GERUND_PREPOSITIONS.has(prevNorm)) {
        violations.push(buildViolation(sentence, docStart, w, wordCount, "gerund_after_preposition"));
        continue;
      }

      // ── Pattern 3 ─────────────────────────────────────────────────────────
      // [-ing] is the first word token AND a BE form follows within 5 word tokens
      // "Checking the valve is required."
      if (i === 0) {
        const nextFive = words.slice(1, 6).map((t) => t.normalized.toLowerCase());
        if (nextFive.some((n) => BE_FORMS.has(n))) {
          violations.push(buildViolation(sentence, docStart, w, wordCount, "gerund_as_subject"));
        }
      }
    }
  }

  return { violations };
}

function buildViolation(
  sentence:   { index: number; text: string },
  docStart:   number,
  token:      { raw: string; normalized: string; offsetInSentence: { start: number; end: number } },
  wordCount:  number,
  reason:     string,
): Ste33Violation {
  return {
    sentenceIndex:   sentence.index,
    sentenceExcerpt: sentence.text,
    tokenRaw:        token.raw,
    tokenNormalized: token.normalized.toLowerCase(),
    positionStart:   docStart + token.offsetInSentence.start,
    positionEnd:     docStart + token.offsetInSentence.end,
    ruleId:          RULE_ID,
    ruleName:        RULE_NAME,
    severity:        "major",
    reason,
    suggestion:      SUGGESTION,
    wordCount,
  };
}
