/**
 * ADAM — STE-9.2 rule engine (Use each approved word correctly)
 *
 * ASD-STE100 Issue 9 Rule 9.2: Use each approved word (from the STE Controlled
 * Language Dictionary) with its correct meaning and in its correct grammatical
 * function. Do not use a word in a meaning or part-of-speech role different
 * from its approved entry.
 *
 * This engine detects the most common word-level misuses in technical writing:
 *
 * 1. "insure" used where "ensure" is intended
 *      — "insure" = protect against financial risk (insurance)
 *      — "ensure" = make certain that something will happen
 *    Non-STE: "Insure that the valve is closed."
 *    STE:     "Make sure that the valve is closed." / "Ensure that the valve is closed."
 *
 * 2. "assure" used where "ensure" is intended
 *      — "assure" = tell a person not to worry (requires a person as object)
 *      — "ensure" = make certain; does not require a person as object
 *    Non-STE: "Assure that the pressure is correct."
 *    STE:     "Make sure that the pressure is correct."
 *
 * 3. "comprised of" — always wrong; "comprise" means "consist of" (no "of")
 *    Non-STE: "The assembly is comprised of three parts."
 *    STE:     "The assembly consists of three parts." / "The assembly comprises three parts."
 *
 * 4. "utilize" — always replace with the simpler, STE-approved "use"
 *    Non-STE: "Utilize the wrench to tighten the bolt."
 *    STE:     "Use the wrench to tighten the bolt."
 *
 * 5. "prior to" — replace with "before" (simpler, STE-approved)
 *    Non-STE: "Prior to installation, inspect the seals."
 *    STE:     "Before installation, inspect the seals."
 *
 * 6. "subsequent to" — replace with "after"
 *    Non-STE: "Subsequent to the test, record the results."
 *    STE:     "After the test, record the results."
 *
 * 7. "in order to" — replace with "to" (simpler imperative)
 *    Non-STE: "In order to start the engine, press the button."
 *    STE:     "To start the engine, press the button."
 *
 * 8. "due to the fact that" — replace with "because"
 *    Non-STE: "Stop the procedure due to the fact that the pressure dropped."
 *    STE:     "Stop the procedure because the pressure dropped."
 *
 * 9. "in the event that" / "in the event of" — replace with "if"
 *    Non-STE: "In the event that the pump fails, shut off the system."
 *    STE:     "If the pump fails, shut off the system."
 *
 * 10. "impact" used as a verb (not as a noun) — replace with "affect"
 *     Non-STE: "This condition impacts the fuel system."
 *     STE:     "This condition affects the fuel system."
 *
 * 11. "perform" as generic action — use a specific verb instead
 *     Non-STE: "Perform a check of the oil level."
 *     STE:     "Check the oil level."
 *
 * 12. "interface" as a verb — replace with "connect" or "communicate"
 *     Non-STE: "The ECU interfaces with the sensor."
 *     STE:     "The ECU connects to the sensor."
 *
 * Severity: minor (advisory — the writer must verify whether the flagged use is
 * the misused form or the legitimate technical form).
 *
 * @see ste91-engine.ts — STE-9.1 (different sentence construction for clarity)
 */

import type { TokenizedDocument } from "./types";

const RULE_ID   = "STE-9.2";
const RULE_NAME = "Use each approved word correctly";

interface WordRule {
  id:          string;
  pattern:     RegExp;
  reason:      string;
  buildSuggestion: (match: string) => string;
}

