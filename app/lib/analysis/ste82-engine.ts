/**
 * ADAM — STE-8.2 rule engine (Hyphens for compound modifiers)
 *
 * ASD-STE100 Issue 9 Rule 8.2: Use hyphens (-) to connect words that are
 * directly related.
 *
 * In technical writing, compound modifiers — two or more words functioning
 * together as a single adjective before a noun — must be hyphenated.
 * Without the hyphen, the reader may not recognise that the words form one
 * unit, which can cause ambiguity.
 *
 * Two detectable violation patterns:
 *
 * Pattern 1 — Number + descriptor + noun (numeric compound modifier):
 *   The number and its descriptor together modify the following noun and
 *   must be joined by a hyphen.
 *   Non-STE: "3 way valve"    → STE: "3-way valve"
 *   Non-STE: "4 cylinder engine" → STE: "4-cylinder engine"
 *   Non-STE: "2 speed gearbox"   → STE: "2-speed gearbox"
 *
 * Pattern 2 — Common compound adjective pairs used as pre-nominal modifiers:
 *   Established technical compounds that consistently require a hyphen when
 *   they precede a noun (detected by verifying that another word follows).
 *   Non-STE: "high pressure valve"      → STE: "high-pressure valve"
 *   Non-STE: "low temperature grease"   → STE: "low-temperature grease"
 *   Non-STE: "long term maintenance"    → STE: "long-term maintenance"
 *   Non-STE: "double acting cylinder"   → STE: "double-acting cylinder"
 *
 * @see ste81-engine.ts — STE-8.1 (sentence simplicity)
 * @see ste87-engine.ts — STE-8.1 (em dash as clause joiner)
 */

import type { TokenizedDocument } from "./types";

const RULE_ID   = "STE-8.2";
const RULE_NAME = "Use hyphens to connect directly related words";

// ── Pattern 1: Number + descriptor word ──────────────────────────────────────

/**
 * Descriptor words that, when immediately preceded by a number and
 * followed by a noun, must be hyphenated.
 */
const NUMBER_DESCRIPTORS = new Set([
  "way", "phase", "speed", "step", "stage", "cylinder",
  "port", "wheel", "door", "axis", "blade", "pin", "bay",
  "pole", "wire", "core", "fold", "sided", "point",
  "bit", "position", "position", "output", "input",
]);

/**
 * Matches: digit(s) + space + descriptor + space (indicating another word follows = noun).
 * Group 1 = the number, Group 2 = the descriptor.
 */
const NUMERIC_COMPOUND_RE = /\b(\d+)\s+(\w+)\s+[a-z]/gi;

// ── Pattern 2: Fixed compound adjective pairs ─────────────────────────────────

interface CompoundPair {
  pattern:    RegExp;
  hyphenated: string;
}

/**
 * Common technical compound modifiers that always require a hyphen when they
 * precede a noun. Each pattern requires another word immediately following
 * (ensured by the trailing `\s+[a-z]` or end-of-string boundary).
 *
 * Case-insensitive because these can appear at any position.
 */
