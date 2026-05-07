/**
 * DB + JSON audit: multi-meaning approved words (STE-1.3 / missing-dic-driven Phase 0).
 *
 * - Reads nlp-service/data/ste_dictionary.json and prints summary counts.
 * - If DATABASE_URL is set, queries ste_words + ste_meanings and writes CSV:
 *   data/reports/multi-meaning-audit.csv
 *
 * Usage: npx tsx scripts/audit-multi-meaning-words.ts
 *    or: npm run audit:meanings
 *
 * TLS (Supabase): same as seed — if connection fails, set for one run:
 *   PowerShell: $env:NODE_TLS_REJECT_UNAUTHORIZED='0'; npm run audit:meanings
 */

import "dotenv/config";
import { createWriteStream, readFileSync, writeFileSync } from "fs";
import path from "path";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const ROOT = path.resolve(__dirname, "..");
const DICT_PATH = path.join(ROOT, "nlp-service", "data", "ste_dictionary.json");
const REPORT_CSV = path.join(ROOT, "data", "reports", "multi-meaning-audit.csv");
const REPORT_CSV_JSON = path.join(ROOT, "data", "reports", "multi-meaning-audit-from-json.csv");
const REPORT_JSON_SUMMARY = path.join(ROOT, "data", "reports", "multi-meaning-json-summary.json");

interface DictEntry {
  word: string;
  approved: boolean;
  meanings: {
    meaning?: string;
    approved_as_is?: boolean;
    alternative?: { word: string; pos: string } | null;
  }[];
}

function escapeCsvField(s: string): string {
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function auditJson(): {
  totalHeadwords: number;
  approvedHeadwords: number;
  approvedMultiMeaning: number;
  approvedAnyDisallowedMeaning: number;
  approvedFlagged: number;
  headwordsFlagged: string[];
} {
  const raw = readFileSync(DICT_PATH, "utf-8");
  const dict = JSON.parse(raw) as Record<string, DictEntry>;
  const entries = Object.values(dict);

  let approvedHeadwords = 0;
  let approvedMultiMeaning = 0;
  let approvedAnyDisallowedMeaning = 0;
  const headwordsFlagged: string[] = [];

  for (const e of entries) {
    if (!e.approved) continue;
    approvedHeadwords++;
    const meanings = e.meanings ?? [];
    const multi = meanings.length > 1;
    const anyNotAsIs = meanings.some((m) => m.approved_as_is === false);
    if (multi) approvedMultiMeaning++;
    if (anyNotAsIs) approvedAnyDisallowedMeaning++;
    if (multi || anyNotAsIs) headwordsFlagged.push(e.word);
  }

  const approvedFlagged = headwordsFlagged.length;

  return {
    totalHeadwords: entries.length,
    approvedHeadwords,
    approvedMultiMeaning,
    approvedAnyDisallowedMeaning,
    approvedFlagged,
    headwordsFlagged: headwordsFlagged.sort(),
  };
}

/** Same columns as DB CSV; word_id empty when not from database. */
function writeJsonMeaningCsv(): number {
  const raw = readFileSync(DICT_PATH, "utf-8");
  const dict = JSON.parse(raw) as Record<string, DictEntry>;
  const lines: string[] = [];
  lines.push(
    ["word_id", "headword", "meaning_text", "approved_as_is", "alternative_word", "alternative_pos"].join(",")
  );
  let rows = 0;
  for (const e of Object.values(dict)) {
    if (!e.approved) continue;
    const meanings = e.meanings ?? [];
    const flagged =
      meanings.length > 1 || meanings.some((m) => m.approved_as_is === false);
    if (!flagged) continue;
    for (const m of meanings) {
      lines.push(
        [
          "",
          escapeCsvField(e.word),
          escapeCsvField(m.meaning ?? ""),
          m.approved_as_is === false ? "false" : "true",
          escapeCsvField(m.alternative?.word ?? ""),
          escapeCsvField(m.alternative?.pos ?? ""),
        ].join(",")
      );
      rows++;
    }
  }
  writeFileSync(REPORT_CSV_JSON, lines.join("\n") + "\n", "utf-8");
  return rows;
}

async function auditDb(): Promise<boolean> {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.log("\n[DB] DATABASE_URL not set — skipping DB CSV (JSON-only CSV still written).\n");
    return false;
  }

  try {
    const adapter = new PrismaPg({
      connectionString: url,
      ssl: { rejectUnauthorized: false },
    });
    const prisma = new PrismaClient({ adapter });

    const words = await prisma.steWord.findMany({
      where: { approved: true },
      include: { meanings: true },
    });

    /** Approved words with >1 meaning row OR any approved_as_is === false */
    const flagged = words.filter(
      (w) => w.meanings.length > 1 || w.meanings.some((m) => !m.approvedAsIs)
    );

    console.log("\n[DB] Approved headwords with multiple meaning rows OR any disallowed sense row:");
    console.log(`     Count: ${flagged.length}`);

    const stream = createWriteStream(REPORT_CSV, { encoding: "utf-8" });
    stream.write(
      ["word_id", "headword", "meaning_text", "approved_as_is", "alternative_word", "alternative_pos"].join(
        ","
      ) + "\n"
    );

    let rows = 0;
    for (const w of flagged.sort((a, b) => a.word.localeCompare(b.word))) {
      for (const m of w.meanings) {
        const line = [
          String(w.id),
          escapeCsvField(w.word),
          escapeCsvField(m.meaning ?? ""),
          m.approvedAsIs ? "true" : "false",
          escapeCsvField(m.alternativeWord ?? ""),
          escapeCsvField(m.alternativePos ?? ""),
        ].join(",");
        stream.write(line + "\n");
        rows++;
      }
    }
    stream.end();

    await new Promise<void>((resolve, reject) => {
      stream.on("finish", () => resolve());
      stream.on("error", reject);
    });

    await prisma.$disconnect();

    console.log(`[DB] Wrote ${rows} meaning rows for ${flagged.length} headwords → ${REPORT_CSV}`);
    return true;
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("\n[DB] Audit failed:", msg);
    console.error(
      "     If this is a TLS/self-signed certificate error, retry with:\n" +
        "     PowerShell: $env:NODE_TLS_REJECT_UNAUTHORIZED='0'; npm run audit:meanings\n"
    );
    return false;
  }
}

async function main(): Promise<void> {
  console.log("=== JSON audit (ste_dictionary.json) ===\n");
  console.log(`File: ${DICT_PATH}`);

  const j = auditJson();
  console.log(`Total headwords:              ${j.totalHeadwords}`);
  console.log(`Approved headwords:           ${j.approvedHeadwords}`);
  console.log(`Approved, meanings.length>1: ${j.approvedMultiMeaning}`);
  console.log(`Approved, any approved_as_is=false: ${j.approvedAnyDisallowedMeaning}`);
  console.log(`Approved, flagged (either condition): ${j.approvedFlagged}`);

  const summaryPayload = {
    generatedAt: new Date().toISOString(),
    source: "ste_dictionary.json",
    ...j,
  };
  writeFileSync(REPORT_JSON_SUMMARY, JSON.stringify(summaryPayload, null, 2), "utf-8");
  console.log(`\nJSON summary written → ${REPORT_JSON_SUMMARY}`);

  const jsonRows = writeJsonMeaningCsv();
  console.log(`JSON-derived CSV (${jsonRows} meaning rows, word_id blank) → ${REPORT_CSV_JSON}`);

  const dbOk = await auditDb();
  if (!dbOk) {
    console.log("\nNote: Use DB CSV (with word_id) after a successful DB run for Prisma-aligned ids.");
  }

  console.log("\nDone.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
