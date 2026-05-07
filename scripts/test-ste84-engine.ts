/**
 * STE-8.4 engine unit tests (apostrophes — no contractions).
 *
 * Run: npx tsx scripts/test-ste84-engine.ts
 */

import { tokenizeText, runSte84Check } from "../app/lib/analysis";

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(`Assertion failed: ${message}`);
}

function assertEqual<T>(actual: T, expected: T, message: string): void {
  if (actual !== expected) {
    throw new Error(`${message}\n  Expected: ${expected}\n  Actual: ${actual}`);
  }
}

async function main(): Promise<void> {
  console.log("STE-8.4 engine tests\n");

  // 1. "don't" → violation
  const doc1 = tokenizeText("Do not use don't in procedures.");
  const result1 = runSte84Check(doc1);
  assert(result1.violations.length >= 1, "don't → violation");
  const v1 = result1.violations.find((v) => v.tokenNormalized === "don't" || v.tokenRaw.includes("don't"));
  assert(v1 != null, "violation for don't");
  assert(v1.ruleId === "STE-8.4", "ruleId STE-8.4");
  assert(v1.suggestion.includes("do not"), "suggestion has expansion");
  console.log("  1. OK: 'don't' → STE-8.4 violation");

  // 2. No contraction → no violation
  const doc2 = tokenizeText("Do not open the valve.");
  const result2 = runSte84Check(doc2);
  assertEqual(result2.violations.length, 0, "No contraction → no violation");
  console.log("  2. OK: 'Do not...' → no violation");

  // 3. "it's" → violation
  const doc3 = tokenizeText("It is correct. It's wrong.");
  const result3 = runSte84Check(doc3);
  assert(result3.violations.length >= 1, "it's → violation");
  assert(result3.violations.some((v) => v.reason === "contraction"), "reason contraction");
  console.log("  3. OK: 'It's' → STE-8.4 violation");

  // 4. "can't" → violation with "cannot"
  const doc4 = tokenizeText("You can't do that.");
  const result4 = runSte84Check(doc4);
  assert(result4.violations.length >= 1, "can't → violation");
  assert(result4.violations[0].suggestion.includes("cannot"), "suggestion cannot");
  console.log("  4. OK: 'can't' → STE-8.4 violation (cannot)");

  console.log("\nAll STE-8.4 engine tests passed.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
