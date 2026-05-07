/**
 * STE-4.1 engine unit tests (imperative in procedures).
 *
 * Run: npx tsx scripts/test-ste41-engine.ts
 */

import { tokenizeText, runSte41Check } from "../app/lib/analysis";

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(`Assertion failed: ${message}`);
}

function assertEqual<T>(actual: T, expected: T, message: string): void {
  if (actual !== expected) {
    throw new Error(`${message}\n  Expected: ${expected}\n  Actual: ${actual}`);
  }
}

async function main(): Promise<void> {
  console.log("STE-4.1 engine tests\n");

  // 1. "The technician should open" → violation (has "should", does not start with verb)
  const doc1 = tokenizeText("The technician should open the valve.", { applyPosHeuristic: true });
  const result1 = runSte41Check(doc1);
  assertEqual(result1.violations.length, 1, "Non-imperative procedure → one violation");
  assert(result1.violations[0].ruleId === "STE-4.1", "ruleId STE-4.1");
  assert(result1.violations[0].reason === "non_imperative_procedure", "reason");
  console.log("  1. OK: 'The technician should open...' → STE-4.1 violation");

  // 2. "Open the valve" → no violation (starts with verb = imperative)
  const doc2 = tokenizeText("Open the valve.", { applyPosHeuristic: true });
  const result2 = runSte41Check(doc2);
  assertEqual(result2.violations.length, 0, "Imperative → no violation");
  console.log("  2. OK: 'Open the valve.' → no violation");

  // 3. "You must check the pressure" → violation (has "must", starts with "You")
  const doc3 = tokenizeText("You must check the pressure.", { applyPosHeuristic: true });
  const result3 = runSte41Check(doc3);
  assert(result3.violations.length >= 1, "You must... → violation");
  console.log("  3. OK: 'You must check...' → STE-4.1 violation");

  // 4. No modal → no violation even if not imperative
  const doc4 = tokenizeText("The valve controls the flow.", { applyPosHeuristic: true });
  const result4 = runSte41Check(doc4);
  assertEqual(result4.violations.length, 0, "No modal → no STE-4.1 violation");
  console.log("  4. OK: descriptive sentence without modal → no violation");

  // 5. "Check the valve" → no violation (imperative, no modal needed)
  const doc5 = tokenizeText("Check the valve.", { applyPosHeuristic: true });
  const result5 = runSte41Check(doc5);
  assertEqual(result5.violations.length, 0, "Imperative → no violation");
  console.log("  5. OK: 'Check the valve.' → no violation");

  console.log("\nAll STE-4.1 engine tests passed.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
