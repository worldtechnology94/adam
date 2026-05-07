/**
 * STE-1.3 engine unit tests (approved meanings / pattern layer).
 *
 * Run: npx tsx scripts/test-ste13-engine.ts
 */

import { tokenizeText, runSte13Check, type DictionaryLookupResult } from "../app/lib/analysis";

const ABOUT_MEANINGS: NonNullable<DictionaryLookupResult["meanings"]> = [
  { meaning: "Concerned with", approvedAsIs: true, alternativeWord: null, alternativePos: null },
  {
    meaning: "APPROXIMATELY (adv)",
    approvedAsIs: false,
    alternativeWord: "APPROXIMATELY",
    alternativePos: "adv",
  },
  {
    meaning: "AROUND (prep)",
    approvedAsIs: false,
    alternativeWord: "AROUND",
    alternativePos: "prep",
  },
];

function mockLookup(map: Record<string, DictionaryLookupResult | null>) {
  return async (w: string) => map[w.trim().toLowerCase()] ?? null;
}

async function main() {
  console.log("STE-1.3 engine tests\n");

  const aboutEntry: DictionaryLookupResult = {
    found: true,
    word: "about",
    word_display: "ABOUT",
    pos: "prep",
    approved: true,
    alternatives: [
      { word: "APPROXIMATELY", pos: "adv" },
      { word: "AROUND", pos: "prep" },
    ],
    examples: [],
    allowedForms: ["about"],
    meanings: ABOUT_MEANINGS,
  };

  // 1. Approved sense — should not flag
  let doc = tokenizeText("FOR DATA ABOUT THE ENGINE, REFER TO THE MANUAL.", { applyPosHeuristic: true });
  let r = await runSte13Check(doc, mockLookup({ about: aboutEntry }));
  if (r.violations.length !== 0) {
    console.error("FAIL: expected 0 violations for ABOUT THE ENGINE, got", r.violations.length);
    process.exit(1);
  }
  console.log("  1. OK: ABOUT in 'concerned with' context → no STE-1.3");

  // 2. Approximation — should flag
  doc = tokenizeText("Drain about 2 liters of fuel from the tank.", { applyPosHeuristic: true });
  r = await runSte13Check(doc, mockLookup({ about: aboutEntry }));
  if (r.violations.length !== 1 || r.violations[0].suggestion.indexOf("APPROXIMATELY") === -1) {
    console.error("FAIL: expected 1 violation suggesting APPROXIMATELY, got", r.violations);
    process.exit(1);
  }
  console.log("  2. OK: 'about 2 liters' → STE-1.3, suggest APPROXIMATELY");

  // 3. Spatial — should flag
  doc = tokenizeText("Rotate the shaft about its axis.", { applyPosHeuristic: true });
  r = await runSte13Check(doc, mockLookup({ about: aboutEntry }));
  if (r.violations.length !== 1 || r.violations[0].suggestion.indexOf("AROUND") === -1) {
    console.error("FAIL: expected 1 violation suggesting AROUND, got", r.violations);
    process.exit(1);
  }
  console.log("  3. OK: 'about its axis' → STE-1.3, suggest AROUND");

  // 4. No meanings in lookup — no STE-1.3
  const noMeanings: DictionaryLookupResult = {
    ...aboutEntry,
    meanings: undefined,
  };
  doc = tokenizeText("Drain about 2 liters.", { applyPosHeuristic: true });
  r = await runSte13Check(doc, mockLookup({ about: noMeanings }));
  if (r.violations.length !== 0) {
    console.error("FAIL: expected 0 when meanings omitted");
    process.exit(1);
  }
  console.log("  4. OK: no meanings in lookup → no STE-1.3");

  console.log("\nAll STE-1.3 engine tests passed.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
