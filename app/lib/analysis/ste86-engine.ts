/**
 * ADAM — STE-8.6 rule engine (Abbreviation first-use definition)
 *
 * ASD-STE100 Issue 9 Rule 8.6: Count each of these as one word:
 *   numbers, units of measurement, abbreviations, alphanumeric identifiers,
 *   quoted text, titles/headings/labels, proper nouns.
 *
 * Abbreviations and acronyms are explicitly included in the word-count
 * elements of Rule 8.6. To ensure that abbreviations remain clear (which
 * is central to STE's goal of unambiguous language), abbreviations and
 * acronyms must be defined on their first use in the document:
 *   "Full Spelled-out Form (ABBREVIATION)" or "ABBREVIATION (Full Form)"
 *
 * Violation: An acronym (2–8 consecutive uppercase letters, optionally
 * followed by digits) appears for the first time in the document without
 * being defined — i.e. the same sentence does not contain the pattern
 * "(ACRONYM)" or "ACRONYM (...)" showing the expanded form.
 *
 *   Non-STE first use: "The ECU controls the fuel injection system."
 *   STE first use:     "The Electronic Control Unit (ECU) controls the fuel
 *                       injection system." (subsequent uses may use ECU alone)
 *
 * Common acronyms that do not need definition in technical STE documents
 * (ASD, STE, NATO, UN, etc.) are excluded from flagging.
 *
 * @see ste102-engine.ts — GR-6 (Latin abbreviations: i.e., e.g., etc.)
 */

import type { TokenizedDocument } from "./types";

const RULE_ID   = "STE-8.6";
const RULE_NAME = "Define abbreviations and acronyms on first use";

/** Acronym pattern: 2-8 consecutive uppercase letters, optionally followed by digits. */
const ACRONYM_RE = /\b([A-Z]{2,8}\d*)\b/g;

/**
 * Definition pattern: the sentence contains "(WORD...)" where the content
 * starts with an uppercase letter (indicating an abbreviation or acronym definition).
 * Group 1: content inside the parentheses.
 */
const DEFINITION_IN_PAREN_RE = /\(([A-Z][^)]{0,30})\)/g;

/**
 * Well-known acronyms that do not require definition in STE technical documents.
 * Also excludes Roman numerals and very common English uppercase words.
 */
const KNOWN_ACRONYMS = new Set([
  // Standards and organisations
  "ASD", "STE", "NATO", "ISO", "ICAO", "FAA", "EASA", "SAE",
  "ATA", "MIL", "IEC", "ANSI", "ASTM", "BSI", "DIN", "EN",
  "UN", "EU", "US", "UK", "USA", "USSR",
  // Very common technical abbreviations already understood universally
  "AC", "DC", "Hz", "RPM", "PSI", "MPH", "KPH", "GPS", "PC",
  "PDF", "HTML", "URL", "ID", "OK", "AM", "PM",
  // Units (already handled by ste107)
  "MM", "CM", "KM", "KG", "KN", "KW", "MW", "PA", "KPA", "MPA",
  "NM", "ML", "RPM",
  // Roman numerals
  "I", "II", "III", "IV", "VI", "VII", "VIII", "IX", "XI", "XII",
  "XIII", "XIV", "XV", "XVI", "XVII", "XVIII", "XIX", "XX",
  // Common single-letter uppercase that aren't acronyms
  "A", "B", "C", "D", "E", "F", "G", "H",
]);

export interface Ste86Violation {
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

export interface Ste86EngineResult {
  violations: Ste86Violation[];
}

export function runSte86Check(doc: TokenizedDocument): Ste86EngineResult {
  const violations: Ste86Violation[] = [];

  /**
   * Document-level tracking:
   * - defined: acronyms already defined (first use included a definition)
   * - seen: acronyms already encountered (whether defined or not)
   */
  const defined = new Set<string>();
  const seen    = new Set<string>();

  for (const sentence of doc.sentences) {
    const text      = sentence.text;
    const docStart  = sentence.offsetInDocument.start;
    const wordCount = sentence.tokens.filter((t) => t.isWord).length;

    // Collect all definition patterns in this sentence
    // "(ACRONYM ...)" or "(Full Form)" — anything in parens starting with uppercase
    const sentenceDefinitions = new Set<string>();
    DEFINITION_IN_PAREN_RE.lastIndex = 0;
    let dm: RegExpExecArray | null;
    while ((dm = DEFINITION_IN_PAREN_RE.exec(text)) !== null) {
      const inner = dm[1]!.trim();
      // If the content in parens IS an acronym itself (all uppercase), record it as defined
      if (/^[A-Z]{2,8}\d*$/.test(inner)) {
        sentenceDefinitions.add(inner);
      }
    }

    // Also: if the sentence contains "ACRONYM (" pattern (acronym followed by paren with full form)
    // we consider the acronym defined. Covered already since the paren content is uppercase too.

    // Collect all acronyms in this sentence and check for first-use without definition
    ACRONYM_RE.lastIndex = 0;
    let m: RegExpExecArray | null;

    while ((m = ACRONYM_RE.exec(text)) !== null) {
      const acronym = m[1]!;

      if (KNOWN_ACRONYMS.has(acronym)) continue;
      if (acronym.length < 2) continue;

      // Check if the sentence itself defines this acronym (either as definition in parens
      // or as a spelled-out-form + (ACRONYM) pattern)
      const definedInThisSentence = sentenceDefinitions.has(acronym);

      if (definedInThisSentence) {
        // Mark as defined for the rest of the document
        defined.add(acronym);
        seen.add(acronym);
        continue;
      }

      if (seen.has(acronym)) {
        // Already seen — if it was defined earlier, no violation; if not, only flag once
        continue;
      }

      // First occurrence, not defined in this sentence → violation
      seen.add(acronym);

      violations.push({
        sentenceIndex:   sentence.index,
        sentenceExcerpt: sentence.text,
        tokenRaw:        acronym,
        tokenNormalized: acronym,
        positionStart:   docStart + m.index,
        positionEnd:     docStart + m.index + acronym.length,
        ruleId:          RULE_ID,
        ruleName:        RULE_NAME,
        severity:        "minor",
        reason:          "abbreviation_not_defined_on_first_use",
        suggestion:
          `'${acronym}' appears for the first time without a definition ` +
          `(ASD-STE100 Rule 8.6: abbreviations are counted as words and must be clear). ` +
          `On first use, write the full spelled-out form followed by the abbreviation in parentheses: ` +
          `e.g. 'Spelled Out Form (${acronym})'. After the first definition, '${acronym}' may ` +
          `be used alone.`,
        wordCount,
      });
    }
  }

  return { violations };
}
