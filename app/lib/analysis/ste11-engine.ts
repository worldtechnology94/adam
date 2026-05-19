/**
 * ADAM — STE-1.1 / STE-1.2 / STE-1.5 rule engine (T2.2 + ruleplan)
 *
 * Given a tokenized document and a dictionary lookup (from ASD-STE_Word.xlsx via DB),
 * flags words that violate:
 * - STE-1.1 (Approved words only): unknown word, or approved but wrong POS → violation.
 * - STE-1.2 (Prohibited words): word in dictionary with approved = false → violation (major) + alternatives.
 * - STE-1.5 (Word forms): approved headword but token form not in allowed forms list → violation (**non-verb** headwords).
 * - STE-3.1 (Dictionary verb forms): same check when dictionary POS is **v** → violation under STE-3.1 (Issue 9 rule 3.1).
 *
 * @see thesisplan.md T2.2 — STE-1.1 engine
 * @see ruleplan.md — STE-1.2, STE-1.5
 * @see adam_dictionary_spec.md §3 — Word-level check algorithm
 */

import type { TokenizedDocument, Token } from "./types";
import type { DictionaryLookup, Ste11Violation, Ste11EngineResult } from "./ste11-types";

const RULE_ID_APPROVED = "STE-1.1";
const RULE_NAME_APPROVED = "Use only approved words in their approved part of speech";
const RULE_ID_PROHIBITED = "STE-1.2";
const RULE_NAME_PROHIBITED = "Use approved words only as their specified part of speech";
const RULE_ID_WORD_FORMS = "STE-1.4";
const RULE_NAME_WORD_FORMS = "Use only approved forms of verbs and adjectives";
const RULE_ID_VERB_FORMS = "STE-3.1";
const RULE_NAME_VERB_FORMS = "Use only dictionary verb forms";

/** Options for the STE-1.1 check. */
export interface Ste11EngineOptions {
  /** If true, compare token posHeuristic to dictionary pos and flag wrong POS. Default true. */
  checkPos?: boolean;
}

/**
 * Returns true if the normalized token should be skipped (e.g. numbers only).
 * Spec §3.1: skip numbers and units; we skip tokens that are purely digits.
 */
function shouldSkipToken(normalized: string): boolean {
  if (!normalized) return true;
  return /^\d+$/.test(normalized);
}

/**
 * Runs the STE-1.1 check on a tokenized document.
 * For each word token: lookup in dictionary; if not found or not approved (or wrong POS), add a violation.
 */
export async function runSte11Check(
  doc: TokenizedDocument,
  lookup: DictionaryLookup,
  options?: Ste11EngineOptions
): Promise<Ste11EngineResult> {
  const checkPos = options?.checkPos !== false;
  const violations: Ste11Violation[] = [];

  for (const sentence of doc.sentences) {
    const docStart = sentence.offsetInDocument.start;
    const sentenceWordCount = sentence.tokens.filter((t) => t.isWord).length;

    for (const token of sentence.tokens) {
      if (!token.isWord || !token.normalized) continue;
      if (shouldSkipToken(token.normalized)) continue;

      const positionStart = docStart + token.offsetInSentence.start;
      const positionEnd = docStart + token.offsetInSentence.end;

      const entry = await lookup(token.normalized);

      if (entry == null) {
        violations.push({
          sentenceIndex: sentence.index,
          sentenceExcerpt: sentence.text,
          tokenRaw: token.raw,
          tokenNormalized: token.normalized,
          positionStart,
          positionEnd,
          ruleId: RULE_ID_APPROVED,
          ruleName: RULE_NAME_APPROVED,
          severity: "major",
          reason: "unknown_word",
          suggestion: "Check spelling or add to custom word list if this is a domain term.",
          wordCount: sentenceWordCount,
        });
        continue;
      }

      if (!entry.approved) {
        const firstAlt = entry.alternatives[0];
        const suggestion = firstAlt
          ? firstAlt.pos
            ? `${firstAlt.word} (${firstAlt.pos})`
            : firstAlt.word
          : "Use an approved alternative.";
        violations.push({
          sentenceIndex: sentence.index,
          sentenceExcerpt: sentence.text,
          tokenRaw: token.raw,
          tokenNormalized: token.normalized,
          positionStart,
          positionEnd,
          ruleId: RULE_ID_PROHIBITED,
          ruleName: RULE_NAME_PROHIBITED,
          severity: "major",
          reason: "forbidden_word",
          suggestion,
          alternatives: entry.alternatives.length > 0 ? entry.alternatives : undefined,
          exampleSte: entry.examples[0]?.ste,
          exampleNonSte: entry.examples[0]?.non_ste,
          wordCount: sentenceWordCount,
        });
        continue;
      }

      if (checkPos && entry.pos != null && entry.pos !== "" && token.posHeuristic && token.posHeuristic !== "unknown") {
        const dictPos = entry.pos.toLowerCase();
        const tokenPos = token.posHeuristic.toLowerCase();
        if (dictPos !== tokenPos) {
          violations.push({
            sentenceIndex: sentence.index,
            sentenceExcerpt: sentence.text,
            tokenRaw: token.raw,
            tokenNormalized: token.normalized,
            positionStart,
            positionEnd,
            ruleId: RULE_ID_APPROVED,
            ruleName: RULE_NAME_APPROVED,
            severity: "major",
            reason: "wrong_pos",
            suggestion: `Use "${entry.word_display ?? entry.word}" as ${dictPos} (dictionary), not as ${tokenPos}.`,
            wordCount: sentenceWordCount,
          });
          continue;
        }
      }

      if (entry.approved && entry.allowedForms != null && entry.allowedForms.length > 0) {
        const tokenNorm = token.normalized.toLowerCase();
        const inList = entry.allowedForms.some((f) => f.toLowerCase() === tokenNorm);
        if (!inList) {
          const formList = entry.allowedForms.slice(0, 8).join(", ") + (entry.allowedForms.length > 8 ? "…" : "");
          const dictPos = entry.pos?.toLowerCase() ?? "";
          const isVerbHeadword = dictPos === "v";
          violations.push({
            sentenceIndex: sentence.index,
            sentenceExcerpt: sentence.text,
            tokenRaw: token.raw,
            tokenNormalized: token.normalized,
            positionStart,
            positionEnd,
            ruleId: isVerbHeadword ? RULE_ID_VERB_FORMS : RULE_ID_WORD_FORMS,
            ruleName: isVerbHeadword ? RULE_NAME_VERB_FORMS : RULE_NAME_WORD_FORMS,
            severity: "major",
            reason: "wrong_form",
            suggestion: `Use an approved form of "${entry.word_display ?? entry.word}". Approved forms: ${formList}.`,
            wordCount: sentenceWordCount,
          });
        }
      }
    }
  }

  const totalWords = doc.totalWordCount;
  const penaltyPerViolation = 5;
  const complianceScore = Math.max(0, Math.min(100, 100 - violations.length * penaltyPerViolation));

  return {
    violations,
    complianceScore,
    totalWordCount: totalWords,
  };
}
