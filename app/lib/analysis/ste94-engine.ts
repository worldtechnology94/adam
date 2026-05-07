/**
 * ADAM — STE-9.4 rule engine (Cross-reference format)
 *
 * ASD-STE100 Issue 9: Cross-references to figures, tables, steps, chapters,
 * sections, and appendices must follow a standard format:
 * the reference word must be spelled out and capitalised.
 *
 * Correct:   "See Figure 1", "Refer to Table 2", "Go to Step 3",
 *            "See Chapter 4", "Refer to Section 1.2", "See Appendix A"
 *
 * Violations detected (two categories):
 *
 * Category A — Abbreviated reference words (always wrong):
 *   "fig. 1", "fig 1", "tbl. 2", "chap. 3", "sec. 4", "sect. 5", "app. A"
 *
 * Category B — Correctly spelled but lowercase reference words:
 *   "figure 1", "table 2", "step 3", "chapter 4", "section 5", "appendix A"
 *
 * Detection is performed on the original sentence text (not normalised) using
 * regular expressions with case-sensitive matching so that capitalised forms
 * (the correct ones) are not flagged.
 *
 * @see ste91-engine.ts — STE-9.1 (cross-reference clarity)
 * @see remaining-ste-rules.md — STE-9.4
 */

import type { TokenizedDocument } from "./types";

const RULE_ID   = "STE-9.4";
const RULE_NAME = "Cross-reference format";

interface RefPattern {
  regex:       RegExp;
  description: string;
  suggestion:  string;
}

const PATTERNS: RefPattern[] = [
  // ── Category A: abbreviated forms ──────────────────────────────────────
  {
    regex:       /\bfig\.?\s+\d/gi,
    description: "Abbreviated figure reference",
    suggestion:  "Use 'Figure N' (capitalised and spelled out) instead of 'fig.' or 'fig'.",
  },
  {
    regex:       /\btbl\.?\s+\d/gi,
    description: "Abbreviated table reference",
    suggestion:  "Use 'Table N' (capitalised and spelled out) instead of 'tbl.'.",
  },
  {
    regex:       /\bchap\.?\s+\d/gi,
    description: "Abbreviated chapter reference",
    suggestion:  "Use 'Chapter N' (capitalised and spelled out) instead of 'chap.'.",
  },
  {
    regex:       /\bsects?\.?\s+\d/gi,
    description: "Abbreviated section reference",
    suggestion:  "Use 'Section N' (capitalised and spelled out) instead of 'sect.' or 'sec.'.",
  },
  {
    regex:       /\bsec\.?\s+\d/gi,
    description: "Abbreviated section reference",
    suggestion:  "Use 'Section N' (capitalised and spelled out) instead of 'sec.'.",
  },
  {
    regex:       /\bapp\.?\s+[A-Z\d]/gi,
    description: "Abbreviated appendix reference",
    suggestion:  "Use 'Appendix X' (capitalised and spelled out) instead of 'app.'.",
  },
  // ── Category B: correctly spelled but lowercase ─────────────────────────
  // These patterns are case-sensitive: they match only lowercase first letter.
  {
    regex:       /\bfigure\s+\d/g,
    description: "Lowercase figure reference",
    suggestion:  "Capitalise: use 'Figure N', not 'figure N'.",
  },
  {
    regex:       /\btable\s+\d/g,
    description: "Lowercase table reference",
    suggestion:  "Capitalise: use 'Table N', not 'table N'.",
  },
  {
    regex:       /\bstep\s+\d/g,
    description: "Lowercase step reference",
    suggestion:  "Capitalise: use 'Step N', not 'step N'.",
  },
  {
    regex:       /\bchapter\s+\d/g,
    description: "Lowercase chapter reference",
    suggestion:  "Capitalise: use 'Chapter N', not 'chapter N'.",
  },
  {
    regex:       /\bsection\s+\d/g,
    description: "Lowercase section reference",
    suggestion:  "Capitalise: use 'Section N', not 'section N'.",
  },
  {
    regex:       /\bappendix\s+[A-Z\d]/g,
    description: "Lowercase appendix reference",
    suggestion:  "Capitalise: use 'Appendix X', not 'appendix X'.",
  },
];

export interface Ste94Violation {
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

export interface Ste94EngineResult {
  violations: Ste94Violation[];
}

export function runSte94Check(doc: TokenizedDocument): Ste94EngineResult {
  const violations: Ste94Violation[] = [];

  for (const sentence of doc.sentences) {
    const docStart  = sentence.offsetInDocument.start;
    const wordCount = sentence.tokens.filter((t) => t.isWord).length;
    const text      = sentence.text;

    for (const pat of PATTERNS) {
      // Reset lastIndex so the regex is reusable across sentences
      pat.regex.lastIndex = 0;

      let match: RegExpExecArray | null;
      while ((match = pat.regex.exec(text)) !== null) {
        const matchedText = match[0];
        const matchStart  = match.index;
        const matchEnd    = matchStart + matchedText.length;

        violations.push({
          sentenceIndex:   sentence.index,
          sentenceExcerpt: sentence.text,
          tokenRaw:        matchedText.trim(),
          tokenNormalized: matchedText.trim().toLowerCase(),
          positionStart:   docStart + matchStart,
          positionEnd:     docStart + matchEnd,
          ruleId:          RULE_ID,
          ruleName:        RULE_NAME,
          severity:        "minor",
          reason:          "incorrect_cross_reference_format",
          suggestion:      pat.suggestion,
          wordCount,
        });
      }
    }
  }

  return { violations };
}
