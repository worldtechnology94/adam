/**
 * STE-5.1 / STE-5.2 engine unit tests (sentence length by type).
 *
 * Run: npx tsx scripts/test-ste5-engine.ts
 */

import { tokenizeText, runSte5Check } from "../app/lib/analysis";

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(`Assertion failed: ${message}`);
}

function assertEqual<T>(actual: T, expected: T, message: string): void {
  if (actual !== expected) {
    throw new Error(`${message}\n  Expected: ${expected}\n  Actual: ${actual}`);
  }
}

async function main(): Promise<void> {
  console.log("STE-5.1 / STE-5.2 engine tests\n");

  // 1. Short instructional (verb first) → no violation
  const doc1 = tokenizeText("Open the valve.", { applyPosHeuristic: true });
  const result1 = runSte5Check(doc1);
  assertEqual(result1.violations.length, 0, "Short instructional → no violation");
  console.log("  1. OK: short instructional → no violation");

  // 2. Long instructional (21+ words, verb first) → STE-5.1
  const longInstructional =
    "Open the valve and check the pressure and close the valve and report the reading and then stop the pump and wait for the signal.";
  const doc2 = tokenizeText(longInstructional, { applyPosHeuristic: true });
  const result2 = runSte5Check(doc2);
  const wordCount2 = doc2.sentences[0].tokens.filter((t) => t.isWord).length;
  assert(wordCount2 > 20, "Sentence has more than 20 words");
  const v51 = result2.violations.find((v) => v.ruleId === "STE-5.1");
  assert(v51 != null, "STE-5.1 violation for long instructional");
  assertEqual(v51.reason, "sentence_length_instructional", "reason");
  assertEqual(v51.sentenceType, "instructional", "sentenceType");
  console.log("  2. OK: long instructional → STE-5.1 violation");

  // 3. Long descriptive (26+ words, no verb first) → STE-5.2
  const longDescriptive =
    "The valve is used to control the flow of water and it is important to check the pressure regularly and the technician should open the valve slowly and carefully.";
  const doc3 = tokenizeText(longDescriptive, { applyPosHeuristic: true });
  const result3 = runSte5Check(doc3);
  const wordCount3 = doc3.sentences[0].tokens.filter((t) => t.isWord).length;
  assert(wordCount3 > 25, "Sentence has more than 25 words");
  const v52 = result3.violations.find((v) => v.ruleId === "STE-5.2");
  assert(v52 != null, "STE-5.2 violation for long descriptive");
  assertEqual(v52.reason, "sentence_length_descriptive", "reason");
  assertEqual(v52.sentenceType, "descriptive", "sentenceType");
  console.log("  3. OK: long descriptive → STE-5.2 violation");

  // 4. Short descriptive → no violation
  const doc4 = tokenizeText("The valve controls the flow.", { applyPosHeuristic: true });
  const result4 = runSte5Check(doc4);
  assertEqual(result4.violations.length, 0, "Short descriptive → no violation");
  console.log("  4. OK: short descriptive → no violation");

  // 5. Position spans whole sentence
  assert(v51.positionStart < v51.positionEnd, "Position spans sentence");
  console.log("  5. OK: position spans sentence");

  console.log("\nAll STE-5 engine tests passed.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
