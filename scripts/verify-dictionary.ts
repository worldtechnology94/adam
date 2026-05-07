/**
 * Verify STE dictionary was seeded: print row counts for dictionary tables.
 * Run after seed:dict to confirm T1.3.
 *
 * Usage: npx tsx scripts/verify-dictionary.ts
 *    or: npm run verify:dict
 *
 * Supabase (TLS): If you get a TLS error, run with NODE_TLS_REJECT_UNAUTHORIZED=0
 */

import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

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

  const [words, forms, meanings, examples] = await Promise.all([
    prisma.steWord.count(),
    prisma.steWordForm.count(),
    prisma.steMeaning.count(),
    prisma.steExample.count(),
  ]);

  console.log("Dictionary table counts:");
  console.log("  ste_words:     ", words);
  console.log("  ste_word_forms:", forms);
  console.log("  ste_meanings:  ", meanings);
  console.log("  ste_examples:  ", examples);

  const expectedWords = 1950; // from parser output
  if (words >= expectedWords && forms > 0) {
    console.log("\nOK — dictionary appears seeded (T1.3).");
  } else {
    console.log("\nRun seed first: npm run seed:dict (use NODE_TLS_REJECT_UNAUTHORIZED=0 for Supabase if needed).");
  }

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