const WORD_RULES: WordRule[] = [
  // 1. insure → ensure
  {
    id:      "insure_vs_ensure",
    pattern: /\binsure(?:s|d|ing)?\b/gi,
    reason:  "insure_vs_ensure",
    buildSuggestion: (match) =>
      `'${match}' appears to be used in the sense of "make certain" ` +
      `(ASD-STE100 Rule 9.2: use each word with its correct meaning). ` +
      `'insure' means to protect against financial risk (insurance). ` +
      `Use 'ensure' to mean "make certain that something happens", or ` +
      `rewrite as 'Make sure that …'.`,
  },

  // 2. assure (with non-person object) → ensure / make sure
  {
    id:      "assure_vs_ensure",
    pattern: /\bassure(?:s|d|ing)?\s+(?:that|the|correct|proper|adequate|accurate|complete|sufficient)\b/gi,
    reason:  "assure_vs_ensure",
    buildSuggestion: (match) =>
      `'${match.trim()}' appears to use 'assure' to mean "make certain" ` +
      `(ASD-STE100 Rule 9.2: use each word with its correct meaning). ` +
      `'assure' means to tell a person not to worry (requires a person as the object). ` +
      `Use 'ensure' or 'make sure that' when the object is a fact or condition, not a person.`,
  },

  // 3. comprised of → consists of / comprises
  {
    id:      "comprised_of",
    pattern: /\bcomprised\s+of\b/gi,
    reason:  "comprised_of",
    buildSuggestion: (match) =>
      `'${match}' is grammatically incorrect ` +
      `(ASD-STE100 Rule 9.2: use each word correctly). ` +
      `'Comprise' means "consist of" and does not take 'of': the whole comprises its parts. ` +
      `Replace with 'consists of', 'is composed of', or rewrite using 'comprises' without 'of': ` +
      `e.g. 'The assembly comprises three parts.'`,
  },

  // 4. utilize → use
  {
    id:      "utilize_vs_use",
    pattern: /\butilize(?:s|d|ing)?\b/gi,
    reason:  "utilize_vs_use",
    buildSuggestion: (match) =>
      `'${match}' should be replaced with 'use' ` +
      `(ASD-STE100 Rule 9.2: use the simplest approved word). ` +
      `'utilize' means to use something in a functional or practical way — ` +
      `in technical writing this is almost always the same as 'use'. ` +
      `Replace with 'use' / 'uses' / 'used' as appropriate.`,
  },

  // 5. prior to → before
  {
    id:      "prior_to",
    pattern: /\bprior\s+to\b/gi,
    reason:  "prior_to",
    buildSuggestion: (match) =>
      `'${match}' should be replaced with 'before' ` +
      `(ASD-STE100 Rule 9.2: use the simplest approved word). ` +
      `'prior to' is a formal Latin-derived phrase; STE prefers the single word 'before'.`,
  },

  // 6. subsequent to → after
  {
    id:      "subsequent_to",
    pattern: /\bsubsequent\s+to\b/gi,
    reason:  "subsequent_to",
    buildSuggestion: (match) =>
      `'${match}' should be replaced with 'after' ` +
      `(ASD-STE100 Rule 9.2: use the simplest approved word). ` +
      `'subsequent to' is overly formal; STE prefers the single word 'after'.`,
  },

  // 7. in order to → to
  {
    id:      "in_order_to",
    pattern: /\bin\s+order\s+to\b/gi,
    reason:  "in_order_to",
    buildSuggestion: (match) =>
      `'${match}' should be replaced with 'to' ` +
      `(ASD-STE100 Rule 9.2: use simple, approved constructions). ` +
      `'in order to' adds no meaning over the simple infinitive 'to'. ` +
      `Remove 'in order' and keep only 'to': e.g. 'To start the engine, press the button.'`,
  },

  // 8. due to the fact that → because
  {
    id:      "due_to_fact_that",
    pattern: /\bdue\s+to\s+the\s+fact\s+that\b/gi,
    reason:  "due_to_fact_that",
    buildSuggestion: (match) =>
      `'${match}' should be replaced with 'because' ` +
      `(ASD-STE100 Rule 9.2: use simple, approved constructions). ` +
      `This verbose phrase adds no meaning over the single word 'because'.`,
  },

  // 9a. in the event that → if
  {
    id:      "in_the_event_that",
    pattern: /\bin\s+the\s+event\s+that\b/gi,
    reason:  "in_the_event_that",
    buildSuggestion: (match) =>
      `'${match}' should be replaced with 'if' ` +
      `(ASD-STE100 Rule 9.2: use simple, approved constructions). ` +
      `'in the event that' is a verbose conditional; STE requires the simple word 'if'.`,
  },

  // 9b. in the event of → if
  {
    id:      "in_the_event_of",
    pattern: /\bin\s+the\s+event\s+of\b/gi,
    reason:  "in_the_event_of",
    buildSuggestion: (match) =>
      `'${match}' should be replaced with 'if' ` +
      `(ASD-STE100 Rule 9.2: use simple, approved constructions). ` +
      `'in the event of' is a verbose conditional; STE prefers 'if' followed by a clause.`,
  },

  // 10. impact as verb (followed by article or determiner → acting as a verb on an object)
  {
    id:      "impact_as_verb",
    pattern: /\bimpacts?\s+(?:the|a|an|this|these|those|its|their|our|your)\b/gi,
    reason:  "impact_as_verb",
    buildSuggestion: (match) =>
      `'${match.trim()}' uses 'impact' as a verb ` +
      `(ASD-STE100 Rule 9.2: use each word with its approved grammatical function). ` +
      `In STE, 'impact' is a noun. Use the verb 'affect' to express this idea: ` +
      `e.g. 'This condition affects the fuel system.'`,
  },

  // 11. perform + indefinite article (= verbose action phrase) → use specific verb
  {
    id:      "perform_generic",
    pattern: /\bperform\s+a[n]?\s+\w/gi,
    reason:  "perform_generic",
    buildSuggestion: (match) =>
      `'${match.trim()}' uses 'perform' as a generic action verb ` +
      `(ASD-STE100 Rule 9.2: use each word with its correct meaning). ` +
      `Replace the noun phrase with a direct verb: e.g. replace 'perform a check' ` +
      `with 'check', 'perform an inspection' with 'inspect', ` +
      `'perform a test' with 'test'.`,
  },

  // 12. interface as a verb
  {
    id:      "interface_as_verb",
    pattern: /\binterfaces?\s+(?:with|to|into)\b/gi,
    reason:  "interface_as_verb",
    buildSuggestion: (match) =>
      `'${match.trim()}' uses 'interface' as a verb ` +
      `(ASD-STE100 Rule 9.2: use each word with its approved grammatical function). ` +
      `'interface' is a noun in STE. Use a specific verb such as 'connects to', ` +
      `'communicates with', or 'links to' instead.`,
  },

  // 13. wear (as imperative/action verb for PPE) → put on
  {
    id:      "wear_as_verb",
    pattern: /\bwear(?:s|ing)?\s+(?:protective|safety|appropriate|required|suitable|correct|proper|adequate|personal|eye|hearing|respiratory|chemical|electrical|thermal|all|the|your|a|an)\b/gi,
    reason:  "wear_as_verb",
    buildSuggestion: (match) =>
      `'${match.trim()}' uses 'wear' as an action verb ` +
      `(ASD-STE100 Rule 9.2: use each approved word with its correct meaning). ` +
      `In STE, instructions to don PPE use 'put on': e.g. 'Put on protective clothing.'`,
  },
];

