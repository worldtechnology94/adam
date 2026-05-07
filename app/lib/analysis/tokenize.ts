/**
 * ADAM — Tokenization and normalization (T2.1)
 *
 * Splits a sentence into tokens (words and punctuation), normalizes each
 * token for dictionary lookup (lowercase, strip leading/trailing punctuation,
 * preserve internal hyphens for compounds like "de-ice"), and records
 * character offsets within the sentence for violation reporting.
 *
 * @see thesisplan.md T2.1 — Tokenize each sentence (whitespace + punctuation, lowercase)
 * @see adam_dictionary_spec.md §3.1 — NORMALIZE: Lowercase, strip punctuation
 */

import type { Token } from "./types";
import { getSentencesWithOffsets } from "./sentence-boundary";
import type { SentenceFragment } from "./sentence-boundary";
import type { Sentence, TokenizedDocument } from "./types";
import { inferPOS } from "./pos-heuristic";

/**
 * Regex to split on whitespace while preserving the ability to compute
 * exact character offsets. We iterate and split on one or more whitespace chars.
 */
const WHITESPACE_REGEX = /\s+/g;

/**
 * Normalizes a token for STE dictionary lookup:
 * - Lowercase
 * - Strip leading and trailing punctuation (including brackets, quotes, etc.)
 * - Preserve internal hyphens so "de-ice" and "anti-icing" remain one token
 *
 * Spec: "Lowercase the token", "Strip punctuation" (§3.1).
 * Edge case: hyphenated compounds (de-ice, anti-icing) — treat as single token (spec §6).
 */
export function normalizeForLookup(raw: string): string {
  const trimmed = raw.trim();
  if (trimmed.length === 0) return "";

  let start = 0;
  let end = trimmed.length;

  // Strip leading punctuation (anything that is not letter, digit, or hyphen)
  while (start < end && /[^a-zA-Z0-9-]/.test(trimmed[start])) start++;

  // Strip trailing punctuation
  while (end > start && /[^a-zA-Z0-9-]/.test(trimmed[end - 1])) end--;

  const core = trimmed.slice(start, end);
  return core.toLowerCase();
}

/**
 * Returns true if the normalized form contains at least one letter (a-z).
 * Such tokens are considered "words" for STE-1.1 lookup; pure numbers or
 * punctuation are not.
 */
export function isWordToken(normalized: string): boolean {
  return /[a-zA-Z]/.test(normalized);
}

/**
 * Tokenizes a single sentence string into an array of Token objects.
 * Splits on whitespace; each segment is then normalized and assigned
 * offsetInSentence (relative to the given sentence text).
 *
 * Acceptance (thesisplan): "The technician utilized the tool." → tokens
 * include "technician", "utilized", "the", "tool".
 */
export function getTokens(sentenceText: string): Token[] {
  const tokens: Token[] = [];
  let lastEnd = 0;

  WHITESPACE_REGEX.lastIndex = 0;
  let match: RegExpExecArray | null;

  const segments: { start: number; end: number; text: string }[] = [];

  while ((match = WHITESPACE_REGEX.exec(sentenceText)) !== null) {
    if (match.index > lastEnd) {
      segments.push({
        start: lastEnd,
        end: match.index,
        text: sentenceText.slice(lastEnd, match.index),
      });
    }
    lastEnd = match.index + match[0].length;
  }
  if (lastEnd < sentenceText.length) {
    segments.push({
      start: lastEnd,
      end: sentenceText.length,
      text: sentenceText.slice(lastEnd),
    });
  }

  for (const seg of segments) {
    const raw = seg.text;
    const normalized = normalizeForLookup(raw);
    const isWord = isWordToken(normalized);

    tokens.push({
      raw,
      normalized,
      offsetInSentence: { start: seg.start, end: seg.end },
      isWord,
    });
  }

  return tokens;
}

/**
 * Returns sentences from text (with offsets). Delegates to sentence-boundary.
 * Use this when you need only sentence strings or fragments with offsets,
 * without tokenizing.
 */
export function getSentences(text: string): string[] {
  return getSentencesWithOffsets(text).map((f) => f.text);
}

/**
 * Full tokenization of a document: split into sentences (with offsets),
 * tokenize each sentence, and return a TokenizedDocument suitable for
 * the STE-1.1 engine.
 *
 * @param text - Raw input text (line endings are normalized to \n)
 * @param options.applyPosHeuristic - If true, attach posHeuristic to each word token (requires pos-heuristic module)
 */
export function tokenizeText(
  text: string,
  options?: { applyPosHeuristic?: boolean }
): TokenizedDocument {
  const fragments = getSentencesWithOffsets(text);
  const sentences: Sentence[] = [];
  let totalWordCount = 0;

  const attachPos = options?.applyPosHeuristic ?? false;

  for (let idx = 0; idx < fragments.length; idx++) {
    const frag = fragments[idx];
    const tokenList = getTokens(frag.text);

    if (attachPos) {
      for (const t of tokenList) {
        if (t.isWord && t.normalized) {
          t.posHeuristic = inferPOS(t.normalized);
        }
      }
    }

    const wordCount = tokenList.filter((t) => t.isWord).length;
    totalWordCount += wordCount;

    sentences.push({
      text: frag.text,
      index: idx,
      offsetInDocument: frag.offsetInDocument,
      tokens: tokenList,
    });
  }

  return {
    sourceText: text.replace(/\r\n/g, "\n").replace(/\r/g, "\n"),
    sentences,
    totalWordCount,
  };
}

/**
 * Builds Sentence[] from text (same as tokenizeText but returns only the sentences array).
 * Convenience when you already have fragments and want to attach tokens.
 */
export function tokenizeSentences(fragments: SentenceFragment[]): Sentence[] {
  return fragments.map((frag, idx) => {
    const tokens = getTokens(frag.text);
    return {
      text: frag.text,
      index: idx,
      offsetInDocument: frag.offsetInDocument,
      tokens,
    };
  });
}
