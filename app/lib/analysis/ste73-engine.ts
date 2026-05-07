/**
 * ADAM — STE-7.3 rule engine (risk or possible result explained)
 *
 * ASD-STE100 Issue 9 (summary): Give an explanation to show the risk or possible result.
 *
 * Heuristic: For longer safety lines (WARNING/CAUTION/DANGER), expect vocabulary or
 * structure that points to harm, consequence, or causal explanation. Short lines are
 * exempt. Skips sentences already failing STE-7.2 (weak lead-in).
 *
 * Limitations: Many valid short warnings have no explicit "risk" word; do not flag
 * bodies under MIN_BODY_WORDS. Tune lists from Issue 9 examples in the thesis.
 *
 * @see docs/extended-rule-coverage-plan.md — Phase 1
 */

import type { TokenizedDocument } from "./types";
import { STE7_SAFETY_LABEL_LINE, STE7_WEAK_LEAD_IN } from "./ste7-patterns";

const RULE_ID = "STE-7.3";
const RULE_NAME = "Risk or result explanation";
const SUGGESTION =
  "After the command or condition, add a short explanation that states the risk or possible result (e.g. injury, damage), unless the hazard is obvious in one brief phrase.";

/** Do not analyze very short bodies (often acceptable without extra explanation). */
const MIN_BODY_WORDS = 12;

/** Injury, harm, or outcome vocabulary (extend per domain). */
const RISK_OR_OUTCOME =
  /\b(injur|death|fatal|damage|damages|burn|burns|hurt|hazard|hazards|\brisk\b|danger|explosion|fire|shock|electrocut|pinch|crush|loss|losses|fail|failure|trap|amputat|bleed|bleeding|harm|harmful|unsafe|poison|toxic|fall|falling|collision|entrap|cut\b|cuts\b|strik|strikes|crush|crushed)\w*\b/i;

/** Causal / explanatory connectors often used with outcomes. */
const CAUSE_OR_RESULT =
  /\b(because|cause|causes|caused|result|results|resulting|lead\s+to|leads\s+to|lead\s+to|if\s+you|when\s+you|when\s+the|unless\s+you|may\s+cause|can\s+cause|will\s+cause|could\s+cause)\b/i;

/** Condition-first lines often imply consequence in a follow-on mental model. */
const CONDITION_START = /^\s*(if|when|before|after|unless)\b/i;

function countWords(s: string): number {
  return s
    .trim()
    .split(/\s+/)
    .filter((w) => w.length > 0).length;
}

export interface Ste73Violation {
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

export interface Ste73EngineResult {
  violations: Ste73Violation[];
}

export function runSte73Check(doc: TokenizedDocument): Ste73EngineResult {
  const violations: Ste73Violation[] = [];

  for (const sentence of doc.sentences) {
    const trimmed = sentence.text.trim();
    if (!trimmed) continue;

    const m = trimmed.match(STE7_SAFETY_LABEL_LINE);
    if (!m) continue;

    const body = (m[2] ?? "").trim();
    if (!body) continue;

    if (STE7_WEAK_LEAD_IN.test(body)) continue;

    if (countWords(body) < MIN_BODY_WORDS) continue;

    if (CONDITION_START.test(body)) continue;

    if (RISK_OR_OUTCOME.test(body)) continue;

    if (CAUSE_OR_RESULT.test(body)) continue;

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
      reason: "missing_risk_explanation",
      suggestion: SUGGESTION,
      wordCount: sentenceWordCount,
    });
  }

  return { violations };
}
