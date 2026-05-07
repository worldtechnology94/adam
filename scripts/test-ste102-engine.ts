/**
 * STE-10.2 engine unit tests (abbreviations).
 *
 * Run: npx tsx scripts/test-ste102-engine.ts
 */

import { tokenizeText, runSte102Check } from "../app/lib/analysis";

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(`Assertion failed: ${message}`);
}

function assertEqual<T>(actual: T, expected: T, message: string): void {
  if (actual !== expected) {
    throw new Error(`${message}\n  Expected: ${expected}\n  Actual: ${actual}`);
  }
}

async function main(): Promise<void> {
  console.log("STE-10.2 engine tests\n");

  // 1. "e.g." → violation
  const doc1 = tokenizeText("Use the correct tool, e.g. the wrench.");
  const result1 = runSte102Check(doc1);
  assert(result1.violations.length >= 1, "e.g. → violation");
  assert(result1.violations[0].ruleId === "STE-10.2", "ruleId STE-10.2");
  assert(result1.violations[0].suggestion.includes("for example"), "suggestion has full form");
  console.log("  1. OK: 'e.g.' → STE-10.2 violation");

  // 2. "for example" → no violation
  const doc2 = tokenizeText("Use the correct tool, for example the wrench.");
  const result2 = runSte102Check(doc2);
  assertEqual(result2.violations.length, 0, "for example → no violation");
  console.log("  2. OK: 'for example' → no violation");

  // 3. "i.e." → violation
  const doc3 = tokenizeText("The unit is ready, i.e. you can start.");
  const result3 = runSte102Check(doc3);
  assert(result3.violations.length >= 1, "i.e. → violation");
  assert(result3.violations[0].suggestion.includes("that is"), "suggestion that is");
  console.log("  3. OK: 'i.e.' → STE-10.2 violation");

  // 4. "etc." → violation
  const doc4 = tokenizeText("Tools include wrenches, screwdrivers, etc.");
  const result4 = runSte102Check(doc4);
  assert(result4.violations.length >= 1, "etc. → violation");
  console.log("  4. OK: 'etc.' → STE-10.2 violation");

  console.log("\nAll STE-10.2 engine tests passed.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
