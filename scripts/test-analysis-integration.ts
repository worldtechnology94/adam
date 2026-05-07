/**
 * T2.3 — Integration test: tokenize + STE-1.1 engine + real DB lookup
 *
 * Run: npx tsx scripts/test-analysis-integration.ts
 * Requires: DATABASE_URL in .env; for Supabase use NODE_TLS_REJECT_UNAUTHORIZED=0
 *
 * Verifies the same pipeline as POST /api/analysis/check (no HTTP).
 */

import "dotenv/config";
import { tokenizeText, runSte11Check, createPrismaLookup } from "../app/lib/analysis";
import { prisma } from "../app/lib/db";

async function main(): Promise<void> {
  console.log("T2.3 Analysis integration test (tokenize + engine + DB)\n");

  // Use "utilize" (headword in dictionary); "utilized" may not be in forms in seeded data
  const text = "The technician utilize the tool. Prior to use, check the valve.";
  const doc = tokenizeText(text, { applyPosHeuristic: true });
  const lookup = createPrismaLookup(prisma);

  const result = await runSte11Check(doc, lookup);

  if (typeof result.complianceScore !== "number" || !Array.isArray(result.violations)) {
    console.error("Invalid result shape:", result);
    process.exit(1);
  }

  const utilizeViolation = result.violations.find((v) => v.tokenNormalized === "utilize");
  if (!utilizeViolation) {
    console.error("Expected violation for 'utilize'. Got tokens:", result.violations.map((v) => v.tokenNormalized));
    process.exit(1);
  }

  if (!utilizeViolation.suggestion.toLowerCase().includes("use")) {
    console.error("Expected suggestion to mention 'use'; got:", utilizeViolation.suggestion);
    process.exit(1);
  }

  const priorViolation = result.violations.find((v) => v.tokenNormalized === "prior");
  if (!priorViolation) {
    console.error("Expected violation for 'prior'. Got:", result.violations.map((v) => v.tokenNormalized));
    process.exit(1);
  }

  console.log("  OK: tokenize + runSte11Check + Prisma lookup");
  console.log("  OK: 'utilize' → violation, suggestion contains 'use'");
  console.log("  OK: 'prior' → violation");
  console.log(`  violations: ${result.violations.length}, complianceScore: ${result.complianceScore}, totalWordCount: ${result.totalWordCount}`);

  await prisma.$disconnect();
  console.log("\nT2.3 integration test passed.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
