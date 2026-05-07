/**
 * STE-9.1 engine unit tests (cross-references).
 *
 * Run: npx tsx scripts/test-ste91-engine.ts
 */

import { tokenizeText, runSte91Check } from "../app/lib/analysis";

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(`Assertion failed: ${message}`);
}

function assertEqual<T>(actual: T, expected: T, message: string): void {
  if (actual !== expected) {
    throw new Error(`${message}\n  Expected: ${expected}\n  Actual: ${actual}`);
  }
}

async function main(): Promise<void> {
  console.log("STE-9.1 engine tests\n");

  // 1. "Refer to the section that describes the tools" → violation (vague reference)
  const doc1 = tokenizeText("Refer to the section that describes the tools.");
  const result1 = runSte91Check(doc1);
  assert(result1.violations.length >= 1, "the section (vague) → violation");
  assert(result1.violations[0].ruleId === "STE-9.1", "ruleId STE-9.1");
  assert(result1.violations[0].suggestion.toLowerCase().includes("section"), "suggestion mentions Section");
  console.log("  1. OK: 'the section that describes...' → STE-9.1 violation");

  // 2. "See Section 4 for the tool list" → no violation (exact reference)
  const doc2 = tokenizeText("See Section 4 for the tool list.");
  const result2 = runSte91Check(doc2);
  assertEqual(result2.violations.length, 0, "Section 4 (exact) → no violation");
  console.log("  2. OK: 'See Section 4...' → no violation");

  // 3. "Refer to the figure above" → violation
  const doc3 = tokenizeText("Refer to the figure above.");
  const result3 = runSte91Check(doc3);
  assert(result3.violations.length >= 1, "the figure (vague) → violation");
  console.log("  3. OK: 'the figure above' → STE-9.1 violation");

  // 4. "See the table 2" → no violation (number follows)
  const doc4 = tokenizeText("See the table 2 for values.");
  const result4 = runSte91Check(doc4);
  assertEqual(result4.violations.length, 0, "the table 2 (has number) → no violation");
  console.log("  4. OK: 'the table 2' → no violation");

  console.log("\nAll STE-9.1 engine tests passed.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
