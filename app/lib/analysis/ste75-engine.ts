/**
 * ADAM — STE-7.5 rule engine (warning content: not reference-only)
 *
 * ASD-STE100 Issue 9 (STEMG-aligned summary): Safety information must state the
 * hazard or action, not only point elsewhere. Heuristic: WARNING/CAUTION/DANGER
 * body is **only** a cross-reference (See Figure / Refer to Section …) with no
 * other substantive safety wording.
 *
 * @see docs/extended-rule-coverage-plan.md
 */

import type { TokenizedDocument } from "./types";
import { STE7_SAFETY_LABEL_LINE } from "./ste7-patterns";

const RULE_ID = "STE-7.5";
const RULE_NAME = "Warnings and cautions";

const SUGGESTION =
  "State the hazard or required action in the safety line itself; do not use only a figure/section reference without a clear safety instruction or risk wording.";

/**
 * Body is only a pointer to a figure/table/section (no Do not / risk / imperative).
 */
const REFERENCE_ONLY_BODY =
  /^\s*(?:see|refer to)\s+(?:fig(?:ure|\.?)?|table|section)\s+[\w.-]+\s*\.?\s*$/i;

export interface Ste75Violation {
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

export interface Ste75EngineResult {
  violations: Ste75Violation[];
}

export function runSte75Check(doc: TokenizedDocument): Ste75EngineResult {
  const violations: Ste75Violation[] = [];

  for (const sentence of doc.sentences) {
    const trimmed = sentence.text.trim();
    if (!trimmed) continue;

    const m = trimmed.match(STE7_SAFETY_LABEL_LINE);
    if (!m) continue;

    const body = (m[2] ?? "").trim();
    if (!body) continue;

    if (!REFERENCE_ONLY_BODY.test(body)) continue;

    const start = sentence.offsetInDocument.start;
    const end = sentence.offsetInDocument.end;
    const sentenceWordCount = sentence.tokens.filter((t) => t.isWord).length;

    violations.push({
      sentenceIndex: sentence.index,
      sentenceExcerpt: sentence.text,
      tokenRaw: "",
      tokenNormalized: "",
      positionStart: start,
      positionEnd: end,
      ruleId: RULE_ID,
      ruleName: RULE_NAME,
      severity: "minor",
      reason: "reference_only_safety_line",
      suggestion: SUGGESTION,
      wordCount: sentenceWordCount,
    });
  }

  return { violations };
}
