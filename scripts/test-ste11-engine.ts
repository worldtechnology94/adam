/**
 * T2.2 — STE-1.1 engine unit tests (5–10 hand-picked sentences).
 *
 * Run: npx tsx scripts/test-ste11-engine.ts
 *
 * Uses a mock dictionary lookup so tests do not require the database.
 * Verifies: unknown word → violation; forbidden word (e.g. utilize) → violation + "use";
 * approved word (e.g. use) → no violation.
 */

import { tokenizeText, runSte11Check, type DictionaryLookupResult } from "../app/lib/analysis";

/** Mock lookup: known words return an entry; others return null. */
function createMockLookup(): (word: string) => Promise<DictionaryLookupResult | null> {
  const dict: Record<string, DictionaryLookupResult> = {
    the: {
      found: true,
      word: "the",
      approved: true,
      pos: "art",
      alternatives: [],
      examples: [],
    },
    a: {
      found: true,
      word: "a",
      approved: true,
      pos: "art",
      alternatives: [],
      examples: [],
    },
    technician: {
      found: true,
      word: "technician",
      approved: true,
      pos: "n",
      alternatives: [],
      examples: [],
    },
    utilized: {
      found: true,
      word: "utilize",
      approved: false,
      pos: "v",
      alternatives: [{ word: "use", pos: "v" }],
      examples: [
        { ste: "USE THE TOOL.", non_ste: "Utilize the tool." },
      ],
    },
    utilize: {
      found: true,
      word: "utilize",
      approved: false,
      pos: "v",
      alternatives: [{ word: "use", pos: "v" }],
      examples: [{ ste: "USE THE TOOL.", non_ste: "Utilize the tool." }],
    },
    tool: {
      found: true,
      word: "tool",
      approved: true,
      pos: "n",
      alternatives: [],
      examples: [],
    },
    use: {
      found: true,
      word: "use",
      approved: true,
      pos: "v",
      alternatives: [],
      examples: [],
    },
    prior: {
      found: true,
      word: "prior",
      approved: false,
      pos: "prep",
      alternatives: [{ word: "before", pos: "prep" }],
      examples: [],
    },
    check: {
      found: true,
      word: "check",
      approved: true,
      pos: "v",
      alternatives: [],
      examples: [],
    },
    valve: {
      found: true,
      word: "valve",
      approved: true,
      pos: "n",
      alternatives: [],
      examples: [],
    },
    good: {
      found: true,
      word: "good",
      approved: false,
      pos: "adj",
      alternatives: [{ word: "satisfactory", pos: "adj" }],
      examples: [],
    },
    and: {
      found: true,
      word: "and",
      approved: true,
      pos: "conj",
      alternatives: [],
      examples: [],
    },
    is: {
      found: true,
      word: "be",
      approved: true,
      pos: "v",
      alternatives: [],
      examples: [],
    },
    to: {
      found: true,
      word: "to",
      approved: true,
      pos: "prep",
      alternatives: [],
      examples: [],
    },
    broken: {
      found: true,
      word: "broken",
      approved: true,
      pos: "adj",
      alternatives: [],
      examples: [],
    },
    // STE-1.5: "runned" is not an approved form of "run" (simulates stem-based resolution or partial forms)
    runned: {
      found: true,
      word: "run",
      approved: true,
      pos: "v",
      alternatives: [],
      examples: [],
      allowedForms: ["run", "runs", "running", "ran"],
    },
    run: {
      found: true,
      word: "run",
      approved: true,
      pos: "v",
      alternatives: [],
      examples: [],
      allowedForms: ["run", "runs", "running", "ran"],
    },
    hot: {
      found: true,
      word: "hot",
      approved: true,
      pos: "adj",
      alternatives: [],
      examples: [],
    },
  };

  return async (word: string) => dict[word] ?? null;
}

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(`Assertion failed: ${message}`);
}

function assertEqual<T>(actual: T, expected: T, message: string): void {
  if (actual !== expected) {
    throw new Error(`${message}\n  Expected: ${expected}\n  Actual: ${actual}`);
  }
}