const COMPOUND_PAIRS: CompoundPair[] = [
  { pattern: /\bhigh[\s]+pressure\s+[a-z]/gi,       hyphenated: "high-pressure"       },
  { pattern: /\blow[\s]+pressure\s+[a-z]/gi,         hyphenated: "low-pressure"         },
  { pattern: /\bhigh[\s]+speed\s+[a-z]/gi,           hyphenated: "high-speed"           },
  { pattern: /\blow[\s]+speed\s+[a-z]/gi,            hyphenated: "low-speed"            },
  { pattern: /\bhigh[\s]+temperature\s+[a-z]/gi,     hyphenated: "high-temperature"     },
  { pattern: /\blow[\s]+temperature\s+[a-z]/gi,      hyphenated: "low-temperature"      },
  { pattern: /\bhigh[\s]+voltage\s+[a-z]/gi,         hyphenated: "high-voltage"         },
  { pattern: /\blow[\s]+voltage\s+[a-z]/gi,          hyphenated: "low-voltage"          },
  { pattern: /\bhigh[\s]+frequency\s+[a-z]/gi,       hyphenated: "high-frequency"       },
  { pattern: /\blow[\s]+frequency\s+[a-z]/gi,        hyphenated: "low-frequency"        },
  { pattern: /\blong[\s]+term\s+[a-z]/gi,            hyphenated: "long-term"            },
  { pattern: /\bshort[\s]+term\s+[a-z]/gi,           hyphenated: "short-term"           },
  { pattern: /\bshort[\s]+circuit\s+[a-z]/gi,        hyphenated: "short-circuit"        },
  { pattern: /\bopen[\s]+circuit\s+[a-z]/gi,         hyphenated: "open-circuit"         },
  { pattern: /\bfull[\s]+load\s+[a-z]/gi,            hyphenated: "full-load"            },
  { pattern: /\bhalf[\s]+load\s+[a-z]/gi,            hyphenated: "half-load"            },
  { pattern: /\bdouble[\s]+acting\s+[a-z]/gi,        hyphenated: "double-acting"        },
  { pattern: /\bsingle[\s]+acting\s+[a-z]/gi,        hyphenated: "single-acting"        },
  { pattern: /\bdual[\s]+channel\s+[a-z]/gi,         hyphenated: "dual-channel"         },
  { pattern: /\bsingle[\s]+use\s+[a-z]/gi,           hyphenated: "single-use"           },
  { pattern: /\bfail[\s]+safe\s+[a-z]/gi,            hyphenated: "fail-safe"            },
  { pattern: /\bright[\s]+hand\s+[a-z]/gi,           hyphenated: "right-hand"           },
  { pattern: /\bleft[\s]+hand\s+[a-z]/gi,            hyphenated: "left-hand"            },
  { pattern: /\blight[\s]+duty\s+[a-z]/gi,           hyphenated: "light-duty"           },
  { pattern: /\bheavy[\s]+duty\s+[a-z]/gi,           hyphenated: "heavy-duty"           },
  { pattern: /\bstate[\s]+of[\s]+the[\s]+art\s+[a-z]/gi, hyphenated: "state-of-the-art" },
];

export interface Ste82Violation {
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

export interface Ste82EngineResult {
  violations: Ste82Violation[];
}

export function runSte82Check(doc: TokenizedDocument): Ste82EngineResult {
  const violations: Ste82Violation[] = [];

  for (const sentence of doc.sentences) {
    const docStart  = sentence.offsetInDocument.start;
    const text      = sentence.text;
    const wordCount = sentence.tokens.filter((t) => t.isWord).length;

    // ── Pattern 1: Numeric compound (e.g. "3 way valve") ─────────────────
    NUMERIC_COMPOUND_RE.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = NUMERIC_COMPOUND_RE.exec(text)) !== null) {
      const num        = m[1]!;
      const descriptor = m[2]!.toLowerCase();

      if (!NUMBER_DESCRIPTORS.has(descriptor)) continue;

      // The match includes the trailing character of the next word — don't include it
      const matchText = `${num} ${descriptor}`;
      const matchEnd  = m.index + num.length + 1 + descriptor.length;

      violations.push({
        sentenceIndex:   sentence.index,
        sentenceExcerpt: sentence.text,
        tokenRaw:        matchText,
        tokenNormalized: matchText.toLowerCase(),
        positionStart:   docStart + m.index,
        positionEnd:     docStart + matchEnd,
        ruleId:          RULE_ID,
        ruleName:        RULE_NAME,
        severity:        "minor",
        reason:          "missing_hyphen_numeric_compound",
        suggestion:
          `'${num} ${descriptor}' is a compound modifier and must be hyphenated ` +
          `(ASD-STE100 Rule 8.2): write '${num}-${descriptor}'.`,
        wordCount,
      });
    }

    // ── Pattern 2: Fixed compound adjective pairs ─────────────────────────
    for (const cp of COMPOUND_PAIRS) {
      cp.pattern.lastIndex = 0;
      while ((m = cp.pattern.exec(text)) !== null) {
        // The full match includes the trailing character of the next word.
        // Extract just the compound pair (everything before the trailing space + char).
        const fullMatch = m[0];
        // The trailing character is the last char of the match — strip it.
        const compoundMatch = fullMatch.trimEnd().replace(/\s+[a-z]$/i, "").trim();

        violations.push({
          sentenceIndex:   sentence.index,
          sentenceExcerpt: sentence.text,
          tokenRaw:        compoundMatch,
          tokenNormalized: compoundMatch.toLowerCase(),
          positionStart:   docStart + m.index,
          positionEnd:     docStart + m.index + compoundMatch.length,
          ruleId:          RULE_ID,
          ruleName:        RULE_NAME,
          severity:        "minor",
          reason:          "missing_hyphen_compound_modifier",
          suggestion:
            `'${compoundMatch}' is a compound modifier preceding a noun and must be hyphenated ` +
            `(ASD-STE100 Rule 8.2): write '${cp.hyphenated}'.`,
          wordCount,
        });
      }
    }
  }

  return { violations };
}
