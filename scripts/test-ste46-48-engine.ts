/**
 * STE-4.6 / STE-4.7 / STE-4.8 engine unit tests.
 *
 * Run: npx tsx scripts/test-ste46-48-engine.ts
 */

import { tokenizeText, runSte46Check, runSte47Check, runSte48Check } from "../app/lib/analysis";

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(`Assertion failed: ${message}`);
}

function assertEqual<T>(actual: T, expected: T, message: string): void {
  if (actual !== expected) {
    throw new Error(`${message}\n  Expected: ${expected}\n  Actual: ${actual}`);
  }
}

async function main(): Promise<void> {
  console.log("STE-4.6 / STE-4.7 / STE-4.8 engine tests\n");

  // --- STE-4.6 ---
  const d46a = tokenizeText("When the light is on open the valve.", { applyPosHeuristic: true });
  const r46a = runSte46Check(d46a);
  assertEqual(r46a.violations.length, 1, "STE-4.6 missing comma");
  assert(r46a.violations[0].ruleId === "STE-4.6", "ruleId 4.6");

  const d46b = tokenizeText("When the light is on, open the valve.", { applyPosHeuristic: true });
  const r46b = runSte46Check(d46b);
  assertEqual(r46b.violations.length, 0, "STE-4.6 has comma");

  const d46c = tokenizeText("When the light is on.", { applyPosHeuristic: true });
  const r46c = runSte46Check(d46c);
  assertEqual(r46c.violations.length, 0, "STE-4.6 short sentence");

  console.log("  STE-4.6: OK (lead-in comma heuristic)");

  // --- STE-4.7 ---
  const d47a = tokenizeText("NOTE: Open the valve.", { applyPosHeuristic: true });
  const r47a = runSte47Check(d47a);
  assertEqual(r47a.violations.length, 1, "STE-4.7 NOTE imperative");
  assert(r47a.violations[0].ruleId === "STE-4.7", "ruleId 4.7");

  const d47b = tokenizeText("NOTE: The pressure is high.", { applyPosHeuristic: true });
  const r47b = runSte47Check(d47b);
  assertEqual(r47b.violations.length, 0, "STE-4.7 descriptive note");

  const d47c = tokenizeText("NOTE: You must read the manual.", { applyPosHeuristic: true });
  const r47c = runSte47Check(d47c);
  assertEqual(r47c.violations.length, 1, "STE-4.7 NOTE you must");

  console.log("  STE-4.7: OK (NOTE: information only)");

  // --- STE-4.8 ---
  const d48a = tokenizeText("Tighten the bolts TBD.", { applyPosHeuristic: true });
  const r48a = runSte48Check(d48a);
  assertEqual(r48a.violations.length, 1, "STE-4.8 TBD");
  assert(r48a.violations[0].ruleId === "STE-4.8", "ruleId 4.8");

  const d48b = tokenizeText("The torque is TBD.", { applyPosHeuristic: true });
  const r48b = runSte48Check(d48b);
  assertEqual(r48b.violations.length, 0, "STE-4.8 descriptive TBD");

  console.log("  STE-4.8: OK (procedure completeness placeholders)");

  console.log("\nAll STE-4.6–4.8 engine tests passed.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
