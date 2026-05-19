/**
 * ADAM — Analysis module (T2.1+)
 *
 * Public API for text normalization, sentence splitting, tokenization,
 * and optional POS heuristics. Used by the STE-1.1 engine (T2.2) and
 * the analysis API (T2.3).
 *
 * @see thesisplan.md T2.1 — Text normalization and tokenization
 */

// Types
export type {
  TextOffset,
  Token,
  Sentence,
  TokenizedDocument,
} from "./types";

// Paragraph spans (STE-6.x)
export { getParagraphSpans, paragraphIndexForOffset } from "./paragraph";
export type { ParagraphSpan } from "./paragraph";

// Sentence boundary (getSentences is re-exported via tokenize below)
export { getSentencesWithOffsets } from "./sentence-boundary";
export type { SentenceFragment } from "./sentence-boundary";

// Tokenization and normalization
export {
  getTokens,
  getSentences,
  tokenizeText,
  tokenizeSentences,
  normalizeForLookup,
  isWordToken,
} from "./tokenize";

// POS heuristic (optional)
export { inferPOS } from "./pos-heuristic";
export type { POSCode } from "./pos-heuristic";

// STE-1.1 engine (T2.2)
export { runSte11Check } from "./ste11-engine";
export type { Ste11EngineOptions } from "./ste11-engine";
export { runSte13Check } from "./ste13-engine";
export type { Ste13Violation, Ste13EngineResult, Ste13EngineOptions } from "./ste13-engine";
export { runSte81Check } from "./ste81-engine";
export type { Ste81Violation, Ste81EngineResult } from "./ste81-engine";
export { runSte5Check } from "./ste5-engine";
export type { Ste5Violation, Ste5EngineResult, SentenceType } from "./ste5-engine";
export { runSte53Check } from "./ste53-engine";
export type { Ste53Violation, Ste53EngineResult } from "./ste53-engine";
export { runSte32Check } from "./ste32-engine";
export type { Ste32Violation, Ste32EngineResult } from "./ste32-engine";
export { runSte41Check } from "./ste41-engine";
export type { Ste41Violation, Ste41EngineResult } from "./ste41-engine";
export { runSte42Check } from "./ste42-engine";
export type { Ste42Violation, Ste42EngineResult } from "./ste42-engine";
export { runSte43Check } from "./ste43-engine";
export type { Ste43Violation, Ste43EngineResult } from "./ste43-engine";
export { runSte44Check } from "./ste44-engine";
export type { Ste44Violation, Ste44EngineResult } from "./ste44-engine";
export { classifySentenceRole } from "./sentence-classifier";
export type { SentenceRole } from "./sentence-classifier";
export { runSte45Check } from "./ste45-engine";
export type { Ste45Violation, Ste45EngineResult } from "./ste45-engine";
export { runSte46Check } from "./ste46-engine";
export type { Ste46Violation, Ste46EngineResult } from "./ste46-engine";
export { runSte47Check } from "./ste47-engine";
export type { Ste47Violation, Ste47EngineResult } from "./ste47-engine";
export { runSte48Check } from "./ste48-engine";
export type { Ste48Violation, Ste48EngineResult } from "./ste48-engine";
export { runSte61Check } from "./ste61-engine";
export type { Ste61Violation, Ste61EngineResult } from "./ste61-engine";
export { runSte71Check } from "./ste71-engine";
export type { Ste71Violation, Ste71EngineResult } from "./ste71-engine";
export { runSte72Check } from "./ste72-engine";
export type { Ste72Violation, Ste72EngineResult } from "./ste72-engine";
export { runSte73Check } from "./ste73-engine";
export type { Ste73Violation, Ste73EngineResult } from "./ste73-engine";
export { runSte74Check } from "./ste74-engine";
export type { Ste74Violation, Ste74EngineResult } from "./ste74-engine";
export { runSte75Check } from "./ste75-engine";
export type { Ste75Violation, Ste75EngineResult } from "./ste75-engine";
export { runSte21Check } from "./ste21-engine";
export type { Ste21Violation, Ste21EngineResult } from "./ste21-engine";
export { runSte82Check } from "./ste82-engine";
export type { Ste82Violation, Ste82EngineResult } from "./ste82-engine";
export { runSte83Check } from "./ste83-engine";
export type { Ste83Violation, Ste83EngineResult } from "./ste83-engine";
export { runSte84Check } from "./ste84-engine";
export type { Ste84Violation, Ste84EngineResult } from "./ste84-engine";
export { runSte85Check } from "./ste85-engine";
export type { Ste85Violation, Ste85EngineResult } from "./ste85-engine";
export { runSte86Check } from "./ste86-engine";
export type { Ste86Violation, Ste86EngineResult } from "./ste86-engine";
export { runSte87Check } from "./ste87-engine";
export type { Ste87Violation, Ste87EngineResult } from "./ste87-engine";
export { runSte91Check } from "./ste91-engine";
export type { Ste91Violation, Ste91EngineResult } from "./ste91-engine";
export { runSte92Check } from "./ste92-engine";
export type { Ste92Violation, Ste92EngineResult } from "./ste92-engine";
export { runSte93Check } from "./ste93-engine";
export type { Ste93Violation, Ste93EngineResult } from "./ste93-engine";
export { runSte14Check } from "./ste14-engine";
export type { Ste14Violation, Ste14EngineResult } from "./ste14-engine";
export { runSte35Check } from "./ste35-engine";
export type { Ste35Violation, Ste35EngineResult } from "./ste35-engine";
export { runSte22Check } from "./ste22-engine";
export type { Ste22Violation, Ste22EngineResult } from "./ste22-engine";
export { runSte23Check } from "./ste23-engine";
export type { Ste23Violation, Ste23EngineResult } from "./ste23-engine";
export { runSte62Check } from "./ste62-engine";
export type { Ste62Violation, Ste62EngineResult } from "./ste62-engine";
export { runSte16Check } from "./ste16-engine";
export type { Ste16Violation, Ste16EngineResult } from "./ste16-engine";
export { runSte17Check } from "./ste17-engine";
export type { Ste17Violation, Ste17EngineResult } from "./ste17-engine";
export { runSte33Check } from "./ste33-engine";
export type { Ste33Violation, Ste33EngineResult } from "./ste33-engine";
export { runSte34Check } from "./ste34-engine";
export type { Ste34Violation, Ste34EngineResult } from "./ste34-engine";
export { runSte38Check } from "./ste38-engine";
export type { Ste38Violation, Ste38EngineResult } from "./ste38-engine";
export { runSte36Check } from "./ste36-engine";
export type { Ste36Violation, Ste36EngineResult } from "./ste36-engine";
export { runSte37Check } from "./ste37-engine";
export type { Ste37Violation, Ste37EngineResult } from "./ste37-engine";
export { runSte39Check } from "./ste39-engine";
export type { Ste39Violation, Ste39EngineResult } from "./ste39-engine";
export { runSte102Check } from "./ste102-engine";
export type { Ste102Violation, Ste102EngineResult } from "./ste102-engine";
export { runSte10WritingCheck } from "./ste10-writing-engine";
export type { Ste10WritingViolation, Ste10WritingEngineResult } from "./ste10-writing-engine";
export { runSte63Check } from "./ste63-engine";
export type { Ste63Violation, Ste63EngineResult } from "./ste63-engine";
export { runSte64Check } from "./ste64-engine";
export type { Ste64Violation, Ste64EngineResult } from "./ste64-engine";
export { runSte65Check } from "./ste65-engine";
export type { Ste65Violation, Ste65EngineResult } from "./ste65-engine";
export { runSte66Check } from "./ste66-engine";
export type { Ste66Violation, Ste66EngineResult } from "./ste66-engine";
export { runSte94Check } from "./ste94-engine";
export type { Ste94Violation, Ste94EngineResult } from "./ste94-engine";
export { runSte101Check } from "./ste101-engine";
export type { Ste101Violation, Ste101EngineResult } from "./ste101-engine";
export { runSte54Check } from "./ste54-engine";
export type { Ste54Violation, Ste54EngineResult } from "./ste54-engine";
export { runSte105Check } from "./ste105-engine";
export type { Ste105Violation, Ste105EngineResult } from "./ste105-engine";
export { runSte107Check } from "./ste107-engine";
export type { Ste107Violation, Ste107EngineResult } from "./ste107-engine";
export { runSte110Check } from "./ste110-engine";
export type { Ste110Violation, Ste110EngineResult } from "./ste110-engine";
export { runSte113Check } from "./ste113-engine";
export type { Ste113Violation, Ste113EngineResult } from "./ste113-engine";
export { runSte84ListCheck } from "./ste84list-engine";
export type { Ste84ListViolation, Ste84ListEngineResult } from "./ste84list-engine";
export { createPrismaLookup, createBatchedPrismaLookup } from "./dictionary-lookup";
export type {
  DictionaryLookupResult,
  DictionaryLookup,
  SteMeaningRow,
  Ste11Violation,
  Ste11EngineResult,
  Ste11Severity,
  Ste11ViolationReason,
} from "./ste11-types";
