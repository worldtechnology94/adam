/**
 * STE-5.3 engine unit tests (You + modal instruction pattern).
 *
 * Run: npx tsx scripts/test-ste53-engine.ts
 */

import { tokenizeText, runSte53Check } from "../app/lib/analysis";

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(`Assertion failed: ${message}`);
}

function assertEqual<T>(actual: T, expected: T, message: string): void {
  if (actual !== expected) {
    throw new Error(`${message}\n  Expected: ${expected}\n  Actual: ${actual}`);
  }
}

async function main(): Promise<void> {
  console.log("STE-5.3 engine tests\n");

  const d1 = tokenizeText("You must open the valve.", { applyPosHeuristic: true });
  const r1 = runSte53Check(d1);
  assertEqual(r1.violations.length, 1, "You must");
  assert(r1.violations[0].ruleId === "STE-5.3", "ruleId");

  const d2 = tokenizeText("Open the valve.", { applyPosHeuristic: true });
  const r2 = runSte53Check(d2);
  assertEqual(r2.violations.length, 0, "imperative");

  const d3 = tokenizeText("You should check the pressure.", { applyPosHeuristic: true });
  const r3 = runSte53Check(d3);
  assertEqual(r3.violations.length, 1, "You should");

  console.log("\nAll STE-5.3 engine tests passed.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
