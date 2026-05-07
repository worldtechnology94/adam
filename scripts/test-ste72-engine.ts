/**
 * STE-7.2 engine unit tests (safety instruction: command or condition first).
 *
 * Run: npx tsx scripts/test-ste72-engine.ts
 */

import { tokenizeText, runSte72Check } from "../app/lib/analysis";

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(`Assertion failed: ${message}`);
}

function assertEqual<T>(actual: T, expected: T, message: string): void {
  if (actual !== expected) {
    throw new Error(`${message}\n  Expected: ${expected}\n  Actual: ${actual}`);
  }
}

async function main(): Promise<void> {
  console.log("STE-7.2 engine tests\n");

  // 1. Clear command after label → no violation
  const doc1 = tokenizeText("WARNING: Do not touch the hot surface.");
  const r1 = runSte72Check(doc1);
  assertEqual(r1.violations.length, 0, "imperative after WARNING:");
  console.log("  1. OK: WARNING: Do not touch… → no STE-7.2");

  // 2. Weak lead-in → violation
  const doc2 = tokenizeText("WARNING: Note that the surface can be very hot.");
  const r2 = runSte72Check(doc2);
  assertEqual(r2.violations.length, 1, "Note that → one violation");
  assert(r2.violations[0].ruleId === "STE-7.2", "ruleId");
  assert(r2.violations[0].reason === "safety_lead_in", "reason");
  console.log("  2. OK: WARNING: Note that… → STE-7.2");

  // 3. CAUTION with weak lead-in
  const doc3 = tokenizeText("CAUTION: It is important to stay clear of the rotor.");
  const r3 = runSte72Check(doc3);
  assertEqual(r3.violations.length, 1, "It is important");
  console.log("  3. OK: CAUTION: It is important… → STE-7.2");

  // 4. Condition with If → pass (no weak lead-in)
  const doc4 = tokenizeText("WARNING: If the light is on, do not remove the cover.");
  const r4 = runSte72Check(doc4);
  assertEqual(r4.violations.length, 0, "If-condition");
  console.log("  4. OK: WARNING: If the light… → no STE-7.2");

  // 5. No safety label
  const doc5 = tokenizeText("Do not touch the valve.");
  const r5 = runSte72Check(doc5);
  assertEqual(r5.violations.length, 0, "no label");
  console.log("  5. OK: no WARNING/CAUTION/DANGER → no STE-7.2");

  console.log("\nAll STE-7.2 engine tests passed.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
