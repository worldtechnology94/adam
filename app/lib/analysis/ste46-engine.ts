/**
 * ADAM — STE-4.6 rule engine (descriptive lead-in + command — comma)
 *
 * ASD-STE100 Issue 9 aligns this pattern with **rule 5.4** (procedures): when you
 * start an instruction with a descriptive statement, divide that statement from
 * the command with a comma. Issue 9 §4 in some catalogs does not list 4.6–4.8;
 * ADAM maps **STE-4.6** to this **lead-in comma** heuristic.
 *
 * Heuristic: subordinate opener (If / When / Before / After / Unless / While) +
 * no comma in the sentence + later imperative-style verb → likely missing comma
 * before the command.
 *
 * @see docs/extended-rule-coverage-plan.md — STE-4.6
 */

import type { TokenizedDocument } from "./types";
import { classifySentenceRole } from "./sentence-classifier";

const RULE_ID = "STE-4.6";
const RULE_NAME = "Descriptive lead-in and command (comma)";

const SUGGESTION =
  "When you start an instruction with a descriptive statement, divide that statement from the command with a comma. Example: When the light is on, open the valve.";

/** Sentence begins with a subordinate clause opener (not necessarily STE-complete grammar). */
const SUBORDINATOR_START = /^(If|When|Before|After|Unless|While)\b/i;

/**
 * Common imperative / command verbs in procedures (subset; extend as needed).
 */
const COMMAND_VERB_IN_TEXT =
  /\b(open|close|remove|install|check|make|ensure|disconnect|connect|turn|press|pull|push|rotate|set|loosen|tighten|verify|apply|use|replace|drain|fill|add|clean|inspect|hold|release|lock|unlock|start|stop|reset|clear|cut|move|lift|lower|insert|attach|detach)\b/i;

const MIN_WORDS = 8;

export interface Ste46Violation {
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

export interface Ste46EngineResult {
  violations: Ste46Violation[];
}

export function runSte46Check(doc: TokenizedDocument): Ste46EngineResult {
  const violations: Ste46Violation[] = [];

  for (const sentence of doc.sentences) {
    const trimmed = sentence.text.trim();
    if (!trimmed) continue;

    if (classifySentenceRole(sentence) === "warning_like") continue;

    if (!SUBORDINATOR_START.test(trimmed)) continue;
    if (trimmed.includes(",")) continue;

    const words = sentence.tokens.filter((t) => t.isWord);
    if (words.length < MIN_WORDS) continue;

    if (!COMMAND_VERB_IN_TEXT.test(trimmed)) continue;

    const start = sentence.offsetInDocument.start;
    const end = sentence.offsetInDocument.end;

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
      reason: "missing_comma_lead_in_command",
      suggestion: SUGGESTION,
      wordCount: words.length,
    });
  }

  return { violations };
}
