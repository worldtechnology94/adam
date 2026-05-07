/**
 * STE-8.1 engine unit tests (no semicolons).
 *
 * Run: npx tsx scripts/test-ste81-engine.ts
 */

import { tokenizeText, runSte81Check } from "../app/lib/analysis";

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(`Assertion failed: ${message}`);
}

function assertEqual<T>(actual: T, expected: T, message: string): void {
  if (actual !== expected) {
    throw new Error(`${message}\n  Expected: ${expected}\n  Actual: ${actual}`);
  }
}

async function main(): Promise<void> {
  console.log("STE-8.1 engine tests\n");

  // 1. Sentence with one semicolon → 1 violation
  const doc1 = tokenizeText("Open the valve; then check the pressure.");
  const result1 = runSte81Check(doc1);
  assertEqual(result1.violations.length, 1, "One semicolon → one violation");
  assert(result1.violations[0].ruleId === "STE-8.1", "ruleId STE-8.1");
  assert(result1.violations[0].reason === "semicolon", "reason semicolon");
  assert(result1.violations[0].sentenceExcerpt.includes(";"), "excerpt contains sentence");
  console.log("  1. OK: one semicolon → one STE-8.1 violation");

  // 2. Sentence with no semicolon → 0 violations
  const doc2 = tokenizeText("Open the valve. Then check the pressure.");
  const result2 = runSte81Check(doc2);
  assertEqual(result2.violations.length, 0, "No semicolon → no violation");
  console.log("  2. OK: no semicolon → no violations");

  // 3. Two semicolons in one sentence → 2 violations
  const doc3 = tokenizeText("Do step one; do step two; do step three.");
  const result3 = runSte81Check(doc3);
  assertEqual(result3.violations.length, 2, "Two semicolons → two violations");
  console.log("  3. OK: two semicolons → two violations");

  // 4. Position offsets point at the semicolon character
  const doc4 = tokenizeText("Hi; there.");
  const result4 = runSte81Check(doc4);
  assert(result4.violations.length >= 1, "At least one violation");
  const v = result4.violations[0];
  assert(v.positionEnd === v.positionStart + 1, "position spans one character");
  console.log("  4. OK: positionStart/End span single character");

  console.log("\nAll STE-8.1 engine tests passed.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
