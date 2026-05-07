/**
 * STE-8.2 engine unit tests (serial comma in lists).
 *
 * Run: npx tsx scripts/test-ste82-engine.ts
 */

import { tokenizeText, runSte82Check } from "../app/lib/analysis";

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(`Assertion failed: ${message}`);
}

function assertEqual<T>(actual: T, expected: T, message: string): void {
  if (actual !== expected) {
    throw new Error(`${message}\n  Expected: ${expected}\n  Actual: ${actual}`);
  }
}

async function main(): Promise<void> {
  console.log("STE-8.2 engine tests\n");

  // 1. "red, white and blue" → violation (missing comma before "and")
  const doc1 = tokenizeText("Use the red, white and blue valve.");
  const result1 = runSte82Check(doc1);
  assertEqual(result1.violations.length, 1, "Missing serial comma → one violation");
  assert(result1.violations[0].ruleId === "STE-8.2", "ruleId STE-8.2");
  assert(result1.violations[0].reason === "serial_comma", "reason");
  console.log("  1. OK: 'red, white and blue' → STE-8.2 violation");

  // 2. "red, white, and blue" → no violation (serial comma present)
  const doc2 = tokenizeText("Use the red, white, and blue valve.");
  const result2 = runSte82Check(doc2);
  assertEqual(result2.violations.length, 0, "Serial comma present → no violation");
  console.log("  2. OK: 'red, white, and blue' → no violation");

  // 3. "A or B" (no comma) → no violation (only two items)
  const doc3 = tokenizeText("Open the black or white valve.");
  const result3 = runSte82Check(doc3);
  assertEqual(result3.violations.length, 0, "No comma in list → no STE-8.2 violation");
  console.log("  3. OK: 'black or white' (no comma) → no violation");

  // 4. "one, two or three" → violation
  const doc4 = tokenizeText("Select one, two or three.");
  const result4 = runSte82Check(doc4);
  assert(result4.violations.length >= 1, "one, two or three → violation");
  console.log("  4. OK: 'one, two or three' → STE-8.2 violation");

  console.log("\nAll STE-8.2 engine tests passed.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
