/**
 * ADAM — STE-7.2 rule engine (Safety instruction: clear command or condition first)
 *
 * ASD-STE100 Issue 9 Rule 7.2: Start a safety instruction with a clear and
 * accurate command or condition.
 *
 * A safety statement (WARNING/CAUTION/DANGER) body must begin with either:
 *   (a) A clear COMMAND — an imperative verb (DO NOT, MAKE SURE, ALWAYS, NEVER,
 *       REMOVE, DISCONNECT, CHECK, KEEP, …)
 *   (b) A clear CONDITION — a subordinate clause beginning with IF, WHEN, WHILE,
 *       BEFORE, AFTER, DURING, AS, or UNLESS.
 *
 * Correct examples from ASD-STE100 Issue 9:
 *   WARNING: DO NOT SWALLOW THE SOLVENT.             ← clear command
 *   WARNING: WHILE YOU USE THE SPRAY PAINT, POINT    ← condition first
 *             THE SPRAY AWAY FROM YOUR FACE.
 *
 * Two violation patterns:
 *
 * Pattern 1 — Weak meta-discourse lead-in:
 *   Body starts with phrases like "Note that", "It is important to",
 *   "Please note", "Remember that". These delay the command and reduce impact.
 *
 * Pattern 2 — Declarative opener (noun phrase instead of command or condition):
 *   Body starts with "The …", "A …", "An …", "This …", "These …", "That …",
 *   or "There …". These are declarative statements, not commands or conditions.
 *
 *   Non-STE: "WARNING: The chemical can cause burns."
 *   STE:     "WARNING: DO NOT touch the chemical. Burns can occur."
 *
 * @see ste74-engine.ts — STE-7.2 (vague hedging language in safety text)
 * @see ste7-patterns.ts — shared regex helpers
 */

import type { TokenizedDocument } from "./types";
import { STE7_SAFETY_LABEL_LINE, STE7_WEAK_LEAD_IN } from "./ste7-patterns";

const RULE_ID   = "STE-7.2";
const RULE_NAME = "Start safety instruction with a clear command or condition";

/**
 * Words that, if they start the safety body, indicate it begins with a
 * clear command. DO NOT, MAKE SURE, ALWAYS, NEVER plus common imperatives
 * used in safety text.
 */
const COMMAND_OPENERS =
  /^\s*(do\s+not|make\s+sure|always|never|stop|disconnect|remove|check|inspect|wear|use|keep|ensure|verify|turn|close|open|avoid|prevent|do\b)/i;

/**
 * Condition clause openers (subordinating conjunctions that introduce a
 * condition before the main command).
 */
const CONDITION_OPENERS = /^\s*(if|when|while|before|after|during|as|unless|in\s+the\s+event)\b/i;

/**
 * Declarative noun-phrase openers — body starts with an article, pronoun,
 * or "there", indicating a statement rather than a command or condition.
 */
const DECLARATIVE_NOUN_OPENER =
  /^\s*(the\s+|a\s+|an\s+|this\s+|these\s+|that\s+|those\s+|there\s+(is|are|can|will|may))/i;

export interface Ste72Violation {
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

export interface Ste72EngineResult {
  violations: Ste72Violation[];
}

const SUGGESTION_WEAK_LEAD_IN =
  "Start the safety text with a clear command (e.g. DO NOT …, MAKE SURE …, ALWAYS …) " +
  "or a condition clause (e.g. IF …, WHEN …, WHILE …), not a narrative lead-in.";

const SUGGESTION_DECLARATIVE =
  "This safety statement begins with a declarative noun phrase instead of a command or condition " +
  "(ASD-STE100 Rule 7.2). Start with an imperative (e.g. 'DO NOT touch …', 'MAKE SURE that …') " +
  "or a condition (e.g. 'IF the temperature exceeds …, stop the process.'). " +
  "Move the declarative information to a second sentence after the command.";

export function runSte72Check(doc: TokenizedDocument): Ste72EngineResult {
  const violations: Ste72Violation[] = [];

  for (const sentence of doc.sentences) {
    const trimmed = sentence.text.trim();
    if (!trimmed) continue;

    const m = trimmed.match(STE7_SAFETY_LABEL_LINE);
    if (!m) continue;

    const body = (m[2] ?? "").trim();
    if (!body) continue;

    const start           = sentence.offsetInDocument.start;
    const end             = sentence.offsetInDocument.end;
    const sentenceWordCount = sentence.tokens.filter((t) => t.isWord).length;

    // ── Pattern 1: Weak meta-discourse lead-in ──────────────────────────
    if (STE7_WEAK_LEAD_IN.test(body)) {
      violations.push({
        sentenceIndex:   sentence.index,
        sentenceExcerpt: sentence.text,
        tokenRaw:        "",
        tokenNormalized: "",
        positionStart:   start,
        positionEnd:     end,
        ruleId:          RULE_ID,
        ruleName:        RULE_NAME,
        severity:        "major",
        reason:          "safety_weak_lead_in",
        suggestion:      SUGGESTION_WEAK_LEAD_IN,
        wordCount:       sentenceWordCount,
      });
      continue;
    }

    // ── Pattern 2: Declarative noun-phrase opener ────────────────────────
    // Only flag if the body does NOT start with an approved command or condition
    if (
      !COMMAND_OPENERS.test(body) &&
      !CONDITION_OPENERS.test(body) &&
      DECLARATIVE_NOUN_OPENER.test(body)
    ) {
      violations.push({
        sentenceIndex:   sentence.index,
        sentenceExcerpt: sentence.text,
        tokenRaw:        "",
        tokenNormalized: "",
        positionStart:   start,
        positionEnd:     end,
        ruleId:          RULE_ID,
        ruleName:        RULE_NAME,
        severity:        "major",
        reason:          "safety_declarative_not_command",
        suggestion:      SUGGESTION_DECLARATIVE,
        wordCount:       sentenceWordCount,
      });
    }
  }

  return { violations };
}
