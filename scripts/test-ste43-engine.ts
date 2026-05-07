/**
 * STE-4.3 engine unit tests (vertical list for complex text — heuristic).
 *
 * Run: npx tsx scripts/test-ste43-engine.ts
 */

import { tokenizeText, runSte43Check } from "../app/lib/analysis";

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(`Assertion failed: ${message}`);
}

function assertEqual<T>(actual: T, expected: T, message: string): void {
  if (actual !== expected) {
    throw new Error(`${message}\n  Expected: ${expected}\n  Actual: ${actual}`);
  }
}

async function main(): Promise<void> {
  console.log("STE-4.3 engine tests\n");

  const doc1 = tokenizeText("Open the valve.", { applyPosHeuristic: true });
  const r1 = runSte43Check(doc1);
  assertEqual(r1.violations.length, 0, "short imperative");
  console.log("  1. OK: short imperative → no STE-4.3");

  const longDense =
    "Remove the cover, disconnect the wiring, release the latch, inspect the area for damage, and make sure the surface is clean before you continue.";
  const doc2 = tokenizeText(longDense, { applyPosHeuristic: true });
  const r2 = runSte43Check(doc2);
  assertEqual(r2.violations.length, 1, "long comma-heavy imperative");
  assert(r2.violations[0].ruleId === "STE-4.3", "ruleId");
  console.log("  2. OK: long dense imperative → STE-4.3");

  const doc3 = tokenizeText("The valve is open, and the pressure is high.", { applyPosHeuristic: true });
  const r3 = runSte43Check(doc3);
  assertEqual(r3.violations.length, 0, "descriptive");
  console.log("  3. OK: descriptive → no STE-4.3");

  const doc4 = tokenizeText("- Remove the cover, then inspect the area.", { applyPosHeuristic: true });
  const r4 = runSte43Check(doc4);
  assertEqual(r4.violations.length, 0, "list-like line");
  console.log("  4. OK: list-like line → no STE-4.3");

  const doc5 = tokenizeText("WARNING: Remove the cover, disconnect the wiring, release the latch, inspect the area for damage, and make sure the surface is clean.", {
    applyPosHeuristic: true,
  });
  const r5 = runSte43Check(doc5);
  assertEqual(r5.violations.length, 0, "warning line");
  console.log("  5. OK: WARNING: line → no STE-4.3 (warning_like)");

  console.log("\nAll STE-4.3 engine tests passed.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
