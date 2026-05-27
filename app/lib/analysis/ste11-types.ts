/**
 * ADAM — STE-1.1 engine types (T2.2)
 *
 * @see thesisplan.md T2.2 — STE-1.1 engine
 * @see adam_dictionary_spec.md §3 — Word-level check algorithm
 */

/** One row from `ste_meanings` (ASD-STE dictionary D/E continuation semantics). */
export interface SteMeaningRow {
  meaning: string | null;
  approvedAsIs: boolean;
  alternativeWord: string | null;
  alternativePos: string | null;
  guidanceNote: string | null;
}

/** Result of a dictionary lookup for one word/form (resolved to headword). */
export interface DictionaryLookupResult {
  found: true;
  word: string;
  word_display?: string;
  pos?: string;
  approved: boolean;
  alternatives: { word: string; pos?: string }[];
  examples: { ste?: string; non_ste?: string }[];
  /** Allowed forms for this headword (STE-1.5). Empty = no form check. */
  allowedForms?: string[];
  /**
   * Full meaning rows from the dictionary (STE-1.3). Omitted or empty when the
   * headword has no `ste_meanings` rows. Batched and single-path lookups both include this.
   */
  meanings?: SteMeaningRow[];
}

/**
 * Async dictionary lookup: given a normalized token (lowercase, no punctuation),
 * returns the headword entry or null if not in dictionary.
 * The implementation must resolve form → headword (e.g. "absorbed" → "absorb").
 */
export type DictionaryLookup = (normalizedWord: string) => Promise<DictionaryLookupResult | null>;

/** Severity for STE-1.1 violations (aligned with DB and spec). */
export type Ste11Severity = "critical" | "major" | "minor";

/** Reason code for the violation (for analytics and filtering). */
export type Ste11ViolationReason = "unknown_word" | "forbidden_word" | "wrong_pos" | "wrong_form";

/**
 * One STE-1.1 violation: a word in the text that fails the approved-word rule.
 * Maps to the Violation model when persisting (analysisRunId, sentenceExcerpt, ruleId, etc.).
 */
export interface Ste11Violation {
  /** 0-based sentence index in the tokenized document. */
  sentenceIndex: number;
  /** The sentence text (for excerpt and display). */
  sentenceExcerpt: string;
  /** Token as it appears in the source. */
  tokenRaw: string;
  /** Normalized form that was looked up. */
  tokenNormalized: string;
  /** Start offset of the token in the **document** (for highlighting). */
  positionStart: number;
  /** End offset of the token in the **document**. */
  positionEnd: number;
  /** Rule identifier (always STE-1.1 for this engine). */
  ruleId: string;
  /** Human-readable rule name. */
  ruleName: string;
  /** Severity: major for unknown/forbidden/wrong POS; minor for contextual. */
  severity: Ste11Severity;
  /** Reason code. */
  reason: Ste11ViolationReason;
  /** Suggested replacement (e.g. "use" for "utilize"); may be empty for unknown. */
  suggestion: string;
  /** All approved alternatives from the dictionary (for forbidden words). */
  alternatives?: { word: string; pos?: string }[];
  /** One STE example sentence if available. */
  exampleSte?: string;
  /** One non-STE example sentence if available. */
  exampleNonSte?: string;
  /** Word count of the sentence (for display). */
  wordCount: number;
}

/** Result of running the STE-1.1 engine on a tokenized document. */
export interface Ste11EngineResult {
  violations: Ste11Violation[];
  /** Compliance score 0–100 (e.g. 100 − penalty per violation, capped). */
  complianceScore: number;
  totalWordCount: number;
}
