/**
 * ADAM — STE-1.7 rule engine (Technical noun used as a verb)
 *
 * ASD-STE100 Issue 9: Do not use a technical noun as a verb.
 *
 * A technical noun is a word from the equipment nomenclature or industry
 * vocabulary. Using it as a verb makes the instruction ambiguous.
 *
 * Detection strategy — uses the STE dictionary as the source of truth:
 *   For each token where the POS heuristic suggests a verb position, look up
 *   the word in the dictionary. If the dictionary lists it as a NOUN ("n")
 *   only (approved entry with pos === "n"), the word is a technical noun being
 *   used as a verb → violation.
 *
 * Verb positions detected:
 *   1. POS heuristic is "v" (suffix-based: -ed, -ing, -es, common verb stems)
 *   2. First word token of the sentence — typically an imperative verb in STE
 *      procedures. If the first word is dict-approved as a noun, flag it.
 *
 * Exclusions:
 *   - Word not in the dictionary (not a known TN — let STE-1.1 / STE-1.6 handle)
 *   - Word not approved in the dictionary (forbidden word — let STE-1.1 handle)
 *   - Dictionary entry has no pos (cannot confirm it is noun-only)
 *   - Entry pos is not "n" (it is listed as a verb or other POS in STE — allowed)
 *
 * @see remaining-ste-rules.md — STE-1.7
 */

import type { TokenizedDocument } from "./types";
import type { DictionaryLookup } from "./ste11-types";

const RULE_ID   = "STE-1.7";
const RULE_NAME = "Technical noun used as verb";

export interface Ste17Violation {
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

export interface Ste17EngineResult {
  violations: Ste17Violation[];
}

export async function runSte17Check(
  doc: TokenizedDocument,
  lookup: DictionaryLookup,
): Promise<Ste17EngineResult> {
  const violations: Ste17Violation[] = [];

  for (const sentence of doc.sentences) {
    const docStart  = sentence.offsetInDocument.start;
    const words     = sentence.tokens.filter((t) => t.isWord);
    const wordCount = words.length;

    for (let i = 0; i < words.length; i++) {
      const token = words[i]!;
      const norm  = token.normalized.toLowerCase();

      if (!norm || norm.length < 2) continue;
      if (/^\d+$/.test(norm)) continue;

      // Determine if this token is in a verb position
      const isFirstWord         = i === 0;
      const posIsVerb           = token.posHeuristic === "v";
      const inVerbPosition      = isFirstWord || posIsVerb;

      if (!inVerbPosition) continue;

      // Look up in the STE dictionary
      const entry = await lookup(norm);

      // If not in dictionary → STE-1.1 / STE-1.6 handle it, not our concern here
      if (entry === null) continue;

      // If the word is forbidden → STE-1.1 handles it
      if (!entry.approved) continue;

      // Dictionary entry must have a pos to proceed
      if (!entry.pos) continue;

      // Only flag when the dictionary lists this word exclusively as a NOUN
      if (entry.pos.toLowerCase() !== "n") continue;

      violations.push({
        sentenceIndex:   sentence.index,
        sentenceExcerpt: sentence.text,
        tokenRaw:        token.raw,
        tokenNormalized: norm,
        positionStart:   docStart + token.offsetInSentence.start,
        positionEnd:     docStart + token.offsetInSentence.end,
        ruleId:          RULE_ID,
        ruleName:        RULE_NAME,
        severity:        "major",
        reason:          "technical_noun_as_verb",
        suggestion:
          `'${token.raw}' is listed in the STE dictionary as a noun (technical noun). ` +
          "Do not use it as a verb. Use an approved STE verb to describe the action instead " +
          "(e.g. install, attach, remove, connect, fasten, secure, apply).",
        wordCount,
      });
    }
  }

  return { violations };
}
