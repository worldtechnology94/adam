/**
 * T4.3 — Seed Rule Library from data/ste-rules.json into PostgreSQL.
 * Idempotent: upserts by ruleId (creates or updates).
 *
 * Usage: npx tsx scripts/seed-rules.ts
 *    or: npm run seed:rules
 *
 * Supabase (TLS): If you get "self-signed certificate in certificate chain", run with
 *   NODE_TLS_REJECT_UNAUTHORIZED=0  (e.g. PowerShell: $env:NODE_TLS_REJECT_UNAUTHORIZED='0'; npm run seed:rules)
 */

import "dotenv/config";
import { readFileSync } from "fs";
import path from "path";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const ROOT = path.resolve(__dirname, "..");
const RULES_PATH = path.join(ROOT, "data", "ste-rules.json");

interface RuleExample {
  text: string;
  reason?: string;
}

interface RuleInput {
  id: string;
  name: string;
  topic: number;
  topicName: string;
  description: string;
  specText: string;
  compliantExamples: RuleExample[];
  nonCompliantExamples: RuleExample[];
}

function loadRules(): RuleInput[] {
  const raw = readFileSync(RULES_PATH, "utf-8");
  return JSON.parse(raw) as RuleInput[];
}

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is not set in .env");
  }
  const adapter = new PrismaPg({
    connectionString: url,
    ssl: { rejectUnauthorized: false },
  });
  const prisma = new PrismaClient({ adapter });

  const rules = loadRules();
  console.log(`Seeding ${rules.length} rules from ${RULES_PATH}...`);

  for (const r of rules) {
    await prisma.rule.upsert({
      where: { ruleId: r.id },
      create: {
        ruleId: r.id,
        name: r.name,
        topic: r.topic,
        topicName: r.topicName,
        description: r.description,
        specText: r.specText,
        compliantExamples: r.compliantExamples as object,
        nonCompliantExamples: r.nonCompliantExamples as object,
      },
      update: {
        name: r.name,
        topic: r.topic,
        topicName: r.topicName,
        description: r.description,
        specText: r.specText,
        compliantExamples: r.compliantExamples as object,
        nonCompliantExamples: r.nonCompliantExamples as object,
      },
    });
  }

  console.log(`Done. ${rules.length} rules seeded.`);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
