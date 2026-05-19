/**
 * ADAM — STE-4.1 rule engine (Short and clear sentences)
 *
 * ASD-STE100 Issue 9 Rule 4.1: Write short and clear sentences.
 *   - Each sentence must have only one topic.
 *   - Write accurate sentences. Do not write abstract sentences.
 *
 * Three violation patterns:
 *
 * Pattern 1 — Incomplete/placeholder procedures:
 *   Procedural sentences containing TBD, TBC, or "to be completed/added" markers.
 *   These are unfinished and must be replaced with real content.
 *
 * Pattern 2 — Abstract impersonal constructions:
 *   "It is important/necessary/required/essential to …"
 *   These remove the actor and make the instruction vague. The fix is to
 *   rephrase as a direct imperative: "Make sure that …" or "You must …".
 *
 *   Non-STE: "It is important to check the oil level."
 *   STE:     "Check the oil level."
 *
 * Pattern 3 — Passive negative sentences that obscure who is responsible:
 *   "No X is/are permitted/allowed/required/authorized."
 *   These are abstract and remove the actor.
 *
 *   Non-STE: "No leaks are permitted."
 *   STE:     "Make sure that there are no leaks."
 *
 * Pattern 4 — "There is/are" openers in procedural/descriptive context:
 *   These are impersonal constructions that hide the actor.
 *
 *   Non-STE: "There is a danger of electric shock."
 *   STE:     "Electric shock can occur." or use WARNING label.
 *
 * @see ste41-engine.ts — sentence length check (word count)
 */

import type { Sentence, TokenizedDocument } from "./types";
import { classifySentenceRole } from "./sentence-classifier";

const RULE_ID   = "STE-4.1";
const RULE_NAME = "Write short and clear sentences";

// ── Pattern 1: Incomplete / placeholder markers ───────────────────────────────

const INCOMPLETE_MARKERS =
  /\b(TBD|TBC|TO\s+BE\s+(COMPLETED|DONE|ADDED|CONFIRMED|DETERMINED|DEFINED)|PLACEHOLDER|\[TBD\]|\[TBC\])\b/i;

const IMPERATIVE_OPENER =
  /^(open|close|tighten|loosen|remove|install|check|make|ensure|disconnect|connect|turn|press|pull|push|rotate|set|verify|apply|use|replace|drain|fill|add|clean|inspect|hold|release|lock|unlock|start|stop|reset|clear|cut|move|lift|lower|insert|attach|detach)\b/i;

function isProceduralInstruction(sentence: Sentence): boolean {
  if (classifySentenceRole(sentence) === "warning_like") return false;
  if (classifySentenceRole(sentence) === "instructional") return true;
  return IMPERATIVE_OPENER.test(sentence.text.trim());
}

// ── Pattern 2: Abstract "it is [adjective] to" constructions ─────────────────

const IMPERSONAL_IT_IS =
  /\bit\s+is\s+(important|necessary|required|essential|recommended|advisable|critical|vital|mandatory|imperative)\s+(to|that)\b/i;

// ── Pattern 3: Passive negative "no X is/are permitted/allowed" ──────────────

const PASSIVE_NEGATIVE =
  /\bno\b.{1,40}?\b(is|are|was|were)\s+(permitted|allowed|authorized|authorised|required|acceptable|prohibited)\b/i;

// ── Pattern 4: "There is/are" opener in procedural/descriptive text ──────────

const THERE_IS_OPENER = /^\s*there\s+(is|are|was|were)\b/i;

// ─────────────────────────────────────────────────────────────────────────────

