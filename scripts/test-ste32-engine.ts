/**
 * STE-3.2 engine unit tests (no passive voice).
 *
 * Run: npx tsx scripts/test-ste32-engine.ts
 */

import { tokenizeText, runSte32Check } from "../app/lib/analysis";

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(`Assertion failed: ${message}`);
}

function assertEqual<T>(actual: T, expected: T, message: string): void {
  if (actual !== expected) {
    throw new Error(`${message}\n  Expected: ${expected}\n  Actual: ${actual}`);
  }
}

async function main(): Promise<void> {
  console.log("STE-3.2 engine tests\n");

  // 1. Passive: "was opened" → 1 violation
  const doc1 = tokenizeText("The valve was opened by the technician.");
  const result1 = runSte32Check(doc1);
  assertEqual(result1.violations.length, 1, "One passive construction → one violation");
  assert(result1.violations[0].ruleId === "STE-3.2", "ruleId STE-3.2");
  assert(result1.violations[0].reason === "passive_voice", "reason passive_voice");
  assert(result1.violations[0].tokenNormalized.includes("opened"), "excerpt includes participle");
  console.log("  1. OK: 'was opened' → STE-3.2 violation");

  // 2. Active imperative → no violation
  const doc2 = tokenizeText("Open the valve.");
  const result2 = runSte32Check(doc2);
  assertEqual(result2.violations.length, 0, "Active imperative → no violation");
  console.log("  2. OK: 'Open the valve.' → no violation");

  // 3. Passive with irregular participle "done" → 1 violation
  const doc3 = tokenizeText("The task was done quickly.");
  const result3 = runSte32Check(doc3);
  assert(result3.violations.length >= 1, "was done → violation");
  assert(result3.violations.some((v) => v.tokenNormalized.includes("done")), "token includes done");
  console.log("  3. OK: 'was done' → STE-3.2 violation");

  // 4. No be+participle → no violation
  const doc4 = tokenizeText("The valve is large.");
  const result4 = runSte32Check(doc4);
  assertEqual(result4.violations.length, 0, "'is large' is not passive (large is adj)");
  console.log("  4. OK: 'is large' → no violation");

  // 5. Two passives in one sentence → 2 violations
  const doc5 = tokenizeText("The valve was closed and the pump was stopped.");
  const result5 = runSte32Check(doc5);
  assertEqual(result5.violations.length, 2, "Two passives → two violations");
  console.log("  5. OK: two passives → two violations");

  console.log("\nAll STE-3.2 engine tests passed.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
