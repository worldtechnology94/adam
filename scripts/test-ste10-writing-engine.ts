/**
 * STE-10.3–10.7 (Writing practices) engine unit tests.
 *
 * Run: npx tsx scripts/test-ste10-writing-engine.ts
 */

import { tokenizeText, runSte10WritingCheck } from "../app/lib/analysis";

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(`Assertion failed: ${message}`);
}

function assertEqual<T>(actual: T, expected: T, message: string): void {
  if (actual !== expected) {
    throw new Error(`${message}\n  Expected: ${expected}\n  Actual: ${actual}`);
  }
}

async function main(): Promise<void> {
  console.log("STE-10.3–10.7 engine tests\n");

  // STE-10.3: & → violation
  const doc1 = tokenizeText("Open the valve and check the pressure.");
  const doc1b = tokenizeText("Open the valve & check the pressure.");
  const result1 = runSte10WritingCheck(doc1);
  const result1b = runSte10WritingCheck(doc1b);
  assertEqual(result1.violations.filter((v) => v.ruleId === "STE-10.3").length, 0, "No & → no 10.3");
  assert(result1b.violations.some((v) => v.ruleId === "STE-10.3" && v.reason === "symbol"), "& → STE-10.3");
  console.log("  1. OK: STE-10.3 — '&' → violation; 'and' → none");

  // STE-10.3: % → violation
  const doc2 = tokenizeText("The level is 50 percent.");
  const doc2b = tokenizeText("The level is 50%.");
  const result2b = runSte10WritingCheck(doc2b);
  assert(result2b.violations.some((v) => v.ruleId === "STE-10.3" && v.tokenRaw.includes("%")), "50% → STE-10.3");
  console.log("  2. OK: STE-10.3 — '%' → violation");

  // STE-10.4: British spelling → violation
  const doc3 = tokenizeText("Use the correct colour.");
  const result3 = runSte10WritingCheck(doc3);
  assert(result3.violations.some((v) => v.ruleId === "STE-10.4" && v.suggestion.includes("color")), "colour → STE-10.4");
  console.log("  3. OK: STE-10.4 — 'colour' → violation (suggest color)");

  // STE-10.6: ellipsis → violation
  const doc4 = tokenizeText("Wait for the signal...");
  const result4 = runSte10WritingCheck(doc4);
  assert(result4.violations.some((v) => v.ruleId === "STE-10.6" && v.reason === "ellipsis"), "ellipsis → STE-10.6");
  console.log("  4. OK: STE-10.6 — '...' → violation");

  // Clean sentence → no writing-practice violations
  const doc5 = tokenizeText("Open the valve. Check the pressure.");
  const result5 = runSte10WritingCheck(doc5);
  assertEqual(result5.violations.length, 0, "Clean → no 10.3–10.7 violations");
  console.log("  5. OK: Clean sentence → no violations");

  console.log("\nAll STE-10.3–10.7 engine tests passed.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