async function main(): Promise<void> {
  const lookup = createMockLookup();

  console.log("T2.2 STE-1.1 engine tests\n");

  // 1. "The technician utilized the tool." → 1 violation: utilize → use
  const doc1 = tokenizeText("The technician utilized the tool.", { applyPosHeuristic: true });
  const result1 = await runSte11Check(doc1, lookup);
  const utilViolation = result1.violations.find((v) => v.tokenNormalized === "utilized");
  assert(utilViolation != null, "Should flag 'utilized'");
  assert(utilViolation.reason === "forbidden_word", "Reason forbidden_word");
  assertEqual(utilViolation.ruleId, "STE-1.2", "Prohibited word → STE-1.2");
  assert(utilViolation.suggestion.toLowerCase().includes("use"), "Suggestion should mention 'use'");
  assertEqual(result1.violations.length, 1, "Exactly one violation");
  console.log("  1. OK: 'utilized' → STE-1.2 violation, suggestion 'use'");

  // 2. "Prior to use, check the valve." → 1 violation: prior → before
  const doc2 = tokenizeText("Prior to use, check the valve.", { applyPosHeuristic: true });
  const result2 = await runSte11Check(doc2, lookup);
  const priorViolation = result2.violations.find((v) => v.tokenNormalized === "prior");
  assert(priorViolation != null, "Should flag 'prior'");
  assertEqual(priorViolation.ruleId, "STE-1.2", "Prohibited 'prior' → STE-1.2");
  assert(priorViolation.suggestion.toLowerCase().includes("before"), "Suggestion should mention 'before'");
  assertEqual(result2.violations.length, 1, "Exactly one violation");
  console.log("  2. OK: 'prior' → STE-1.2 violation, suggestion 'before'");

  // 3. "Use the tool." → 0 violations
  const doc3 = tokenizeText("Use the tool.", { applyPosHeuristic: true });
  const result3 = await runSte11Check(doc3, lookup);
  assertEqual(result3.violations.length, 0, "No violations for approved sentence");
  console.log("  3. OK: 'Use the tool.' → no violations");

  // 4. Unknown word → violation
  const doc4 = tokenizeText("The xyzz is broken.", { applyPosHeuristic: true });
  const result4 = await runSte11Check(doc4, lookup);
  const unknownViolation = result4.violations.find((v) => v.tokenNormalized === "xyzz");
  assert(unknownViolation != null, "Should flag unknown 'xyzz'");
  assert(unknownViolation.reason === "unknown_word", "Reason unknown_word");
  assertEqual(unknownViolation.ruleId, "STE-1.1", "Unknown word → STE-1.1");
  assertEqual(result4.violations.length, 1, "Exactly one violation");
  console.log("  4. OK: unknown 'xyzz' → STE-1.1 violation (unknown_word)");

  // 5. "The valve is good." → 1 violation: good → satisfactory
  const doc5 = tokenizeText("The valve is good.", { applyPosHeuristic: true });
  const result5 = await runSte11Check(doc5, lookup);
  const goodViolation = result5.violations.find((v) => v.tokenNormalized === "good");
  assert(goodViolation != null, "Should flag 'good'");
  assertEqual(goodViolation.ruleId, "STE-1.2", "Prohibited 'good' → STE-1.2");
  assert(goodViolation.suggestion.toLowerCase().includes("satisfactory"), "Suggestion satisfactory");
  console.log("  5. OK: 'good' → STE-1.2 violation, suggestion 'satisfactory'");

  // 6. "Utilize and prior to use." → 2 violations
  const doc6 = tokenizeText("Utilize and prior to use.", { applyPosHeuristic: true });
  const result6 = await runSte11Check(doc6, lookup);
  assert(result6.violations.length >= 2, "At least 2 violations (utilize, prior)");
  assert(result6.violations.some((v) => v.tokenNormalized === "utilize"), "Flag utilize");
  assert(result6.violations.some((v) => v.tokenNormalized === "prior"), "Flag prior");
  console.log("  6. OK: 'Utilize and prior to use.' → 2 violations");

  // 7. Compliance score decreases with violations
  assert(result3.complianceScore === 100, "No violations → score 100");
  assert(result1.complianceScore < 100, "One violation → score < 100");
  console.log("  7. OK: compliance score 100 when no violations, < 100 with violations");

  // 8. Numbers skipped (no violation for bare digits)
  const doc8 = tokenizeText("Set value to 42.", { applyPosHeuristic: true });
  const result8 = await runSte11Check(doc8, lookup);
  const fortyTwoViolation = result8.violations.find((v) => v.tokenNormalized === "42");
  assert(fortyTwoViolation == null, "Should not flag numeric token 42");
  console.log("  8. OK: numeric token 42 skipped");

  // 9. STE-1.5: token not in allowed forms → violation
  const doc9 = tokenizeText("The valve runned hot.", { applyPosHeuristic: true });
  const result9 = await runSte11Check(doc9, lookup);
  const runnedViolation = result9.violations.find((v) => v.tokenNormalized === "runned");
  assert(runnedViolation != null, "Should flag 'runned' as wrong form");
  assertEqual(runnedViolation.ruleId, "STE-3.1", "Verb wrong form → STE-3.1");
  assert(runnedViolation.reason === "wrong_form", "Reason wrong_form");
  assert(runnedViolation.suggestion.toLowerCase().includes("approved form"), "Suggestion mentions approved form");
  console.log("  9. OK: 'runned' → STE-3.1 violation (wrong_form, verb)");

  // 10. STE-1.5: "run" is in allowed forms → no violation
  const doc10 = tokenizeText("Run the test.", { applyPosHeuristic: true });
  const result10 = await runSte11Check(doc10, lookup);
  const runViolation = result10.violations.find((v) => v.tokenNormalized === "run");
  assert(runViolation == null, "'run' in allowed forms should not be flagged");
  console.log("  10. OK: 'run' in allowed forms → no STE-1.5 violation");

  console.log("\nAll STE-1.1 engine tests passed.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
