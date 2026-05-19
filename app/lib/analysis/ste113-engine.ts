/**
 * ADAM — STE-1.13 rule engine (Technical verbs used as nouns)
 *
 * ASD-STE100 Issue 9 Rule 1.13: Do not use a technical verb as a noun.
 *
 * A word that is approved as a technical verb in the STE Controlled Language
 * Dictionary must not be used as a noun (unless the same word is also approved
 * as a technical noun or dictionary noun). Rewrite the sentence so that the
 * technical verb is used as a verb — not nominalised.
 *
 * This is a form of nominalisation: converting a verb into a noun by using it
 * after an article or after a generic action verb ("perform", "do", "give",
 * "carry out", "complete", "conduct"). Nominalisation weakens the action and
 * hides the subject of the operation.
 *
 *   Non-STE: "Give the hole 0.20-inch ream."
 *             — "ream" is a technical verb; used as a noun here
 *   STE:     "Ream the hole to a 0.20-inch dimension."
 *
 *   Non-STE: "Perform a bleed of the hydraulic system."
 *             — "bleed" is a technical verb; used as a noun here
 *   STE:     "Bleed the hydraulic system."
 *
 *   Non-STE: "Carry out a flush of the fuel lines."
 *   STE:     "Flush the fuel lines."
 *
 *   Non-STE: "Do a purge of the oxygen system before maintenance."
 *   STE:     "Purge the oxygen system before maintenance."
 *
 *   Non-STE: "Complete a deburr of the machined edge."
 *   STE:     "Deburr the machined edge."
 *
 * Detection:
 *   Pattern 1 — Generic-action + article + technical-verb:
 *     (perform|do|give|carry out|complete|conduct|execute|make) + a/an + <verb>
 *     Covers: "perform a bleed", "do a flush", "give a ream", etc.
 *
 *   Pattern 2 — Article + technical-verb + preposition (indicating noun role):
 *     (a|an|the) + <verb> + (of|on|from|to|is|was|will|has|have)
 *     Covers: "a ream of 0.20 inch", "a bleed of the lines", "the flush was completed"
 *
 * The technical verb list is derived from common maintenance and manufacturing
 * verbs in aerospace/defence manuals that are often nominalised incorrectly.
 * It excludes words that are legitimately both nouns and verbs in standard
 * English (e.g. "test", "check", "run", "trial") to reduce false positives.
 *
 * Severity: minor (advisory — confirm that the word is being used as a noun
 * rather than in a legitimate noun sense).
 *
 * @see ste92-engine.ts — STE-9.2 (misused approved words, incl. "perform a check")
 * @see ste39-engine.ts — STE-3.7 (use an approved verb, not a noun, to describe action)
 */

import type { TokenizedDocument } from "./types";

const RULE_ID   = "STE-1.13";
const RULE_NAME = "Do not use technical verbs as nouns";

/**
 * Technical verbs that are frequently nominalised in maintenance documentation.
 * These are words whose primary STE role is as a technical verb; using them
 * as a noun after "perform a ..." or "a ... of ..." is a Rule 1.13 violation.
 *
 * Words excluded from this list (to prevent false positives):
 *   "check", "test", "run", "trial", "inspection" — legitimately both nouns and verbs
 *   "weld", "repair", "overhaul", "service" — also accepted as technical nouns in many standards
 */
const TECHNICAL_VERBS = [
  "bleed",
  "deburr",
  "deice",           // de-ice / deice
  "drain",
  "flush",
  "grind",
  "hone",
  "lap",             // as in "lap a valve seat"
  "lubricate",
  "lube",            // informal but commonly written
  "prime",
  "purge",
  "ream",
  "rivet",
  "rinse",
  "solder",
  "swage",
  "torque",          // "apply a torque" → flag if nominalised: "do a torque"
  "trim",            // "perform a trim" → "trim the component"
] as const;

/** Regex alternation of all technical verb stems. */
const VERB_ALT = TECHNICAL_VERBS
  .map((v) => v.replace(/[-]/g, "[- ]?"))
  .join("|");

/**
 * Pattern 1: generic action verb + article + technical verb (noun use).
 * Covers: "perform a bleed", "do a ream", "give the hole a ream",
 *         "carry out a flush", "conduct a purge", etc.
 */
