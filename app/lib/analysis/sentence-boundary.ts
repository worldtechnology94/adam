/**
 * ADAM — Sentence boundary detection (T2.1)
 *
 * Splits plain text into sentences using period, exclamation, question mark,
 * and newline as delimiters, while avoiding splits inside:
 * - Common abbreviations (e.g., i.e., No., Mr., Dr., Fig., etc.)
 * - Decimal numbers (e.g. 3.14, 0.5)
 * - Ellipsis (...)
 *
 * This is a rule-based implementation suitable for technical text; it does
 * not use a full NLP sentence segmenter. The thesis plan allows "simple"
 * segmentation for scope.
 *
 * @see thesisplan.md T2.1 — split text into sentences (period, newline, optional !?)
 * @see adam_dictionary_spec.md §4.1 — TOKENIZER: split into sentences
 */

import type { TextOffset } from "./types";

/** Result of sentence splitting: sentence text and its offset in the document. */
export interface SentenceFragment {
  text: string;
  offsetInDocument: TextOffset;
}

/**
 * Abbreviations that typically end with a period but do NOT end a sentence.
 * Lowercase for comparison after we lower the segment before the period.
 * Add more as needed for technical documentation (AMM, ATA, etc. if used as abbreviations).
 */
const ABBREVIATIONS_NO_SPLIT = new Set([
  "e.g",
  "i.e",
  "etc",
  "vs",
  "approx",
  "no",      // "No." as in "Item No."
  "fig",
  "ref",
  "mr",
  "mrs",
  "ms",
  "dr",
  "prof",
  "sr",
  "jr",
  "rev",
  "st",      // St. (Street or Saint)
  "ave",
  "blvd",
  "vol",
  "al",      // et al.
  "cf",
  "ed",
  "eds",
  "ibid",
  "op",
  "cit",
  "p",       // p. (page)
  "pp",
  "par",
  "sec",
  "ch",
  "art",
  "ex",
  "inc",
  "ltd",
  "co",
  "corp",
  "max",
  "min",
  "temp",
  "rev",
  "nr",
  "na",
  "n/a",
  "qty",
  "qty",
  "typ",
  "std",
  "ref",
  "refs",
  "alt",
  "opt",
  "req",
  "spec",
  "std",
  "un",
  "cf",
  "ca",      // ca. (circa)
  "est",
  "dept",
  "mfg",
  "dist",
  "intl",
  "tech",
  "gen",
  "mgr",
  "dir",
  "div",
  "proc",
  "doc",
  "info",
  "msg",
  "def",
  "var",
  "const",
  "incl",
  "excl",
]);

/**
 * Normalize line endings to \n so that \r\n and \r are treated consistently
 * when splitting on newlines and when computing offsets.
 */
function normalizeLineEndings(text: string): string {
  return text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
}

/**
 * Returns true if the character at index i in text is likely part of a decimal
 * number (digit before and after the period). Does not handle all numeric
 * formats (e.g. "1,000.5" has comma); we only check digit . digit.
 */
function isDecimalPoint(text: string, i: number): boolean {
  if (text[i] !== ".") return false;
  const prev = i > 0 ? text[i - 1] : "";
  const next = i + 1 < text.length ? text[i + 1] : "";
  return /\d/.test(prev) && /\d/.test(next);
}

/**
 * Returns true if at index i in text there is an ellipsis (three or more dots).
 */
function isEllipsis(text: string, i: number): boolean {
  if (text[i] !== ".") return false;
  let j = i;
  while (j < text.length && text[j] === ".") j++;
  return j - i >= 3;
}

/**
 * Given text ending at index end (exclusive), returns the last "word" before
 * the final period, for abbreviation check. We remove only a trailing period
 * so that "e.g." yields "e.g" (in set), not "eg".
 * Example: "...utilized the tool." -> "tool"; "Use e.g. a tool." -> "e.g"
 */
function lastWordBeforeEnd(text: string, end: number): string {
  const segment = text.slice(0, end).trimEnd();
  const lastSpace = segment.lastIndexOf(" ");
  let word = lastSpace >= 0 ? segment.slice(lastSpace + 1) : segment;
  word = word.replace(/\.$/, "").toLowerCase();
  return word;
}

