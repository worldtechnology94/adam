/**
 * STE-6.1 + paragraph helper tests.
 *
 * Run: npx tsx scripts/test-ste61-engine.ts
 */

import { tokenizeText, runSte61Check, getParagraphSpans, paragraphIndexForOffset } from "../app/lib/analysis";

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(`Assertion failed: ${message}`);
}

function assertEqual<T>(actual: T, expected: T, message: string): void {
  if (actual !== expected) {
    throw new Error(`${message}\n  Expected: ${expected}\n  Actual: ${actual}`);
  }
}

async function main(): Promise<void> {
  console.log("STE-6.1 / paragraph tests\n");

  const text = "One.\nTwo.";
  const spans = getParagraphSpans(text);
  assertEqual(spans.length, 1, "single paragraph (no blank line)");
  const spans2 = getParagraphSpans("First para.\n\nSecond para.");
  assertEqual(spans2.length, 2, "blank line splits paragraphs");
  assertEqual(paragraphIndexForOffset(spans2, 0), 0, "start in para 0");
  assertEqual(paragraphIndexForOffset(spans2, spans2[1]!.startOffset), 1, "start of second para");

  const doc = tokenizeText(text, { applyPosHeuristic: true });
  assert(doc.sentences.length >= 2, "two sentences in one paragraph");
  const r = runSte61Check(doc);
  assertEqual(r.violations.length, 1, "short first sentence in multi-sentence para");
  assert(r.violations[0].ruleId === "STE-6.1", "ruleId");

  const doc2 = tokenizeText("One two three four.\n\nNext paragraph.", { applyPosHeuristic: true });
  const r2 = runSte61Check(doc2);
  assertEqual(r2.violations.length, 0, "single sentence per para");

  console.log("\nAll STE-6.1 engine tests passed.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
