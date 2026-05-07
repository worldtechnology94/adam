/**
 * STE-4.2 engine unit tests (omitted words / sentence fragment).
 *
 * Run: npx tsx scripts/test-ste42-engine.ts
 */

import { tokenizeText, runSte42Check } from "../app/lib/analysis";

function assertEqual<T>(actual: T, expected: T, message: string): void {
  if (actual !== expected) {
    throw new Error(`${message}\n  Expected: ${expected}\n  Actual: ${actual}`);
  }
}

async function main(): Promise<void> {
  console.log("STE-4.2 engine tests\n");

  const doc1 = tokenizeText("Open the valve.");
  const r1 = runSte42Check(doc1);
  assertEqual(r1.violations.length, 0, "complete sentence");
  console.log("  1. OK: 'Open the valve' → no STE-4.2");

  const doc2 = tokenizeText("And open the valve.");
  const r2 = runSte42Check(doc2);
  assertEqual(r2.violations.length, 1, "And fragment");
  assertEqual(r2.violations[0].ruleId, "STE-4.2", "ruleId");
  assertEqual(r2.violations[0].reason, "sentence_fragment", "reason");
  console.log("  2. OK: 'And open…' → STE-4.2");

  const doc3 = tokenizeText("Open the valve and close it.");
  const r3 = runSte42Check(doc3);
  assertEqual(r3.violations.length, 0, "and in middle");
  console.log("  3. OK: '…and close…' → no STE-4.2");

  const doc4 = tokenizeText("But do not touch the surface.");
  const r4 = runSte42Check(doc4);
  assertEqual(r4.violations.length, 1, "But fragment");
  console.log("  4. OK: 'But do not…' → STE-4.2");

  const doc5 = tokenizeText("Or use the other tool.");
  const r5 = runSte42Check(doc5);
  assertEqual(r5.violations.length, 1, "Or fragment");
  console.log("  5. OK: 'Or use…' → STE-4.2");

  console.log("\nAll STE-4.2 engine tests passed.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
