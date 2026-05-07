/**
 * STE-2.1 engine unit tests (noun cluster length).
 *
 * Run: npx tsx scripts/test-ste21-engine.ts
 *
 * Uses POS heuristic: art (the, a), adj (-al, -ive, etc.), n (-tion, -ism, etc.).
 * A 4+ word run of art/adj/n triggers STE-2.1.
 */

import { tokenizeText, runSte21Check } from "../app/lib/analysis";

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(`Assertion failed: ${message}`);
}

function assertEqual<T>(actual: T, expected: T, message: string): void {
  if (actual !== expected) {
    throw new Error(`${message}\n  Expected: ${expected}\n  Actual: ${actual}`);
  }
}

async function main(): Promise<void> {
  console.log("STE-2.1 engine tests\n");

  // 1. Short noun cluster (e.g. "the valve") → no violation
  const doc1 = tokenizeText("Open the valve.", { applyPosHeuristic: true });
  const result1 = runSte21Check(doc1);
  assertEqual(result1.violations.length, 0, "Short cluster → no violation");
  console.log("  1. OK: 'Open the valve.' → no violation");

  // 2. Four-word noun cluster: "the internal rotation mechanism" (art, adj, n, n)
  const doc2 = tokenizeText("Check the internal rotation mechanism.", { applyPosHeuristic: true });
  const result2 = runSte21Check(doc2);
  assert(result2.violations.length >= 1, "4-word noun cluster → violation");
  assert(result2.violations.some((v) => v.ruleId === "STE-2.1" && v.reason === "noun_cluster_too_long"), "STE-2.1 noun_cluster_too_long");
  console.log("  2. OK: 'the internal rotation mechanism' (4 words) → STE-2.1 violation");

  // 3. Exactly 3 words in cluster → no violation
  const doc3 = tokenizeText("Open the internal valve.", { applyPosHeuristic: true });
  const result3 = runSte21Check(doc3);
  assertEqual(result3.violations.length, 0, "3-word cluster → no violation");
  console.log("  3. OK: 'the internal valve' (3 words) → no violation");

  // 4. Violation includes cluster excerpt and position
  const v = result2.violations[0];
  assert(v.positionStart < v.positionEnd, "Position spans cluster");
  assert(v.tokenRaw.length > 0, "tokenRaw has cluster text");
  console.log("  4. OK: violation has position and excerpt");

  console.log("\nAll STE-2.1 engine tests passed.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