/**
 * Splits text into sentences. Sentence boundaries are:
 * - Newline (\n)
 * - Period (.) when not abbreviation, decimal, or ellipsis
 * - Exclamation (!)
 * - Question mark (?)
 *
 * Each returned sentence is trimmed. Empty sentences (e.g. multiple newlines)
 * are omitted. Offsets refer to the **original** text (with normalized line endings).
 */
export function getSentencesWithOffsets(text: string): SentenceFragment[] {
  const normalized = normalizeLineEndings(text);
  const fragments: SentenceFragment[] = [];
  let start = 0;
  let i = 0;

  while (i < normalized.length) {
    const ch = normalized[i];

    if (ch === "\n") {
      const segment = normalized.slice(start, i);
      const sentenceText = segment.trim();
      if (sentenceText.length > 0) {
        const leading = segment.match(/^\s*/)?.[0].length ?? 0;
        const trailing = segment.match(/\s*$/)?.[0].length ?? 0;
        fragments.push({
          text: sentenceText,
          offsetInDocument: { start: start + leading, end: i - trailing },
        });
      }
      start = i + 1;
      i++;
      continue;
    }

    if (ch === "!" || ch === "?") {
      const end = i + 1;
      const segment = normalized.slice(start, end);
      const sentenceText = segment.trim();
      if (sentenceText.length > 0) {
        const leading = segment.match(/^\s*/)?.[0].length ?? 0;
        const trailing = segment.match(/\s*$/)?.[0].length ?? 0;
        fragments.push({
          text: sentenceText,
          offsetInDocument: { start: start + leading, end: end - trailing },
        });
      }
      start = end;
      i++;
      continue;
    }

    if (ch === ".") {
      if (isEllipsis(normalized, i)) {
        let endEllipsis = i;
        while (endEllipsis < normalized.length && normalized[endEllipsis] === ".") endEllipsis++;
        const end = endEllipsis;
        const segment = normalized.slice(start, end);
        const sentenceText = segment.trim();
        if (sentenceText.length > 0) {
          const leading = segment.match(/^\s*/)?.[0].length ?? 0;
          const trailing = segment.match(/\s*$/)?.[0].length ?? 0;
          fragments.push({
            text: sentenceText,
            offsetInDocument: { start: start + leading, end: end - trailing },
          });
        }
        start = end;
        i = end;
        continue;
      }
      if (isDecimalPoint(normalized, i)) {
        i++;
        continue;
      }
      // Multi-period abbreviations: "e.g." and "i.e." — do not split at the first period
      const nextThree = normalized.slice(i, i + 3);
      if (nextThree === ".g." || nextThree === ".e.") {
        i++;
        continue;
      }
      const nextFour = normalized.slice(i, i + 4);
      if (nextFour === ". g." || nextFour === ". e.") {
        i++;
        continue;
      }
      const wordBefore = lastWordBeforeEnd(normalized.slice(0, i + 1), i + 1);
      if (wordBefore && ABBREVIATIONS_NO_SPLIT.has(wordBefore)) {
        i++;
        continue;
      }
      const end = i + 1;
      const segment = normalized.slice(start, end);
      const sentenceText = segment.trim();
      if (sentenceText.length > 0) {
        const leading = segment.match(/^\s*/)?.[0].length ?? 0;
        const trailing = segment.match(/\s*$/)?.[0].length ?? 0;
        fragments.push({
          text: sentenceText,
          offsetInDocument: { start: start + leading, end: end - trailing },
        });
      }
      start = end;
      i++;
      continue;
    }

    i++;
  }

  const segment = normalized.slice(start);
  const remainder = segment.trim();
  if (remainder.length > 0) {
    const leading = segment.match(/^\s*/)?.[0].length ?? 0;
    const trailing = segment.match(/\s*$/)?.[0].length ?? 0;
    fragments.push({
      text: remainder,
      offsetInDocument: { start: start + leading, end: normalized.length - trailing },
    });
  }

  return fragments;
}

/**
 * Splits text into sentences and returns only the sentence strings (no offsets).
 * Convenience wrapper for getSentencesWithOffsets.
 */
export function getSentences(text: string): string[] {
  return getSentencesWithOffsets(text).map((f) => f.text);
}
