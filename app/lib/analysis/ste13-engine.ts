/**
 * ADAM — STE-1.3 rule engine (approved meanings / dictionary sense rows)
 *
 * Uses pattern rules in `ste-meaning-patterns.ts` plus `DictionaryLookupResult.meanings`
 * to flag likely wrong senses only when STE-1.1 would not already flag the token
 * (unknown, forbidden, wrong POS, wrong form are skipped per missing-dic-driven.md).
 *
 * @see missing-dic-driven.md — Phase 2, Phase 5 (precedence vs STE-1.1)
 */

import type { TokenizedDocument, Token } from "./types";
import type { DictionaryLookup, DictionaryLookupResult, SteMeaningRow } from "./ste11-types";
import { STE_MEANING_PATTERNS } from "./ste-meaning-patterns";

const RULE_ID = "STE-1.3";
const RULE_NAME = "Approved meanings";

export interface Ste13EngineOptions {
  /** Same as STE-1.1: compare heuristic POS to dictionary. Default true. */
  checkPos?: boolean;
}

/** Same persistence shape as other engines; compatible with analyze route. */
export interface Ste13Violation {
  sentenceIndex: number;
  sentenceExcerpt: string;
  tokenRaw: string;
  tokenNormalized: string;
  positionStart: number;
  positionEnd: number;
  ruleId: string;
  ruleName: string;
  severity: "critical" | "major" | "minor";
  reason: "wrong_meaning";
  suggestion: string;
  wordCount: number;
}

export interface Ste13EngineResult {
  violations: Ste13Violation[];
}

function shouldSkipToken(normalized: string): boolean {
  if (!normalized) return true;
  return /^\d+$/.test(normalized);
}

/**
 * True if the token would pass STE-1.1 word checks (approved, POS ok, form ok).
 */
function passesSte11WordGate(
  entry: DictionaryLookupResult,
  token: Token,
  checkPos: boolean
): boolean {
  if (!entry.approved) return false;

  if (
    checkPos &&
    entry.pos != null &&
    entry.pos !== "" &&
    token.posHeuristic &&
    token.posHeuristic !== "unknown"
  ) {
    const dictPos = entry.pos.toLowerCase();
    const tokenPos = token.posHeuristic.toLowerCase();
    if (dictPos !== tokenPos) return false;
  }

  if (entry.allowedForms != null && entry.allowedForms.length > 0) {
    const tokenNorm = token.normalized.toLowerCase();
    const inList = entry.allowedForms.some((f) => f.toLowerCase() === tokenNorm);
    if (!inList) return false;
  }

  return true;
}

function findDisallowedMeaningRow(
  meanings: SteMeaningRow[],
  meaningIncludes: string
): SteMeaningRow | undefined {
  const needle = meaningIncludes.toLowerCase();
  return meanings.find(
    (m) => !m.approvedAsIs && m.meaning != null && m.meaning.toLowerCase().includes(needle)
  );
}

function formatSuggestion(row: SteMeaningRow): string {
  const w = row.alternativeWord;
  if (!w) return "Use an approved alternative from the dictionary for this meaning.";
  const p = row.alternativePos;
  return p ? `${w} (${p})` : w;
}

/**
 * Runs STE-1.3: wrong approved meaning, only for headwords with patterns and
 * matching high-confidence sentence regex.
 */
export async function runSte13Check(
  doc: TokenizedDocument,
  lookup: DictionaryLookup,
  options?: Ste13EngineOptions
): Promise<Ste13EngineResult> {
  const checkPos = options?.checkPos !== false;
  const violations: Ste13Violation[] = [];

  for (const sentence of doc.sentences) {
    const docStart = sentence.offsetInDocument.start;
    const sentenceWordCount = sentence.tokens.filter((t) => t.isWord).length;
    const sentenceText = sentence.text;

    for (const token of sentence.tokens) {
      if (!token.isWord || !token.normalized) continue;
      if (shouldSkipToken(token.normalized)) continue;

      const entry = await lookup(token.normalized);
      if (entry == null) continue;

      if (!passesSte11WordGate(entry, token, checkPos)) continue;

      const meanings = entry.meanings;
      if (!meanings || meanings.length === 0) continue;

      if (meanings.length === 1 && meanings[0].approvedAsIs) continue;

      const head = entry.word.toLowerCase();
      const patternList = STE_MEANING_PATTERNS[head];
      if (!patternList || patternList.length === 0) continue;

      const positionStart = docStart + token.offsetInSentence.start;
      const positionEnd = docStart + token.offsetInSentence.end;

      for (const rule of patternList) {
        const row = findDisallowedMeaningRow(meanings, rule.meaningIncludes);
        if (!row) continue;

        let re: RegExp;
        try {
          re = new RegExp(rule.regex, rule.flags ?? "");
        } catch {
          continue;
        }
        if (!re.test(sentenceText)) continue;

        violations.push({
          sentenceIndex: sentence.index,
          sentenceExcerpt: sentence.text,
          tokenRaw: token.raw,
          tokenNormalized: token.normalized,
          positionStart,
          positionEnd,
          ruleId: RULE_ID,
          ruleName: RULE_NAME,
          severity: "minor",
          reason: "wrong_meaning",
          suggestion: formatSuggestion(row),
          wordCount: sentenceWordCount,
        });
        break;
      }
    }
  }

  return { violations };
}