const GENERIC_ACTION_NOUN_RE = new RegExp(
  `\\b(?:perform|do|give|carry\\s+out|complete|conduct|execute|make)\\s+(?:a|an|the)\\s+(?:${VERB_ALT})\\b`,
  "gi"
);

/**
 * Pattern 2: article + technical verb + preposition/auxiliary (noun role).
 * Covers: "a ream of 0.20 inch", "a bleed of the lines",
 *         "the drain was completed", "a flush is required".
 */
const ARTICLE_VERB_PREP_RE = new RegExp(
  `\\b(?:a|an|the)\\s+(?:${VERB_ALT})\\s+(?:of|on|from|to|into|at|is|are|was|were|will|has|have|should|must|can|may)\\b`,
  "gi"
);

/**
 * Pattern 3: "give [object] a/an [optional modifiers] [technical verb]"
 * Covers: "Give the hole a 0.20-inch ream", "give it a rinse", "give the bore a hone".
 * Allows 0–4 words between "give" and the article to accommodate indirect objects.
 */
const GIVE_OBJECT_ARTICLE_RE = new RegExp(
  `\\bgive\\s+(?:\\S+\\s+){0,4}(?:a|an)\\s+(?:[\\w.-]+\\s+)*(?:${VERB_ALT})\\b`,
  "gi"
);

function extractVerbFromMatch(match: string): string {
  const lower = match.toLowerCase();
  for (const verb of TECHNICAL_VERBS) {
    if (lower.includes(verb)) return verb;
  }
  return match.trim().split(/\s+/).pop() ?? match;
}

export interface Ste113Violation {
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

export interface Ste113EngineResult {
  violations: Ste113Violation[];
}

export function runSte113Check(doc: TokenizedDocument): Ste113EngineResult {
  const violations: Ste113Violation[] = [];

  for (const sentence of doc.sentences) {
    const text      = sentence.text;
    const docStart  = sentence.offsetInDocument.start;
    const wordCount = sentence.tokens.filter((t) => t.isWord).length;

    // Track positions already flagged to avoid double-reporting for overlapping patterns
    const flaggedRanges: Array<[number, number]> = [];

    const flag = (m: RegExpExecArray, reason: string) => {
      const matchStart = m.index;
      const matchEnd   = matchStart + m[0].length;

      // Skip if this range overlaps an already-flagged range
      if (flaggedRanges.some(([s, e]) => matchStart < e && matchEnd > s)) return;
      flaggedRanges.push([matchStart, matchEnd]);

      const verb = extractVerbFromMatch(m[0]);

      violations.push({
        sentenceIndex:   sentence.index,
        sentenceExcerpt: sentence.text,
        tokenRaw:        m[0],
        tokenNormalized: m[0].toLowerCase(),
        positionStart:   docStart + matchStart,
        positionEnd:     docStart + matchEnd,
        ruleId:          RULE_ID,
        ruleName:        RULE_NAME,
        severity:        "minor",
        reason,
        suggestion:
          `'${m[0].trim()}' uses the technical verb '${verb}' as a noun ` +
          `(ASD-STE100 Rule 1.13: do not use a technical verb as a noun — ` +
          `rewrite so that '${verb}' is the main verb of the sentence). ` +
          `For example, replace '${m[0].trim()}' with a direct imperative or active sentence: ` +
          `e.g. '${verb.charAt(0).toUpperCase() + verb.slice(1)} the [component].' ` +
          `This makes the action clear and uses the technical verb correctly.`,
        wordCount,
      });
    };

    // Pattern 1: perform/do/give/... + a/an/the + technical verb
    GENERIC_ACTION_NOUN_RE.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = GENERIC_ACTION_NOUN_RE.exec(text)) !== null) {
      flag(m, "technical_verb_as_noun_generic_action");
    }

    // Pattern 2: article + technical verb + preposition/auxiliary
    ARTICLE_VERB_PREP_RE.lastIndex = 0;
    while ((m = ARTICLE_VERB_PREP_RE.exec(text)) !== null) {
      flag(m, "technical_verb_as_noun_article_prep");
    }

    // Pattern 3: give [object] a/an [optional modifiers] [technical verb]
    GIVE_OBJECT_ARTICLE_RE.lastIndex = 0;
    while ((m = GIVE_OBJECT_ARTICLE_RE.exec(text)) !== null) {
      flag(m, "technical_verb_as_noun_give_object");
    }
  }

  return { violations };
}
