/**
 * Paragraph segmentation from raw document text (blank-line separated blocks).
 * Used by STE-6.x and block-aware rules.
 *
 * Offsets are 0-based in **sourceText** (same coordinate system as `Sentence.offsetInDocument`).
 */

export interface ParagraphSpan {
  startOffset: number;
  endOffset: number;
}

/**
 * Splits **sourceText** into paragraph spans using one or more newlines as separators
 * (at least one blank line between blocks: `\n` + optional whitespace + `\n`).
 */
export function getParagraphSpans(sourceText: string): ParagraphSpan[] {
  const out: ParagraphSpan[] = [];
  const re = /\n\s*\n/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(sourceText)) !== null) {
    out.push({ startOffset: last, endOffset: m.index });
    last = m.index + m[0].length;
  }
  out.push({ startOffset: last, endOffset: sourceText.length });
  return out;
}

/** Returns paragraph index containing **offset**, or -1. */
export function paragraphIndexForOffset(spans: ParagraphSpan[], offset: number): number {
  const i = spans.findIndex((s) => offset >= s.startOffset && offset < s.endOffset);
  return i >= 0 ? i : -1;
}
