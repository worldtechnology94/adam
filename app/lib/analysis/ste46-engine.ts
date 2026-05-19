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

const RULE_ID = "STE-5.4";
const RULE_NAME = "Condition then comma, then instruction";

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

    const words = sentence.tokens.filter((t) => t.isWord);
    if (words.length < MIN_WORDS) continue;

    const start = sentence.offsetInDocument.start;
    const end = sentence.offsetInDocument.end;
    const startsWithSub = SUBORDINATOR_START.test(trimmed);
    let flagged = false;

    // Path 1: subordinator first + no comma + command verb somewhere in sentence
    if (startsWithSub && !trimmed.includes(",") && COMMAND_VERB_IN_TEXT.test(trimmed)) {
      flagged = true;
    }

    // Path 2: imperative command first + "if"-clause appears later (condition after command)
    // Requires at least 3 words before "if" to exclude "Check if..." (indirect question).
    if (!flagged && !startsWithSub) {
      const firstWordRaw = words[0]?.raw ?? "";
      const ifIndex = words.findIndex((w) => w.normalized.toLowerCase() === "if");
      if (COMMAND_VERB_IN_TEXT.test(firstWordRaw) && ifIndex >= 3) {
        flagged = true;
      }
    }

    if (flagged) {
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
        reason: "condition_after_command",
        suggestion: SUGGESTION,
        wordCount: words.length,
      });
    }
  }

  return { violations };
}
