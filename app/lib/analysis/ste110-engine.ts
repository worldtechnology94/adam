/**
 * ADAM — STE-1.10 rule engine (Regional, slang, and jargon words)
 *
 * ASD-STE100 Issue 9 Rule 1.10: Do not use regional expressions, slang, or
 * jargon as technical nouns. These words are not clear to all readers. Use
 * standard technical nouns that are understood internationally.
 *
 * Technical documentation must be understood by readers across countries and
 * industries. Regional terms, informal slang, and specialist jargon violate
 * this principle because they are:
 *   - Understood only in a particular geographic area or trade community
 *   - Informal or colloquial rather than precise
 *   - Not found in international technical standards or the STE dictionary
 *
 * Non-STE (regional):  "During logging operations, attach a choker to the machinery."
 *                       — "choker" is a regional logging-industry term for a cable loop
 * STE:                  "During logging operations, attach a cable to the machinery."
 *
 * Non-STE (jargon):    "Remove your gear from the work area."
 *                       — "gear" as a collective noun for tools/equipment is jargon
 * STE:                  "Remove your tools and equipment from the work area."
 *
 * Non-STE (slang):     "A glitch in the software caused the shutdown."
 *                       — "glitch" is slang; use "fault" or "malfunction"
 * STE:                  "A fault in the software caused the shutdown."
 *
 * Detection: pattern-match a curated list of terms that are known to be
 * regional, slang, or jargon in technical documentation contexts. Each entry
 * specifies the matched term, the reason category, and the STE-approved
 * replacement.
 *
 * Severity: minor (advisory — the writer must confirm the flagged use is
 * actually informal rather than a legitimate technical noun in context).
 *
 * @see ste11-engine.ts — STE-1.1 (approved words)
 * @see ste16-engine.ts — STE-1.6 (unapproved words used as technical nouns)
 */

import type { TokenizedDocument } from "./types";

const RULE_ID   = "STE-1.10";
const RULE_NAME = "Do not use regional, slang, or jargon words as technical nouns";

interface JargonEntry {
  pattern:     RegExp;
  reason:      string;
  label:       string;
  replacement: string;
}

/**
 * Curated list of regional expressions, slang, and jargon that appear in
 * technical documentation and must be replaced with standard technical nouns.
 *
 * Each entry includes:
 *   - pattern   : case-insensitive regex matching the term
 *   - reason    : violation category for reporting
 *   - label     : human-readable label for the matched word/phrase
 *   - replacement: the STE-compliant alternative(s) to suggest
 */
