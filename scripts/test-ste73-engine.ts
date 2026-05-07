/**
 * STE-7.3 engine unit tests (risk or possible result explained).
 *
 * Run: npx tsx scripts/test-ste73-engine.ts
 */

import { tokenizeText, runSte73Check } from "../app/lib/analysis";

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(`Assertion failed: ${message}`);
}

function assertEqual<T>(actual: T, expected: T, message: string): void {
  if (actual !== expected) {
    throw new Error(`${message}\n  Expected: ${expected}\n  Actual: ${actual}`);
  }
}

async function main(): Promise<void> {
  console.log("STE-7.3 engine tests\n");

  // 1. Short body → no violation (below word threshold)
  const doc1 = tokenizeText("WARNING: Do not touch the hot surface.");
  const r1 = runSte73Check(doc1);
  assertEqual(r1.violations.length, 0, "short warning");
  console.log("  1. OK: short WARNING → no STE-7.3");

  // 2. Long procedural text without risk vocabulary → violation
  const longNoRisk =
    "WARNING: Make sure you remove all tools from the work area before you start the engine and check the area for loose objects.";
  const doc2 = tokenizeText(longNoRisk);
  const r2 = runSte73Check(doc2);
  assertEqual(r2.violations.length, 1, "long without risk words");
  assert(r2.violations[0].ruleId === "STE-7.3", "ruleId");
  assert(r2.violations[0].reason === "missing_risk_explanation", "reason");
  console.log("  2. OK: long text without risk/outcome wording → STE-7.3");

  // 3. Mentions injury → pass
  const doc3 = tokenizeText(
    "WARNING: You can get an injury if you do not use the guard when you operate the machine."
  );
  const r3 = runSte73Check(doc3);
  assertEqual(r3.violations.length, 0, "injury mentioned");
  console.log("  3. OK: mentions injury → no STE-7.3");

  // 4. Starts with If → pass (condition)
  const doc4 = tokenizeText(
    "WARNING: If the light is on, do not remove the cover while the system runs in test mode."
  );
  const r4 = runSte73Check(doc4);
  assertEqual(r4.violations.length, 0, "If condition");
  console.log("  4. OK: If-condition opener → no STE-7.3");

  // 5. No safety label
  const doc5 = tokenizeText("Remove all tools before you start the engine.");
  const r5 = runSte73Check(doc5);
  assertEqual(r5.violations.length, 0, "no label");
  console.log("  5. OK: no safety label → no STE-7.3");

  // 6. Weak lead-in (STE-7.2 territory) → ste73 skips
  const doc6 = tokenizeText(
    "WARNING: Note that the surface can be very hot during operation and you must stay clear of the area at all times."
  );
  const r6 = runSte73Check(doc6);
  assertEqual(r6.violations.length, 0, "weak lead-in skipped");
  console.log("  6. OK: Note that lead-in → skipped by STE-7.3 (STE-7.2 scope)");

  console.log("\nAll STE-7.3 engine tests passed.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