export interface Ste92Violation {
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

export interface Ste92EngineResult {
  violations: Ste92Violation[];
}

export function runSte92Check(doc: TokenizedDocument): Ste92EngineResult {
  const violations: Ste92Violation[] = [];

  for (const sentence of doc.sentences) {
    const text      = sentence.text;
    const docStart  = sentence.offsetInDocument.start;
    const wordCount = sentence.tokens.filter((t) => t.isWord).length;

    for (const rule of WORD_RULES) {
      rule.pattern.lastIndex = 0;
      let m: RegExpExecArray | null;

      while ((m = rule.pattern.exec(text)) !== null) {
        const matchedText = m[0];
        const matchStart  = m.index;
        const matchEnd    = matchStart + matchedText.length;

        violations.push({
          sentenceIndex:   sentence.index,
          sentenceExcerpt: sentence.text,
          tokenRaw:        matchedText,
          tokenNormalized: matchedText.toLowerCase(),
          positionStart:   docStart + matchStart,
          positionEnd:     docStart + matchEnd,
          ruleId:          RULE_ID,
          ruleName:        RULE_NAME,
          severity:        "minor",
          reason:          rule.reason,
          suggestion:      rule.buildSuggestion(matchedText),
          wordCount,
        });
      }
    }
  }

  return { violations };
}
