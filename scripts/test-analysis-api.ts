/**
 * T2.3 — Test POST /api/analysis/check (E2E)
 *
 * 1. Start dev server with DB/TLS if needed:
 *    $env:NODE_TLS_REJECT_UNAUTHORIZED='0'; npm run dev
 * 2. Run: npm run test:analysis-api
 *
 * Verifies: 200, body has violations[], complianceScore, totalWordCount;
 * "utilize" in text yields a violation with suggestion "use".
 */

const BASE = process.env.TEST_ANALYSIS_URL ?? "http://localhost:3000";

async function main(): Promise<void> {
  console.log("T2.3 Analysis API test");
  console.log(`  POST ${BASE}/api/analysis/check\n`);

  // Use "utilize" (headword in dictionary); "utilized" may not be in forms in seeded data
  const body = { text: "The technician utilize the tool. Prior to use, check the valve." };

  let res: Response;
  try {
    res = await fetch(`${BASE}/api/analysis/check`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch (e) {
    console.error("Request failed (is the dev server running?).", e);
    process.exit(1);
  }

  if (!res.ok) {
    const t = await res.text();
    console.error(`HTTP ${res.status}: ${t}`);
    process.exit(1);
  }

  const data = (await res.json()) as unknown;
  if (typeof data !== "object" || data === null) {
    console.error("Response is not an object:", data);
    process.exit(1);
  }

  const hasViolations = Array.isArray((data as { violations?: unknown }).violations);
  const hasScore = typeof (data as { complianceScore?: unknown }).complianceScore === "number";
  const hasTotal = typeof (data as { totalWordCount?: unknown }).totalWordCount === "number";

  if (!hasViolations || !hasScore || !hasTotal) {
    console.error("Response missing violations[], complianceScore, or totalWordCount:", data);
    process.exit(1);
  }

  const violations = (data as { violations: { tokenNormalized: string; suggestion: string }[] }).violations;
  const complianceScore = (data as { complianceScore: number }).complianceScore;
  const totalWordCount = (data as { totalWordCount: number }).totalWordCount;

  const utilizeViolation = violations.find((v) => v.tokenNormalized === "utilize");
  if (!utilizeViolation) {
    console.error("Expected a violation for 'utilize'; got:", violations.map((v) => v.tokenNormalized));
    process.exit(1);
  }

  if (!utilizeViolation.suggestion.toLowerCase().includes("use")) {
    console.error("Expected suggestion to mention 'use'; got:", utilizeViolation.suggestion);
    process.exit(1);
  }

  const priorViolation = violations.find((v) => v.tokenNormalized === "prior");
  if (!priorViolation) {
    console.error("Expected a violation for 'prior'; got:", violations.map((v) => v.tokenNormalized));
    process.exit(1);
  }

  console.log("  OK: 200, body has violations[], complianceScore, totalWordCount");
  console.log("  OK: 'utilize' → violation with suggestion containing 'use'");
  console.log("  OK: 'prior' → violation");
  console.log(`  violations: ${violations.length}, complianceScore: ${complianceScore}, totalWordCount: ${totalWordCount}`);
  console.log("\nT2.3 Analysis API test passed.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
