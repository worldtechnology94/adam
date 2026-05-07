/**
 * Spot-check dictionary content: fetch one word from DB and print it.
 * Compare output to the same word in nlp-service/data/ste_dictionary.json.
 *
 * Usage: npx tsx scripts/verify-dictionary-content.ts [word]
 * Default word: abandon
 * Supabase (TLS): NODE_TLS_REJECT_UNAUTHORIZED=0
 */

import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

async function main() {
  const headword = (process.argv[2] ?? "abandon").toLowerCase();

  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is not set in .env");
  }
  const adapter = new PrismaPg({
    connectionString: url,
    ssl: { rejectUnauthorized: false },
  });
  const prisma = new PrismaClient({ adapter });

  const word = await prisma.steWord.findFirst({
    where: { word: headword },
    include: { forms: true, meanings: true, examples: true },
  });

  if (!word) {
    console.log(`Word "${headword}" not found in DB.`);
    await prisma.$disconnect();
    process.exit(1);
  }

  console.log("DB entry for:", headword);
  console.log(JSON.stringify({
    word: word.word,
    word_display: word.wordDisplay,
    forms: word.forms.map((f) => f.form),
    pos: word.pos,
    approved: word.approved,
    meanings: word.meanings.map((m) => ({
      meaning: m.meaning,
      approved_as_is: m.approvedAsIs,
      alternative: m.alternativeWord ? { word: m.alternativeWord, pos: m.alternativePos } : null,
    })),
    examples: word.examples.map((e) => ({ ste: e.steText, non_ste: e.nonSteText })),
  }, null, 2));

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
