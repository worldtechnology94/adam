/**
 * One-time migration: reads master_data.db (SQLite) and populates
 * the Supabase PostgreSQL tables with enriched STE vocabulary data.
 *
 * Run with: npx tsx scripts/migrate-master-db.ts
 */

import "dotenv/config";
import * as fs from "fs";
import * as path from "path";
import initSqlJs from "sql.js";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL not set");
if (url.includes("supabase.com") && process.env.NODE_TLS_REJECT_UNAUTHORIZED === undefined) {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
}
const adapter = new PrismaPg({ connectionString: url, ssl: { rejectUnauthorized: false } });
const prisma = new PrismaClient({ adapter });

// ─── Helpers ─────────────────────────────────────────────────────────────────

function uposToStePos(upos: string | null): string | null {
  const map: Record<string, string> = {
    NOUN: "n", VERB: "v", ADJ: "adj", ADV: "adv",
    ADP: "prep", PRON: "pron", CCONJ: "conj", DET: "art",
  };
  return upos ? (map[upos] ?? null) : null;
}

function log(msg: string) {
  console.log(`[migrate] ${new Date().toISOString()} ${msg}`);
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const dbPath = path.join(process.cwd(), "master_data.db");
  if (!fs.existsSync(dbPath)) throw new Error("master_data.db not found in project root");

  const SQL = await initSqlJs();
  const buf = fs.readFileSync(dbPath);
  const db = new SQL.Database(buf);

  // ── 1. Master_Alternative_Term → SteWord + SteMeaning + SteExample ─────────
  log("Importing Master_Alternative_Term (1940 rows)...");
  const altTerms = db.exec(`
    SELECT term, ste_pos, approved_alternative, example_ste, example_non_ste, guidance_note
    FROM Master_Alternative_Term
  `)[0];

  let altImported = 0;
  if (altTerms) {
    for (const row of altTerms.values) {
      const [term, stePos, approvedAlt, exSte, exNonSte, guidanceNote] = row as string[];
      if (!term || !approvedAlt) continue;

      const wordLower = term.toLowerCase().trim();
      const altLower = approvedAlt.toLowerCase().trim();

      // Find or create the SteWord entry for the non-STE term
      let word = await prisma.steWord.findFirst({ where: { word: wordLower } });
      if (!word) {
        word = await prisma.steWord.create({
          data: { word: wordLower, wordDisplay: term, pos: stePos, approved: false },
        });
      }

      // Add meaning with the alternative
      const existingMeaning = await prisma.steMeaning.findFirst({
        where: { wordId: word.id, alternativeWord: altLower },
      });
      if (!existingMeaning) {
        await prisma.steMeaning.create({
          data: {
            wordId: word.id,
            approvedAsIs: false,
            alternativeWord: altLower,
            guidanceNote: guidanceNote ?? null,
          },
        });
      }

      // Add STE/non-STE example
      if (exSte || exNonSte) {
        const existingEx = await prisma.steExample.findFirst({
          where: { wordId: word.id, steText: exSte ?? undefined },
        });
        if (!existingEx) {
          await prisma.steExample.create({
            data: { wordId: word.id, steText: exSte ?? null, nonSteText: exNonSte ?? null },
          });
        }
      }

      altImported++;
    }
  }
  log(`Master_Alternative_Term: ${altImported} terms processed`);

  // ── 2. Master_Terminology → SteWord (approved terms) ───────────────────────
  log("Importing Master_Terminology (3120 rows)...");
  const terms = db.exec(`
    SELECT term, lemma, ste_pos, upos, status, meaning, category
    FROM Master_Terminology
    WHERE status = 'Approved' AND record_type = 'main'
  `)[0];

  let termImported = 0;
  if (terms) {
    for (const row of terms.values) {
      const [term, lemma, stePos, upos, , meaning, category] = row as string[];
      if (!term) continue;

      const wordLower = (lemma ?? term).toLowerCase().trim();
      const pos = stePos ?? uposToStePos(upos);

      const existing = await prisma.steWord.findFirst({ where: { word: wordLower } });
      if (!existing) {
        const newWord = await prisma.steWord.create({
          data: { word: wordLower, wordDisplay: term, pos, approved: true },
        });
        if (meaning) {
          await prisma.steMeaning.create({
            data: { wordId: newWord.id, meaning, approvedAsIs: true },
          });
        }
        termImported++;
      }
    }
  }
  log(`Master_Terminology: ${termImported} new approved terms added`);

  // ── 3. Master_Verb_Forms → SteVerbForm ─────────────────────────────────────
  log("Importing Master_Verb_Forms (338 rows)...");
  const verbForms = db.exec(`
    SELECT base, present_s, past, past_participle FROM Master_Verb_Forms
  `)[0];

  let verbImported = 0;
  if (verbForms) {
    for (const row of verbForms.values) {
      const [base, presentS, past, pastParticiple] = row as string[];
      if (!base) continue;
      const existing = await prisma.steVerbForm.findFirst({ where: { base: base.toLowerCase() } });
      if (!existing) {
        await prisma.steVerbForm.create({
          data: {
            base: base.toLowerCase(),
            presentS: presentS?.toLowerCase() ?? null,
            past: past?.toLowerCase() ?? null,
            pastParticiple: pastParticiple?.toLowerCase() ?? null,
          },
        });
        verbImported++;
      }
    }
  }
  log(`Master_Verb_Forms: ${verbImported} verb forms imported`);

  // ── 4. Master_Abbreviation → SteAbbreviation ───────────────────────────────
  log("Importing Master_Abbreviation (43 rows)...");
  const abbrevs = db.exec(`
    SELECT term, full_form, category, source FROM Master_Abbreviation
  `)[0];

  let abbrevImported = 0;
  if (abbrevs) {
    for (const row of abbrevs.values) {
      const [term, fullForm, category, source] = row as string[];
      if (!term || !fullForm) continue;
      try {
        await prisma.steAbbreviation.upsert({
          where: { term },
          update: { fullForm, category: category ?? null, source: source ?? null },
          create: { term, fullForm, category: category ?? null, source: source ?? null },
        });
        abbrevImported++;
      } catch { /* skip duplicates */ }
    }
  }
  log(`Master_Abbreviation: ${abbrevImported} abbreviations imported`);

  // ── 5. Master_Measure_Unit → SteUnit ───────────────────────────────────────
  log("Importing Master_Measure_Unit (28 rows)...");
  const units = db.exec(`
    SELECT measure_type, unit_name, symbol, system FROM Master_Measure_Unit
  `)[0];

  let unitImported = 0;
  if (units) {
    for (const row of units.values) {
      const [measureType, unitName, symbol, system] = row as string[];
      if (!symbol) continue;
      const existing = await prisma.steUnit.findFirst({ where: { symbol } });
      if (!existing) {
        await prisma.steUnit.create({
          data: { measureType: measureType ?? "Unknown", unitName: unitName ?? symbol, symbol, system: system ?? null },
        });
        unitImported++;
      }
    }
  }
  log(`Master_Measure_Unit: ${unitImported} units imported`);

  // ── 6. lemmaMaster → SteWordForm (technical term forms) ────────────────────
  log("Importing lemmaMaster (717 rows)...");
  const lemmas = db.exec(`
    SELECT word, lemma, pos FROM lemmaMaster
  `)[0];

  let lemmaImported = 0;
  if (lemmas) {
    for (const row of lemmas.values) {
      const [word, lemma, ] = row as string[];
      if (!word || !lemma) continue;

      const wordLower = word.toLowerCase().trim();
      const lemmaLower = lemma.toLowerCase().trim();

      // Ensure the lemma exists as an approved SteWord
      let steWord = await prisma.steWord.findFirst({ where: { word: lemmaLower } });
      if (!steWord) {
        steWord = await prisma.steWord.create({
          data: { word: lemmaLower, pos: "n", approved: true },
        });
      }

      // Add the surface form if different from the lemma
      if (wordLower !== lemmaLower) {
        const existingForm = await prisma.steWordForm.findFirst({
          where: { wordId: steWord.id, form: wordLower },
        });
        if (!existingForm) {
          await prisma.steWordForm.create({
            data: { wordId: steWord.id, form: wordLower },
          });
          lemmaImported++;
        }
      }
    }
  }
  log(`lemmaMaster: ${lemmaImported} word forms added`);

  db.close();
  log("Migration complete!");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
