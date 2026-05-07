/**
 * High-confidence regex patterns for STE-1.3 (approved meanings).
 * Strategy A + E from missing-dic-driven.md: only flag when a pattern matches a
 * disallowed sense tied to a dictionary meaning row (approved_as_is: false).
 *
 * Extend per headword as needed; keep patterns narrow to limit false positives.
 */

export interface SteMeaningPatternRule {
  /**
   * Match against meaning text of a row where approved_as_is is false
   * (case-insensitive substring).
   */
  meaningIncludes: string;
  /** Tested on the full sentence (not only the token). */
  regex: string;
  flags?: string;
}

/**
 * Key = lowercase headword. Order matters: first matching rule wins for that token.
 */
export const STE_MEANING_PATTERNS: Record<string, SteMeaningPatternRule[]> = {
  about: [
    {
      meaningIncludes: "APPROXIMATELY",
      regex: String.raw`\babout\s+\d`,
      flags: "i",
    },
    {
      meaningIncludes: "AROUND",
      regex: String.raw`\babout\s+(its|the|this|that)\s+axis\b`,
      flags: "i",
    },
    {
      meaningIncludes: "AROUND",
      regex: String.raw`\b(rotate|rotates|rotated|rotating|turn|turns|turned|turning)\b.{0,120}?\sabout\s+(its|the|this|that)\s+axis\b`,
      flags: "is",
    },
  ],
};
