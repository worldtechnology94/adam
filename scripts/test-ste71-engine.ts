/**
 * STE-7.1 engine unit tests (WARNING format).
 *
 * Run: npx tsx scripts/test-ste71-engine.ts
 */

import { tokenizeText, runSte71Check } from "../app/lib/analysis";

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(`Assertion failed: ${message}`);
}

function assertEqual<T>(actual: T, expected: T, message: string): void {
  if (actual !== expected) {
    throw new Error(`${message}\n  Expected: ${expected}\n  Actual: ${actual}`);
  }
}

async function main(): Promise<void> {
  console.log("STE-7.1 engine tests\n");

  // 1. "WARNING: Do not touch." → no violation (correct format)
  const doc1 = tokenizeText("WARNING: Do not touch the valve.");
  const result1 = runSte71Check(doc1);
  assertEqual(result1.violations.length, 0, "WARNING: at start → no violation");
  console.log("  1. OK: 'WARNING: Do not touch...' → no violation");

  // 2. "Warning: Do not touch." → violation (wrong case)
  const doc2 = tokenizeText("Warning: Do not touch the valve.");
  const result2 = runSte71Check(doc2);
  assertEqual(result2.violations.length, 1, "Warning: (wrong case) → one violation");
  assert(result2.violations[0].ruleId === "STE-7.1", "ruleId STE-7.1");
  assert(result2.violations[0].reason === "warning_format", "reason");
  console.log("  2. OK: 'Warning: ...' → STE-7.1 violation");

  // 3. "Caution: Do not touch." → violation
  const doc3 = tokenizeText("Caution: Do not touch the valve.");
  const result3 = runSte71Check(doc3);
  assertEqual(result3.violations.length, 1, "Caution: → one violation");
  console.log("  3. OK: 'Caution: ...' → STE-7.1 violation");

  // 4. "Danger: High voltage." → violation
  const doc4 = tokenizeText("Danger: High voltage.");
  const result4 = runSte71Check(doc4);
  assertEqual(result4.violations.length, 1, "Danger: → one violation");
  console.log("  4. OK: 'Danger: ...' → STE-7.1 violation");

  // 5. Ordinary sentence → no violation
  const doc5 = tokenizeText("Open the valve slowly.");
  const result5 = runSte71Check(doc5);
  assertEqual(result5.violations.length, 0, "No warning label → no violation");
  console.log("  5. OK: ordinary sentence → no violation");

  console.log("\nAll STE-7.1 engine tests passed.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
