/**
 * T2.1 — Acceptance and edge-case tests for tokenizer and sentence boundary.
 *
 * Run: npx tsx scripts/test-tokenize.ts
 *
 * Verifies:
 * - Thesis acceptance: "The technician utilized the tool." → 1 sentence; tokens include technician, utilized, the, tool.
 * - Sentence boundary: abbreviations (e.g.), decimals (3.14), ellipsis (...).
 * - Normalization: lowercase, strip punctuation, preserve internal hyphens (de-ice).
 * - POS heuristic: optional inferPOS returns v/n/adj/etc. or "unknown".
 */

import {
  getSentences,
  getTokens,
  tokenizeText,
  normalizeForLookup,
  getSentencesWithOffsets,
  inferPOS,
} from "../app/lib/analysis";

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

function assertEqual<T>(actual: T, expected: T, message: string): void {
  if (actual !== expected) {
    throw new Error(`${message}\n  Expected: ${expected}\n  Actual: ${actual}`);
  }
}

function runAcceptance(): void {
  console.log("--- Acceptance (thesisplan T2.1) ---");
  const input = "The technician utilized the tool.";
  const sentences = getSentences(input);
  assertEqual(sentences.length, 1, "One sentence");
  assert(sentences[0] === input, "Sentence text preserved");

  const tokens = getTokens(sentences[0]);
  const normalizedList = tokens.filter((t) => t.isWord).map((t) => t.normalized);
  const required = ["the", "technician", "utilized", "the", "tool"];
  for (const word of required) {
    assert(
      normalizedList.includes(word),
      `Tokens must include "${word}". Got: ${normalizedList.join(", ")}`
    );
  }
  console.log("  OK: 1 sentence, tokens include technician, utilized, the, tool.");
}

function runSentenceBoundary(): void {
  console.log("--- Sentence boundary ---");

  // Abbreviation: e.g. should not split
  const withAbbrev = "Use a tool e.g. a screwdriver. Then tighten.";
  const s1 = getSentences(withAbbrev);
  assertEqual(s1.length, 2, "Two sentences (split after 'Then tighten.')");
  assert(s1[0].includes("e.g."), "First sentence contains e.g.");
  console.log("  OK: e.g. does not split sentence.");

  // Decimal
  const withDecimal = "Set value to 3.14. Next step.";
  const s2 = getSentences(withDecimal);
  assertEqual(s2.length, 2, "Two sentences");
  assert(s2[0].includes("3.14"), "First sentence contains 3.14");
  console.log("  OK: 3.14 does not split sentence.");

  // Ellipsis
  const withEllipsis = "Wait for signal... Then proceed.";
  const s3 = getSentences(withEllipsis);
  assertEqual(s3.length, 2, "Two sentences");
  assert(s3[0].includes("..."), "First sentence contains ellipsis");
  console.log("  OK: Ellipsis does not split sentence.");

  // Newline
  const withNewline = "First line.\nSecond line.";
  const s4 = getSentences(withNewline);
  assertEqual(s4.length, 2, "Two sentences");
  console.log("  OK: Newline splits sentence.");
}

function runNormalization(): void {
  console.log("--- Normalization ---");

  assertEqual(normalizeForLookup("Utilized"), "utilized", "Lowercase");
  assertEqual(normalizeForLookup('"utilized"'), "utilized", "Strip quotes");
  assertEqual(normalizeForLookup("(utilized)"), "utilized", "Strip parens");
  assertEqual(normalizeForLookup("de-ice"), "de-ice", "Preserve internal hyphen");
  assertEqual(normalizeForLookup("anti-icing"), "anti-icing", "Preserve internal hyphen");
  console.log("  OK: Lowercase, strip punctuation, preserve internal hyphen.");
}

function runTokenizeText(): void {
  console.log("--- tokenizeText ---");

  const twoSentences = "The technician utilized the tool. Prior to use, check the valve.";
  const doc = tokenizeText(twoSentences, { applyPosHeuristic: true });
  assertEqual(doc.sentences.length, 2, "Two sentences");
  assert(doc.sentences[0].tokens.some((t) => t.normalized === "utilized"), "First sentence has 'utilized'");
  assert(doc.sentences[1].tokens.some((t) => t.normalized === "prior"), "Second sentence has 'prior'");
  assert(doc.totalWordCount > 0, "Total word count > 0");
  assert(doc.sentences[0].offsetInDocument.start === 0, "First sentence starts at 0");
  const firstWordWithPos = doc.sentences[0].tokens.find((t) => t.normalized === "utilized");
  assert(firstWordWithPos?.posHeuristic === "v", "utilized → v (heuristic)");
  console.log("  OK: tokenizeText returns sentences, tokens, offsets, totalWordCount; POS heuristic applied.");
}

function runPosHeuristic(): void {
  console.log("--- POS heuristic ---");

  assertEqual(inferPOS("utilized"), "v", "utilized → v");
  assertEqual(inferPOS("technician"), "n", "technician → n (er/or/ar or similar)");
  assertEqual(inferPOS("quickly"), "adv", "quickly → adv");
  assertEqual(inferPOS("the"), "art", "the → art");
  assert(
    inferPOS("prior") === "unknown" || inferPOS("prior") === "n",
    "prior → unknown or n (heuristic may tag -or as noun)"
  );
  console.log("  OK: inferPOS returns v/n/adv/art/unknown as expected.");
}

function main(): void {
  console.log("T2.1 Tokenizer tests\n");
  runAcceptance();
  runSentenceBoundary();
  runNormalization();
  runTokenizeText();
  runPosHeuristic();
  console.log("\nAll tests passed.");
}

main();
