/**
 * T1.3 — Seed STE dictionary from JSON into PostgreSQL.
 * Idempotent: clears dictionary tables then inserts from ste_dictionary.json.
 *
 * Prerequisites: Run parse_ste_dict.py first to generate nlp-service/data/ste_dictionary.json
 *
 * Usage: npx tsx scripts/seed-dictionary.ts
 *    or: npm run seed:dict
 *
 * Supabase (TLS): If you get "self-signed certificate in certificate chain", run with
 *   NODE_TLS_REJECT_UNAUTHORIZED=0  (e.g. PowerShell: $env:NODE_TLS_REJECT_UNAUTHORIZED='0'; npm run seed:dict)
 */

import "dotenv/config";
import { readFileSync } from "fs";
import path from "path";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const ROOT = path.resolve(__dirname, "..");
const DICT_PATH = path.join(ROOT, "nlp-service", "data", "ste_dictionary.json");

interface DictEntry {
  word: string;
  word_display?: string;
  forms: string[];
  pos: string;
  approved: boolean;
  meanings: { meaning?: string; approved_as_is?: boolean; alternative?: { word: string; pos: string } | null }[];
  alternatives: { word: string; pos: string }[];
  examples: { ste?: string | null; non_ste?: string | null }[];
}

function loadDictionary(): Record<string, DictEntry> {
  const raw = readFileSync(DICT_PATH, "utf-8");
  return JSON.parse(raw) as Record<string, DictEntry>;
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

  const dict = loadDictionary();
  const entries = Object.values(dict);
  console.log(`Loaded ${entries.length} headwords from ${DICT_PATH}`);

  console.log("Clearing existing dictionary data...");
  await prisma.steExample.deleteMany({});
  await prisma.steMeaning.deleteMany({});
  await prisma.steWordForm.deleteMany({});
  await prisma.steWord.deleteMany({});

  console.log("Inserting words, forms, meanings, examples...");
  let inserted = 0;
  for (const e of entries) {
    await prisma.steWord.create({
      data: {
        word: e.word,
        wordDisplay: e.word_display ?? e.word,
        pos: e.pos || null,
        approved: e.approved,
        forms: {
          create: e.forms.map((form) => ({ form })),
        },
        meanings: {
          create: [
            ...e.meanings.map((m) => ({
              meaning: m.meaning ?? null,
              approvedAsIs: m.approved_as_is ?? true,
              alternativeWord: m.alternative?.word ?? null,
              alternativePos: m.alternative?.pos ?? null,
            })),
            // Top-level alternatives (e.g. abandon → GO, STOP) as meaning rows with no text
            ...(e.alternatives ?? []).map((a) => ({
              meaning: null,
              approvedAsIs: false,
              alternativeWord: a.word,
              alternativePos: a.pos,
            })),
          ],
        },
        examples: {
          create: e.examples.map((ex) => ({
            steText: ex.ste ?? null,
            nonSteText: ex.non_ste ?? null,
          })),
        },
      },
    });
    inserted++;
    if (inserted % 500 === 0) {
      console.log(`  ${inserted}/${entries.length}...`);
    }
  }

  console.log(`Done. Inserted ${inserted} words.`);
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
