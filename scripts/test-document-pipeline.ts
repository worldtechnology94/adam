/**
 * T3 — Test document upload and analysis pipeline
 *
 * 1. POST /api/documents/upload with a .txt file
 * 2. GET /api/documents/[id]
 * 3. GET /api/documents/[id]/text
 * 4. POST /api/documents/[id]/analyze
 * 5. GET /api/documents/[id]/analysis
 *
 * Run with dev server up: npm run dev
 * Then: npx tsx scripts/test-document-pipeline.ts
 */

const BASE = process.env.TEST_ANALYSIS_URL ?? "http://localhost:3000";

async function main(): Promise<void> {
  console.log("T3 Document pipeline test");
  console.log(`  Base URL: ${BASE}\n`);

  const sampleText = "The technician utilize the tool. Prior to use, check the valve.";
  const blob = new Blob([sampleText], { type: "text/plain" });
  const formData = new FormData();
  formData.append("file", blob, "sample.txt");

  let res = await fetch(`${BASE}/api/documents/upload`, {
    method: "POST",
    body: formData,
  });
  if (!res.ok) {
    console.error("Upload failed:", res.status, await res.text());
    process.exit(1);
  }
  const uploadBody = (await res.json()) as { id: number; name: string };
  const docId = uploadBody.id;
  console.log("  1. OK: POST /upload → document id", docId);

  res = await fetch(`${BASE}/api/documents/${docId}`);
  if (!res.ok) {
    console.error("GET document failed:", res.status);
    process.exit(1);
  }
  const doc = (await res.json()) as { id: number; name: string };
  assert(doc.id === docId && doc.name === "sample.txt", "Document metadata");
  console.log("  2. OK: GET /documents/" + docId);

  res = await fetch(`${BASE}/api/documents/${docId}/text`);
  if (!res.ok) {
    console.error("GET text failed:", res.status);
    process.exit(1);
  }
  const textBody = (await res.json()) as { text: string; wordCount: number; sentenceCount: number };
  assert(textBody.text.includes("utilize") && textBody.wordCount > 0, "Extracted text and counts");
  console.log("  3. OK: GET /documents/" + docId + "/text → wordCount", textBody.wordCount);

  res = await fetch(`${BASE}/api/documents/${docId}/analyze`, { method: "POST" });
  if (!res.ok) {
    console.error("POST analyze failed:", res.status, await res.text());
    process.exit(1);
  }
  const analyzeBody = (await res.json()) as {
    analysisRunId: number;
    complianceScore: number;
    totalViolations: number;
    violations: unknown[];
  };
  assert(
    typeof analyzeBody.analysisRunId === "number" && Array.isArray(analyzeBody.violations),
    "Analyze response shape"
  );
  console.log(
    "  4. OK: POST /analyze → run",
    analyzeBody.analysisRunId,
    "violations:",
    analyzeBody.totalViolations
  );

  res = await fetch(`${BASE}/api/documents/${docId}/analysis`);
  if (!res.ok) {
    console.error("GET analysis failed:", res.status);
    process.exit(1);
  }
  const analysisBody = (await res.json()) as {
    documentId: number;
    analysisRun: { id: number; complianceScore: number } | null;
    violations: unknown[];
  };
  assert(analysisBody.analysisRun != null && analysisBody.documentId === docId, "Analysis response");
  assert(
    analysisBody.violations.length === analyzeBody.totalViolations,
    "Violations count match"
  );
  console.log("  5. OK: GET /documents/" + docId + "/analysis → violations", analysisBody.violations.length);

  const utilizeViolation = analysisBody.violations.find(
    (v: { sentenceExcerpt?: string }) => v.sentenceExcerpt?.includes("utilize")
  );
  assert(utilizeViolation != null, "At least one violation for sentence with 'utilize'");

  console.log("\nT3 document pipeline test passed.");
}

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
