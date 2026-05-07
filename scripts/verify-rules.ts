/**
 * Verify Rules API (T4.3): GET /api/rules and GET /api/rules/[id].
 * Run with dev server up: npx tsx scripts/verify-rules.ts
 */

const BASE = process.env.VERIFY_BASE_URL ?? "http://localhost:3000";

async function main() {
  console.log("Verifying Rules API at", BASE, "\n");

  const listRes = await fetch(`${BASE}/api/rules`);
  if (!listRes.ok) {
    console.error("GET /api/rules failed:", listRes.status, await listRes.text());
    process.exit(1);
  }
  const list = (await listRes.json()) as unknown[];
  if (!Array.isArray(list)) {
    console.error("GET /api/rules did not return an array");
    process.exit(1);
  }
  if (list.length !== 60) {
    console.error("Expected 60 rules, got", list.length);
    process.exit(1);
  }

  const first = list[0] as Record<string, unknown>;
  const required = ["id", "name", "topic", "topicName", "description", "specText", "compliantExamples", "nonCompliantExamples"];
  for (const key of required) {
    if (!(key in first)) {
      console.error("Rule missing field:", key);
      process.exit(1);
    }
  }
  console.log("GET /api/rules: OK (60 rules, shape correct)");

  const ste12Res = await fetch(`${BASE}/api/rules/STE-1.2`);
  if (!ste12Res.ok) {
    console.error("GET /api/rules/STE-1.2 failed:", ste12Res.status);
    process.exit(1);
  }
  const ste12 = (await ste12Res.json()) as Record<string, unknown>;
  if (ste12.id !== "STE-1.2" || ste12.name !== "Prohibited words") {
    console.error("STE-1.2 content mismatch:", ste12.id, ste12.name);
    process.exit(1);
  }
  const nonCompliant = ste12.nonCompliantExamples as { text: string; reason?: string }[];
  const hasPriorTo = Array.isArray(nonCompliant) && nonCompliant.some((ex) => ex.text?.includes("Prior to"));
  if (!hasPriorTo) {
    console.error("STE-1.2 expected non-compliant example containing 'Prior to'");
    process.exit(1);
  }
  console.log("GET /api/rules/STE-1.2: OK (Prohibited words, examples present)");

  const topicRes = await fetch(`${BASE}/api/rules?topic=1`);
  if (!topicRes.ok) {
    console.error("GET /api/rules?topic=1 failed:", topicRes.status);
    process.exit(1);
  }
  const topic1 = (await topicRes.json()) as unknown[];
  const wordsCount = Array.isArray(topic1) ? topic1.length : 0;
  if (wordsCount < 2) {
    console.error("Expected at least 2 rules for topic=1 (Words), got", wordsCount);
    process.exit(1);
  }
  console.log("GET /api/rules?topic=1: OK (" + wordsCount + " rules)\n");

  console.log("All Rules API checks passed.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
