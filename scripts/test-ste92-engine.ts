/**
 * STE-9.2 engine unit tests (reference format).
 *
 * Run: npx tsx scripts/test-ste92-engine.ts
 */

import { tokenizeText, runSte92Check } from "../app/lib/analysis";

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(`Assertion failed: ${message}`);
}

function assertEqual<T>(actual: T, expected: T, message: string): void {
  if (actual !== expected) {
    throw new Error(`${message}\n  Expected: ${expected}\n  Actual: ${actual}`);
  }
}

async function main(): Promise<void> {
  console.log("STE-9.2 engine tests\n");

  // 1. "see section 4" (lowercase) → violation
  const doc1 = tokenizeText("See section 4 for the tool list.");
  const result1 = runSte92Check(doc1);
  assert(result1.violations.length >= 1, "section 4 (lowercase) → violation");
  assert(result1.violations[0].ruleId === "STE-9.2", "ruleId STE-9.2");
  assert(result1.violations[0].suggestion.includes("Section"), "suggestion has Section");
  console.log("  1. OK: 'section 4' → STE-9.2 violation");

  // 2. "See Section 4" (capitalized) → no violation
  const doc2 = tokenizeText("See Section 4 for the tool list.");
  const result2 = runSte92Check(doc2);
  assertEqual(result2.violations.length, 0, "Section 4 (capitalized) → no violation");
  console.log("  2. OK: 'Section 4' → no violation");

  // 3. "figure 2" (lowercase) → violation
  const doc3 = tokenizeText("Refer to figure 2.");
  const result3 = runSte92Check(doc3);
  assert(result3.violations.length >= 1, "figure 2 → violation");
  console.log("  3. OK: 'figure 2' → STE-9.2 violation");

  // 4. "the section" without number → no STE-9.2 violation (may be STE-9.1)
  const doc4 = tokenizeText("Refer to the section above.");
  const result4 = runSte92Check(doc4);
  assertEqual(result4.violations.length, 0, "the section (no number) → no STE-9.2");
  console.log("  4. OK: 'the section above' → no STE-9.2 violation");

  console.log("\nAll STE-9.2 engine tests passed.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