const JARGON_ENTRIES: JargonEntry[] = [

  // ── Slang terms for faults / malfunctions ─────────────────────────────────

  {
    pattern:     /\bglitch(?:es)?\b/gi,
    reason:      "slang_fault_term",
    label:       "glitch",
    replacement: '"fault", "malfunction", or "error"',
  },
  {
    pattern:     /\bsnag(?:s)?\b/gi,
    reason:      "slang_fault_term",
    label:       "snag",
    replacement: '"defect", "fault", or "problem"',
  },
  {
    pattern:     /\bgremlins?\b/gi,
    reason:      "slang_fault_term",
    label:       "gremlin",
    replacement: '"fault" or "intermittent malfunction"',
  },
  {
    pattern:     /\bbug(?:s)?\b/gi,
    reason:      "slang_fault_term",
    label:       "bug",
    replacement: '"fault", "error", or "defect"',
  },

  // ── Generic informal component / equipment names ───────────────────────────

  {
    pattern:     /\bgizmos?\b/gi,
    reason:      "informal_component_name",
    label:       "gizmo",
    replacement: '"device" or the specific component name',
  },
  {
    pattern:     /\bdoohickeys?\b/gi,
    reason:      "informal_component_name",
    label:       "doohickey",
    replacement: "the specific component name",
  },
  {
    pattern:     /\bthingamajigs?\b/gi,
    reason:      "informal_component_name",
    label:       "thingamajig",
    replacement: "the specific component name",
  },
  {
    pattern:     /\bthingamabobs?\b/gi,
    reason:      "informal_component_name",
    label:       "thingamabob",
    replacement: "the specific component name",
  },
  {
    pattern:     /\bthingummys?\b/gi,
    reason:      "informal_component_name",
    label:       "thingummy",
    replacement: "the specific component name",
  },
  {
    pattern:     /\bwhatchamacallits?\b/gi,
    reason:      "informal_component_name",
    label:       "whatchamacallit",
    replacement: "the specific component name",
  },
  {
    pattern:     /\bwotsits?\b/gi,
    reason:      "informal_component_name",
    label:       "wotsit",
    replacement: "the specific component name",
  },
  {
    pattern:     /\bwidgets?\b/gi,
    reason:      "informal_component_name",
    label:       "widget",
    replacement: '"component", "device", or the specific component name',
  },
  {
    pattern:     /\bgadgets?\b/gi,
    reason:      "informal_component_name",
    label:       "gadget",
    replacement: '"device", "tool", or the specific component name',
  },

  // ── Engineering slang / workarounds ───────────────────────────────────────

  {
    pattern:     /\bkludge(?:s|d)?\b/gi,
    reason:      "engineering_slang",
    label:       "kludge",
    replacement: '"workaround", "temporary modification", or describe the actual solution',
  },
  {
    pattern:     /\bkluge(?:s|d)?\b/gi,
    reason:      "engineering_slang",
    label:       "kluge",
    replacement: '"workaround", "temporary modification", or describe the actual solution',
  },
  {
    pattern:     /\bjerry[- ]?rig(?:ged|ging|s)?\b/gi,
    reason:      "slang_improvised_repair",
    label:       "jerry-rig",
    replacement: '"improvised repair", "temporary repair", or describe the actual repair method',
  },
  {
    pattern:     /\bjury[- ]?rig(?:ged|ging|s)?\b/gi,
    reason:      "slang_improvised_repair",
    label:       "jury-rig",
    replacement: '"improvised repair", "temporary repair", or describe the actual repair method',
  },
  {
    pattern:     /\bbodge(?:s|d|r|rs)?\b/gi,
    reason:      "slang_poor_repair",
    label:       "bodge",
    replacement: '"temporary repair" or describe the actual repair method',
  },
  {
    pattern:     /\bbodge\s+job\b/gi,
    reason:      "slang_poor_repair",
    label:       "bodge job",
    replacement: '"improper repair", "temporary repair", or describe the actual method',
  },
  {
    pattern:     /\bhack(?:s)?\b(?!\s*(?:saw|-saw|s?aw|ing|ed|er\b|work))/gi,
    reason:      "slang_workaround",
    label:       "hack",
    replacement: '"workaround", "modification", or describe the actual method',
  },

  // ── Regional technical terms (industry-specific, not internationally clear) ─

  {
    pattern:     /\bchokers?\b/gi,
    reason:      "regional_term",
    label:       "choker",
    replacement: '"cable" or the specific cable type (e.g. "wire rope loop")',
  },
  {
    pattern:     /\bdonkey\s+engine\b/gi,
    reason:      "regional_term",
    label:       "donkey engine",
    replacement: '"auxiliary engine" or the specific engine type',
  },
  {
    pattern:     /\bcat\s+(?:track|crawler)\b/gi,
    reason:      "regional_term",
    label:       "cat track / cat crawler",
    replacement: '"crawler track" or "crawler undercarriage"',
  },

  // ── IT / software slang ───────────────────────────────────────────────────

  {
    // "brick" as IT slang: render a device permanently non-functional
    pattern:     /\bbrick(?:s|ed|ing)?\s+(?:the|a|an|your|this|that|these|those)\b/gi,
    reason:      "slang_IT_term",
    label:       "brick (verb)",
    replacement: '"render non-functional", "disable permanently", or describe the specific damage',
  },
  {
    pattern:     /\bjailbreak(?:s|ed|ing)?\b/gi,
    reason:      "slang_IT_term",
    label:       "jailbreak",
    replacement: '"bypass security restrictions" or "remove access controls"',
  },

  // ── Informal collective nouns for equipment / material ─────────────────────

  {
    // "gear" as a collective noun for tools/equipment, not a mechanical gear.
    // Only flag when followed by "from", "to", "and", possessive, or end-of-clause —
    // i.e. when it acts as a collective mass noun, not a count noun referring
    // to a specific mechanical component ("the gear", "a gear", "3 gears").
    pattern:     /\byour\s+gear\b|\btheir\s+gear\b|\bour\s+gear\b|\bmy\s+gear\b|\ball\s+(?:the\s+)?gear\b|\bpack(?:ing|ed)?\s+(?:up\s+)?(?:your\s+|the\s+)?gear\b/gi,
    reason:      "jargon_collective_noun",
    label:       "gear (collective)",
    replacement: '"tools and equipment", "equipment", or list the specific items',
  },
  {
    pattern:     /\brig(?:s)?\b(?!\s*(?:id|ging|ged|ger|ging\b))/gi,
    reason:      "jargon_collective_noun",
    label:       "rig",
    replacement: '"equipment", "apparatus", "assembly", or the specific system name',
  },
  {
    // "kit" as informal for "set of tools/equipment" (not a manufactured kit with a part number)
    pattern:     /\b(?:your|the|a|our|their)\s+kit\b|\bfield\s+kit\b|\brepair\s+kit\b|\btool\s+kit\b/gi,
    reason:      "jargon_collective_noun",
    label:       "kit (informal equipment set)",
    replacement: '"tool set", "equipment set", "repair set", or list the specific items',
  },
];

export interface Ste110Violation {
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

export interface Ste110EngineResult {
  violations: Ste110Violation[];
}

export function runSte110Check(doc: TokenizedDocument): Ste110EngineResult {
  const violations: Ste110Violation[] = [];

  for (const sentence of doc.sentences) {
    const text      = sentence.text;
    const docStart  = sentence.offsetInDocument.start;
    const wordCount = sentence.tokens.filter((t) => t.isWord).length;

    for (const entry of JARGON_ENTRIES) {
      entry.pattern.lastIndex = 0;
      let m: RegExpExecArray | null;

      while ((m = entry.pattern.exec(text)) !== null) {
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
          reason:          entry.reason,
          suggestion:
            `'${matchedText}' is ${entry.reason.includes("regional") ? "a regional expression" : entry.reason.includes("slang") ? "slang" : "jargon"} ` +
            `(ASD-STE100 Rule 1.10: do not use regional, slang, or jargon words as technical nouns — ` +
            `these are not clear to all international readers). ` +
            `Replace '${entry.label}' with ${entry.replacement}.`,
          wordCount,
        });
      }
    }
  }

  return { violations };
}
