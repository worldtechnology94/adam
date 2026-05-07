/**
 * STE-4.5 engine unit tests (article or demonstrative before a noun).
 *
 * Run: npx tsx scripts/test-ste45-engine.ts
 */

import { tokenizeText, runSte45Check } from "../app/lib/analysis";

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(`Assertion failed: ${message}`);
}

function assertEqual<T>(actual: T, expected: T, message: string): void {
  if (actual !== expected) {
    throw new Error(`${message}\n  Expected: ${expected}\n  Actual: ${actual}`);
  }
}

async function main(): Promise<void> {
  console.log("STE-4.5 engine tests\n");

  const doc1 = tokenizeText("Open the valve.", { applyPosHeuristic: true });
  const r1 = runSte45Check(doc1);
  assertEqual(r1.violations.length, 0, "Open the valve");
  console.log("  1. OK: 'Open the valve' → no STE-4.5");

  const doc2 = tokenizeText("Open valve.", { applyPosHeuristic: true });
  const r2 = runSte45Check(doc2);
  assertEqual(r2.violations.length, 1, "Open valve");
  assert(r2.violations[0].ruleId === "STE-4.5", "ruleId");
  assert(r2.violations[0].tokenNormalized.toLowerCase() === "valve", "highlights valve");
  console.log("  2. OK: 'Open valve' → STE-4.5");

  const doc3 = tokenizeText("Open carefully.", { applyPosHeuristic: true });
  const r3 = runSte45Check(doc3);
  assertEqual(r3.violations.length, 0, "adverb");
  console.log("  3. OK: 'Open carefully' → no STE-4.5");

  const doc4 = tokenizeText("The valve is open.", { applyPosHeuristic: true });
  const r4 = runSte45Check(doc4);
  assertEqual(r4.violations.length, 0, "not instructional");
  console.log("  4. OK: descriptive sentence → no STE-4.5");

  const doc5 = tokenizeText("Remove connection.", { applyPosHeuristic: true });
  const r5 = runSte45Check(doc5);
  assertEqual(r5.violations.length, 1, "Remove connection");
  console.log("  5. OK: 'Remove connection' → STE-4.5");

  const doc6 = tokenizeText("Make sure the valve is open.", { applyPosHeuristic: true });
  const r6 = runSte45Check(doc6);
  assertEqual(r6.violations.length, 0, "Make sure");
  console.log("  6. OK: 'Make sure…' → no STE-4.5");

  console.log("\nAll STE-4.5 engine tests passed.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
