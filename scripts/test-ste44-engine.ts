/**
 * STE-4.4 engine unit tests (connecting words — heuristics).
 *
 * Run: npx tsx scripts/test-ste44-engine.ts
 */

import { tokenizeText, runSte44Check } from "../app/lib/analysis";

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(`Assertion failed: ${message}`);
}

function assertEqual<T>(actual: T, expected: T, message: string): void {
  if (actual !== expected) {
    throw new Error(`${message}\n  Expected: ${expected}\n  Actual: ${actual}`);
  }
}

async function main(): Promise<void> {
  console.log("STE-4.4 engine tests\n");

  const doc1 = tokenizeText("Open the valve. Also close the drain.", { applyPosHeuristic: true });
  const r1 = runSte44Check(doc1);
  assertEqual(r1.violations.length, 1, "weak Also after imperative");
  assert(r1.violations[0].reason === "weak_sentence_connector", "reason weak");
  console.log("  1. OK: 'Also…' after prior sentence → STE-4.4 (weak opener)");

  const doc2 = tokenizeText("Also open the valve.", { applyPosHeuristic: true });
  const r2 = runSte44Check(doc2);
  assertEqual(r2.violations.length, 0, "first sentence Also — no prior");
  console.log("  2. OK: first sentence starting with Also → no STE-4.4");

  const doc3 = tokenizeText("The valve is open. The valve is closed.", { applyPosHeuristic: true });
  const r3 = runSte44Check(doc3);
  assertEqual(r3.violations.length, 1, "repeated The + noun");
  assert(r3.violations[0].reason === "repeated_article_noun_pair", "reason repeat");
  console.log("  3. OK: 'The valve … The valve …' → STE-4.4 (repeat)");

  const doc4 = tokenizeText("The valve is open. The switch is closed.", { applyPosHeuristic: true });
  const r4 = runSte44Check(doc4);
  assertEqual(r4.violations.length, 0, "different second noun");
  console.log("  4. OK: different nouns → no repeat violation");

  const doc5 = tokenizeText(
    "The pressure is high. Furthermore the indicator shows a fault.",
    { applyPosHeuristic: true }
  );
  const r5 = runSte44Check(doc5);
  assertEqual(r5.violations.length, 1, "Furthermore");
  console.log("  5. OK: Furthermore → weak opener");

  const doc6 = tokenizeText("WARNING: Do not touch. Furthermore do not operate.", { applyPosHeuristic: true });
  const r6 = runSte44Check(doc6);
  assertEqual(r6.violations.length, 0, "skip after WARNING block for weak");
  console.log("  6. OK: sentence after WARNING: not flagged (warning_like handling)");

  console.log("\nAll STE-4.4 engine tests passed.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
