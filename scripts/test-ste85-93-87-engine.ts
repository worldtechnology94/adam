/**
 * STE-8.5 / STE-8.6 / STE-8.7 / STE-9.3 engine tests.
 *
 * Run: npx tsx scripts/test-ste85-93-87-engine.ts
 */

import { tokenizeText, runSte85Check, runSte86Check, runSte87Check, runSte93Check } from "../app/lib/analysis";

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(`Assertion failed: ${message}`);
}

function assertEqual<T>(actual: T, expected: T, message: string): void {
  if (actual !== expected) {
    throw new Error(`${message}\n  Expected: ${expected}\n  Actual: ${actual}`);
  }
}

async function main(): Promise<void> {
  console.log("STE-8.5 / 8.6 / 8.7 / STE-9.3 tests\n");

  const d85 = tokenizeText("Remove the valve(s) from the unit.", { applyPosHeuristic: true });
  const r85 = runSte85Check(d85);
  assertEqual(r85.violations.length, 1, "STE-8.5 valve(s)");
  assert(r85.violations[0].ruleId === "STE-8.5", "ruleId 8.5");

  const d86 = tokenizeText("Use \u201capproved\u201d wording only.", { applyPosHeuristic: true });
  const r86 = runSte86Check(d86);
  assertEqual(r86.violations.length, 1, "STE-8.6 smart quotes");
  assert(r86.violations[0].ruleId === "STE-8.6", "ruleId 8.6");

  const d87 = tokenizeText("Open the valve -- then close it.", { applyPosHeuristic: true });
  const r87 = runSte87Check(d87);
  assertEqual(r87.violations.length, 1, "STE-8.7 double hyphen");
  assert(r87.violations[0].ruleId === "STE-8.7", "ruleId 8.7");

  const d93 = tokenizeText("You must carry out the test.", { applyPosHeuristic: true });
  const r93 = runSte93Check(d93);
  assertEqual(r93.violations.length, 1, "STE-9.3 carry out");
  assert(r93.violations[0].ruleId === "STE-9.3", "ruleId 9.3");

  const d93b = tokenizeText("Make sure the valve is open.", { applyPosHeuristic: true });
  const r93b = runSte93Check(d93b);
  assertEqual(r93b.violations.length, 0, "make sure skipped");

  console.log("\nAll STE-8.5–8.7 / STE-9.3 engine tests passed.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
