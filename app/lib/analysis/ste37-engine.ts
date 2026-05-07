/**
 * ADAM — STE-3.7 rule engine (Phrasal verbs — Verb topic)
 *
 * ASD-STE100 Issue 9: Do not use phrasal verbs (verb + particle combinations).
 * Use a single approved STE verb instead.
 *
 * Note: STE-9.3 covers the same concept under the References topic with a small list.
 * This engine owns a larger list and emits violations under rule "STE-3.7".
 * The two engines can coexist — their violations carry different ruleIds.
 *
 * Skips "make sure" (an approved STE expression).
 *
 * @see remaining-ste-rules.md — STE-3.7
 */

import type { TokenizedDocument } from "./types";

const RULE_ID = "STE-3.7";
const RULE_NAME = "Phrasal verb";

/**
 * [verb, particle, suggestion for replacement]
 * All entries are normalized lowercase.
 */
const PHRASAL_PAIRS: [string, string, string][] = [
  // Installation / removal
  ["set",    "up",      "Use 'install' or 'configure' instead of 'set up'."],
  ["take",   "off",     "Use 'remove' instead of 'take off'."],
  ["take",   "out",     "Use 'remove' or 'extract' instead of 'take out'."],
  ["put",    "in",      "Use 'install' or 'insert' instead of 'put in'."],
  ["pull",   "out",     "Use 'remove' or 'extract' instead of 'pull out'."],
  ["push",   "in",      "Use 'insert' instead of 'push in'."],
  ["take",   "apart",   "Use 'disassemble' instead of 'take apart'."],
  ["put",    "together","Use 'assemble' instead of 'put together'."],
  // Connection / disconnection
  ["hook",   "up",      "Use 'connect' instead of 'hook up'."],
  ["plug",   "in",      "Use 'connect' instead of 'plug in'."],
  ["cut",    "off",     "Use 'disconnect' or 'remove' instead of 'cut off'."],
  // Activation / deactivation
  ["turn",   "on",      "Use 'start', 'activate', or 'switch on' instead of 'turn on'."],
  ["turn",   "off",     "Use 'stop', 'deactivate', or 'switch off' instead of 'turn off'."],
  ["switch", "on",      "Use 'activate' or 'start' instead of 'switch on'."],
  ["switch", "off",     "Use 'deactivate' or 'stop' instead of 'switch off'."],
  ["shut",   "down",    "Use 'stop' or 'deactivate' instead of 'shut down'."],
  ["break",  "down",    "Use 'fail' instead of 'break down'."],
  // Investigation / verification
  ["find",   "out",     "Use 'determine' or 'identify' instead of 'find out'."],
  ["check",  "out",     "Use 'inspect' or 'examine' instead of 'check out'."],
  ["point",  "out",     "Use 'indicate' instead of 'point out'."],
  // Task execution
  ["carry",  "out",     "Use 'perform' or 'do' instead of 'carry out'."],
  ["leave",  "out",     "Use 'omit' instead of 'leave out'."],
  ["give",   "up",      "Use 'stop' instead of 'give up'."],
  ["cut",    "out",     "Use 'remove' or 'omit' instead of 'cut out'."],
  ["wipe",   "out",     "Use 'remove' or 'clean' instead of 'wipe out'."],
  ["blow",   "out",     "Use 'clean with air' instead of 'blow out'."],
  // Wear / depletion
  ["wear",   "out",     "Use 'deteriorate' or 'become unserviceable' instead of 'wear out'."],
  ["run",    "out",     "Use 'deplete' instead of 'run out'."],
  // Backing up
  ["back",   "up",      "Use 'copy' or 'save' instead of 'back up'."],
  // Locking
  ["lock",   "out",     "Use 'prevent access' or 'isolate' instead of 'lock out'."],
];

export interface Ste37Violation {
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

export interface Ste37EngineResult {
  violations: Ste37Violation[];
}

export function runSte37Check(doc: TokenizedDocument): Ste37EngineResult {
  const violations: Ste37Violation[] = [];

  for (const sentence of doc.sentences) {
    const docStart = sentence.offsetInDocument.start;
    const words = sentence.tokens.filter((t) => t.isWord);
    const wordCount = words.length;

    for (let i = 0; i < words.length - 1; i++) {
      const a = words[i]!;
      const b = words[i + 1]!;
      const na = a.normalized.toLowerCase();
      const nb = b.normalized.toLowerCase();

      // Preserve "make sure" — it is an approved STE expression
      if (na === "make" && nb === "sure") continue;

      for (const [verb, particle, suggestion] of PHRASAL_PAIRS) {
        if (na === verb && nb === particle) {
          violations.push({
            sentenceIndex:   sentence.index,
            sentenceExcerpt: sentence.text,
            tokenRaw:        `${a.raw} ${b.raw}`,
            tokenNormalized: `${na} ${nb}`,
            positionStart:   docStart + a.offsetInSentence.start,
            positionEnd:     docStart + b.offsetInSentence.end,
            ruleId:     RULE_ID,
            ruleName:   RULE_NAME,
            severity:   "minor",
            reason:     "phrasal_verb",
            suggestion,
            wordCount,
          });
          break; // one violation per pair position
        }
      }
    }
  }

  return { violations };
}
