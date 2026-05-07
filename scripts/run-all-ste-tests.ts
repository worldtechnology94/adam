/**
 * Run all STE rule engine test scripts and report results.
 *
 * Run: npx tsx scripts/run-all-ste-tests.ts
 */

import { spawnSync } from "child_process";
import path from "path";

const TESTS = [
  "test-ste11-engine.ts",
  "test-ste13-engine.ts",
  "test-ste81-engine.ts",
  "test-ste5-engine.ts",
  "test-ste53-engine.ts",
  "test-ste32-engine.ts",
  "test-ste41-engine.ts",
  "test-ste42-engine.ts",
  "test-ste43-engine.ts",
  "test-ste44-engine.ts",
  "test-ste45-engine.ts",
  "test-ste46-48-engine.ts",
  "test-ste61-engine.ts",
  "test-ste71-engine.ts",
  "test-ste72-engine.ts",
  "test-ste73-engine.ts",
  "test-ste74-75-engine.ts",
  "test-ste21-engine.ts",
  "test-ste82-engine.ts",
  "test-ste83-engine.ts",
  "test-ste84-engine.ts",
  "test-ste85-93-87-engine.ts",
  "test-ste91-engine.ts",
  "test-ste92-engine.ts",
  "test-ste102-engine.ts",
  "test-ste10-writing-engine.ts",
];

const root = path.resolve(__dirname, "..");

function run(name: string): boolean {
  const scriptPath = path.join(__dirname, name);
  const result = spawnSync("npx", ["tsx", scriptPath], {
    cwd: root,
    stdio: "inherit",
    shell: process.platform === "win32",
  });
  return result.status === 0;
}

function main(): void {
  console.log("Running all STE rule engine tests...\n");
  let passed = 0;
  let failed = 0;
  for (const name of TESTS) {
    const ok = run(name);
    if (ok) {
      console.log(`  OK ${name}`);
      passed++;
    } else {
      console.log(`  FAIL ${name}`);
      failed++;
    }
  }
  console.log(`\n${passed} passed, ${failed} failed`);
  process.exit(failed > 0 ? 1 : 0);
}

main();
