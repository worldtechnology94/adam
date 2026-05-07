/**
 * STE-7.4 / STE-7.5 engine unit tests.
 *
 * Run: npx tsx scripts/test-ste74-75-engine.ts
 */

import { tokenizeText, runSte74Check, runSte75Check } from "../app/lib/analysis";

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(`Assertion failed: ${message}`);
}

function assertEqual<T>(actual: T, expected: T, message: string): void {
  if (actual !== expected) {
    throw new Error(`${message}\n  Expected: ${expected}\n  Actual: ${actual}`);
  }
}

async function main(): Promise<void> {
  console.log("STE-7.4 / STE-7.5 engine tests\n");

  const d74a = tokenizeText("WARNING: Perhaps the surface is hot.", { applyPosHeuristic: true });
  const r74a = runSte74Check(d74a);
  assertEqual(r74a.violations.length, 1, "STE-7.4 vague hedging");
  assert(r74a.violations[0].ruleId === "STE-7.4", "ruleId 7.4");

  const d74b = tokenizeText("WARNING: Do not touch the hot surface.", { applyPosHeuristic: true });
  const r74b = runSte74Check(d74b);
  assertEqual(r74b.violations.length, 0, "STE-7.4 clear text");

  const d75a = tokenizeText("WARNING: See Figure 4.", { applyPosHeuristic: true });
  const r75a = runSte75Check(d75a);
  assertEqual(r75a.violations.length, 1, "STE-7.5 reference only");
  assert(r75a.violations[0].ruleId === "STE-7.5", "ruleId 7.5");

  const d75b = tokenizeText("WARNING: Do not touch the surface. See Figure 4.", { applyPosHeuristic: true });
  const r75b = runSte75Check(d75b);
  assertEqual(r75b.violations.length, 0, "STE-7.5 substantive + ref");

  console.log("\nAll STE-7.4 / STE-7.5 engine tests passed.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
