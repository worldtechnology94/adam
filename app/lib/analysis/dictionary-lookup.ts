/**
 * ADAM — Dictionary lookup adapter for STE-1.1 engine (T2.2)
 *
 * Provides a function that resolves a normalized token (form or headword)
 * to a dictionary entry. Used by the engine to look up each word without
 * the engine depending on Prisma directly (so tests can inject a mock).
 *
 * @see thesisplan.md T2.2 — resolve form → headword via DB
 */

import type { PrismaClient } from "@prisma/client";
import type { TokenizedDocument } from "./types";
import type { DictionaryLookupResult, DictionaryLookup } from "./ste11-types";

const BATCH_SIZE = 2000;

function toLookupResult(entry: {
  id: number;
  word: string;
  wordDisplay: string | null;
  pos: string | null;
  approved: boolean;
  forms: { form: string }[];
  meanings: {
    meaning: string | null;
    approvedAsIs: boolean;
    alternativeWord: string | null;
    alternativePos: string | null;
    guidanceNote: string | null;
  }[];
  examples: { steText: string | null; nonSteText: string | null }[];
}): DictionaryLookupResult {
  const alternatives = entry.meanings
    .filter((m) => m.alternativeWord != null)
    .map((m) => ({
      word: m.alternativeWord!,
      pos: m.alternativePos ?? undefined,
    }));
  const meanings =
    entry.meanings.length > 0
      ? entry.meanings.map((m) => ({
          meaning: m.meaning,
          approvedAsIs: m.approvedAsIs,
          alternativeWord: m.alternativeWord,
          alternativePos: m.alternativePos,
          guidanceNote: m.guidanceNote,
        }))
      : undefined;
  const formSet = new Set(entry.forms.map((f) => f.form.toLowerCase()));
  if (!formSet.has(entry.word.toLowerCase())) formSet.add(entry.word.toLowerCase());
  const allowedForms = Array.from(formSet);
  return {
    found: true,
    word: entry.word,
    word_display: entry.wordDisplay ?? entry.word,
    pos: entry.pos ?? undefined,
    approved: entry.approved,
    alternatives,
    examples: entry.examples.map((e) => ({
      ste: e.steText ?? undefined,
      non_ste: e.nonSteText ?? undefined,
    })),
    allowedForms: allowedForms.length > 0 ? allowedForms : undefined,
    meanings,
  };
}

/**
 * Collects all unique normalized word tokens from a tokenized document
 * (same criteria as STE-1.1: isWord, normalized, not pure digits).
 */
function getUniqueWordsForLookup(doc: TokenizedDocument): string[] {
  const set = new Set<string>();
  for (const sentence of doc.sentences) {
    for (const token of sentence.tokens) {
      if (!token.isWord || !token.normalized) continue;
      const n = token.normalized.trim().toLowerCase();
      if (n && !/^\d+$/.test(n)) set.add(n);
    }
  }
  return Array.from(set);
}

/**
 * Builds a dictionary lookup that preloads all unique words from the document
 * in a small number of batch queries. Use this for large documents to avoid
 * tens of thousands of per-word DB round-trips.
 */
export async function createBatchedPrismaLookup(
  prisma: PrismaClient,
  tokenized: TokenizedDocument
): Promise<DictionaryLookup> {
  const words = getUniqueWordsForLookup(tokenized);
  if (words.length === 0) {
    return () => Promise.resolve(null);
  }

  const wordToId = new Map<string, number>();

  for (let i = 0; i < words.length; i += BATCH_SIZE) {
    const chunk = words.slice(i, i + BATCH_SIZE);
    const forms = await prisma.steWordForm.findMany({
      where: { form: { in: chunk } },
      select: { form: true, wordId: true },
    });
    for (const row of forms) {
      wordToId.set(row.form, row.wordId);
    }
  }

  const missing = words.filter((w) => !wordToId.has(w));
  for (let i = 0; i < missing.length; i += BATCH_SIZE) {
    const chunk = missing.slice(i, i + BATCH_SIZE);
    const headwords = await prisma.steWord.findMany({
      where: { word: { in: chunk } },
      select: { id: true, word: true },
    });
    for (const row of headwords) {
      wordToId.set(row.word, row.id);
    }
  }

  const wordIds = [...new Set(wordToId.values())];
  const entriesById = new Map<number, DictionaryLookupResult>();

  for (let i = 0; i < wordIds.length; i += BATCH_SIZE) {
    const chunk = wordIds.slice(i, i + BATCH_SIZE);
    const entries = await prisma.steWord.findMany({
      where: { id: { in: chunk } },
      include: { forms: true, meanings: true, examples: true },
    });
    for (const entry of entries) {
      entriesById.set(entry.id, toLookupResult(entry));
    }
  }

  const resultMap = new Map<string, DictionaryLookupResult>();
  for (const w of words) {
    const id = wordToId.get(w);
    if (id != null) {
      const entry = entriesById.get(id);
      if (entry) resultMap.set(w, entry);
    }
  }

  if (typeof process !== "undefined" && process.env?.NODE_ENV !== "production") {
    console.log(
      "[analyze]",
      new Date().toISOString(),
      "Batched dictionary:",
      words.length,
      "unique words,",
      resultMap.size,
      "in dictionary"
    );
  }

  return (normalizedWord: string) =>
    Promise.resolve(resultMap.get(normalizedWord.trim().toLowerCase()) ?? null);
}

/**
 * Builds an async lookup function that uses the given Prisma client to
 * resolve form → headword and return the full entry (approved, alternatives, examples).
 * For large documents, prefer createBatchedPrismaLookup to avoid N+1 queries.
 */
export function createPrismaLookup(prisma: PrismaClient): (normalizedWord: string) => Promise<DictionaryLookupResult | null> {
  return async function lookup(normalizedWord: string): Promise<DictionaryLookupResult | null> {
    const normalized = normalizedWord.trim().toLowerCase();
    if (!normalized) return null;

    let wordId: number | null = null;

    const byForm = await prisma.steWordForm.findFirst({
      where: { form: normalized },
      select: { wordId: true },
    });
    if (byForm) {
      wordId = byForm.wordId;
    } else {
      const byHeadword = await prisma.steWord.findFirst({
        where: { word: normalized },
        select: { id: true },
      });
      if (byHeadword) wordId = byHeadword.id;
    }

    if (wordId == null) return null;

    const entry = await prisma.steWord.findUnique({
      where: { id: wordId },
      include: { forms: true, meanings: true, examples: true },
    });

    if (!entry) return null;

    return toLookupResult(entry);
  };
}
