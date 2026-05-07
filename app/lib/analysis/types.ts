/**
 * ADAM — Analysis module types (T2.1+)
 *
 * These types support the STE-1.1 pipeline: sentence boundary detection,
 * tokenization, normalization, and (optionally) POS heuristics. They are
 * designed so the engine (T2.2) can report violations with exact character
 * offsets and token context.
 *
 * @see thesisplan.md T2.1 — Text normalization and tokenization
 * @see adam_dictionary_spec.md §3 — Word-level check algorithm
 */

/**
 * Character-offset range in the **original** document text.
 * Used for violation reporting (positionStart, positionEnd) and highlighting.
 */
export interface TextOffset {
  /** 0-based start index (inclusive) */
  start: number;
  /** 0-based end index (exclusive) */
  end: number;
}

/**
 * A single token (word or punctuation-only segment) within a sentence.
 * For STE-1.1 we care mainly about lexical tokens; punctuation tokens
 * can be used for context but are typically not looked up in the dictionary.
 */
export interface Token {
  /**
   * Token exactly as it appears in the source (preserves casing and punctuation).
   * Example: "utilized", "De-ice", "."
   */
  raw: string;

  /**
   * Normalized form used for dictionary lookup: lowercase, leading/trailing
   * punctuation stripped, internal hyphens preserved (e.g. "de-ice").
   * Empty string if the token is purely punctuation/whitespace.
   */
  normalized: string;

  /**
   * Character offsets of this token within the **sentence** (0-based).
   * Enables mapping back to the sentence string for display.
   */
  offsetInSentence: TextOffset;

  /**
   * Whether this token is considered a "word" for STE-1.1 lookup.
   * True if normalized contains at least one letter (e.g. "utilized", "de-ice").
   * False for pure punctuation or numbers-without-letters.
   */
  isWord: boolean;

  /**
   * Optional part-of-speech from a heuristic (v, n, adj, adv, prep, etc.).
   * Set by the POS heuristic module; "unknown" if not applied or no rule matched.
   */
  posHeuristic?: string;
}

/**
 * A sentence with its position in the source document and its tokens.
 * Used by the STE-1.1 engine to associate violations with sentence index
 * and excerpt.
 */
export interface Sentence {
  /**
   * Sentence text (trimmed). May not include the trailing period if
   * sentence boundary strips it; implementation-dependent.
   */
  text: string;

  /**
   * 0-based index of this sentence in the document (from getSentences / tokenizeText).
   */
  index: number;

  /**
   * Character offsets of this sentence in the **original document** text.
   */
  offsetInDocument: TextOffset;

  /**
   * Tokens produced by getTokens(sentence.text), with offsets relative to sentence.
   */
  tokens: Token[];
}

/**
 * Result of full text analysis: sentences and their tokens.
 * This is the primary output of the T2.1 tokenizer for consumption by the STE-1.1 engine.
 */
export interface TokenizedDocument {
  /** Original input text (normalized line endings only). */
  sourceText: string;

  /** Sentences in order, with tokens and offsets. */
  sentences: Sentence[];

  /** Total number of word tokens (isWord === true) across all sentences. */
  totalWordCount: number;
}
