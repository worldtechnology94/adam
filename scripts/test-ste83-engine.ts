/**
 * STE-8.3 engine unit tests (hyphens — compound numbers).
 *
 * Run: npx tsx scripts/test-ste83-engine.ts
 */

import { tokenizeText, runSte83Check } from "../app/lib/analysis";

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(`Assertion failed: ${message}`);
}

function assertEqual<T>(actual: T, expected: T, message: string): void {
  if (actual !== expected) {
    throw new Error(`${message}\n  Expected: ${expected}\n  Actual: ${actual}`);
  }
}

async function main(): Promise<void> {
  console.log("STE-8.3 engine tests\n");

  // 1. "twenty one" → violation (should be twenty-one)
  const doc1 = tokenizeText("Set the value to twenty one.");
  const result1 = runSte83Check(doc1);
  assertEqual(result1.violations.length, 1, "twenty one → one violation");
  assert(result1.violations[0].ruleId === "STE-8.3", "ruleId STE-8.3");
  assert(result1.violations[0].suggestion.includes("twenty-one"), "suggestion has hyphenated form");
  console.log("  1. OK: 'twenty one' → STE-8.3 violation");

  // 2. "twenty-one" is one token or already hyphenated → no violation (tokenizer may split "twenty-one" as one token)
  const doc2 = tokenizeText("Set the value to twenty-one.");
  const result2 = runSte83Check(doc2);
  assertEqual(result2.violations.length, 0, "twenty-one (hyphenated) → no violation");
  console.log("  2. OK: 'twenty-one' → no violation");

  // 3. "thirty five" → violation
  const doc3 = tokenizeText("There are thirty five units.");
  const result3 = runSte83Check(doc3);
  assert(result3.violations.length >= 1, "thirty five → violation");
  assert(result3.violations[0].tokenNormalized.includes("thirty"), "excerpt includes thirty");
  console.log("  3. OK: 'thirty five' → STE-8.3 violation");

  // 4. "twenty" alone (no unit following) → no violation
  const doc4 = tokenizeText("About twenty units remain.");
  const result4 = runSte83Check(doc4);
  assertEqual(result4.violations.length, 0, "twenty alone → no violation");
  console.log("  4. OK: 'twenty' alone → no violation");

  console.log("\nAll STE-8.3 engine tests passed.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