export interface Ste48Violation {
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

export interface Ste48EngineResult {
  violations: Ste48Violation[];
}

export function runSte48Check(doc: TokenizedDocument): Ste48EngineResult {
  const violations: Ste48Violation[] = [];

  for (const sentence of doc.sentences) {
    const trimmed   = sentence.text.trim();
    if (!trimmed) continue;

    const role      = classifySentenceRole(sentence);
    const words     = sentence.tokens.filter((t) => t.isWord);
    const wordCount = words.length;
    const start     = sentence.offsetInDocument.start;
    const end       = sentence.offsetInDocument.end;

    // ── Pattern 1: Placeholder markers (procedural sentences only) ───────
    if (role !== "warning_like" && INCOMPLETE_MARKERS.test(trimmed)) {
      if (isProceduralInstruction(sentence)) {
        violations.push({
          sentenceIndex:   sentence.index,
          sentenceExcerpt: sentence.text,
          tokenRaw:        "",
          tokenNormalized: "",
          positionStart:   start,
          positionEnd:     end,
          ruleId:          RULE_ID,
          ruleName:        RULE_NAME,
          severity:        "minor",
          reason:          "incomplete_procedure_placeholder",
          suggestion:
            "Replace placeholders (TBD, TBC, …) with the completed procedure text, " +
            "or remove this step until the content is known.",
          wordCount,
        });
        continue;
      }
    }

    // ── Pattern 2: "It is important/necessary/required to …" (all contexts) ─
    if (IMPERSONAL_IT_IS.test(trimmed)) {
      const match = trimmed.match(IMPERSONAL_IT_IS);
      const adj   = match?.[1] ?? "important";
      violations.push({
        sentenceIndex:   sentence.index,
        sentenceExcerpt: sentence.text,
        tokenRaw:        match?.[0] ?? "",
        tokenNormalized: (match?.[0] ?? "").toLowerCase(),
        positionStart:   start,
        positionEnd:     end,
        ruleId:          RULE_ID,
        ruleName:        RULE_NAME,
        severity:        "major",
        reason:          "abstract_impersonal_construction",
        suggestion:
          `'It is ${adj} to/that …' is an abstract, impersonal construction (ASD-STE100 Rule 4.1). ` +
          `Rephrase as a direct imperative or clear statement: ` +
          `e.g. 'It is important to check the oil.' → 'Check the oil.'`,
        wordCount,
      });
      continue;
    }

    // ── Pattern 3: "No X is/are permitted/allowed" ───────────────────────
    if (PASSIVE_NEGATIVE.test(trimmed)) {
      const match = trimmed.match(PASSIVE_NEGATIVE);
      violations.push({
        sentenceIndex:   sentence.index,
        sentenceExcerpt: sentence.text,
        tokenRaw:        match?.[0] ?? "",
        tokenNormalized: (match?.[0] ?? "").toLowerCase(),
        positionStart:   start,
        positionEnd:     end,
        ruleId:          RULE_ID,
        ruleName:        RULE_NAME,
        severity:        "major",
        reason:          "abstract_passive_negative",
        suggestion:
          `This is an abstract passive construction (ASD-STE100 Rule 4.1). ` +
          `Rephrase to make the action and responsibility clear: ` +
          `e.g. 'No leaks are permitted.' → 'Make sure that there are no leaks.'`,
        wordCount,
      });
      continue;
    }

    // ── Pattern 4: "There is/are" opener (non-warning context, ≥ 5 words) ─
    if (
      role !== "warning_like" &&
      wordCount >= 5 &&
      THERE_IS_OPENER.test(trimmed)
    ) {
      const match = trimmed.match(THERE_IS_OPENER);
      violations.push({
        sentenceIndex:   sentence.index,
        sentenceExcerpt: sentence.text,
        tokenRaw:        match?.[0]?.trim() ?? "",
        tokenNormalized: (match?.[0] ?? "").trim().toLowerCase(),
        positionStart:   start,
        positionEnd:     end,
        ruleId:          RULE_ID,
        ruleName:        RULE_NAME,
        severity:        "minor",
        reason:          "there_is_impersonal_opener",
        suggestion:
          `'There is/are …' is an impersonal construction that hides the actor ` +
          `(ASD-STE100 Rule 4.1). Rephrase to name the subject directly: ` +
          `e.g. 'There is a risk of fire.' → 'Fire can occur.' ` +
          `or use a WARNING label with a clear command.`,
        wordCount,
      });
    }
  }

  return { violations };
}
