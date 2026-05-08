/**
 * T3.2 — Extract plain text from uploaded documents.
 *
 * .docx → mammoth.extractRawText; .txt / .md → fs read utf-8; .pdf → pdf-parse.
 * Used to populate wordCount and sentenceCount and to feed the STE-1.1 engine.
 *
 * @see thesisplan.md T3.2 — Text extraction
 */

import { readFile } from "fs/promises";
import path from "path";
import { pathToFileURL } from "url";
import mammoth from "mammoth";
import { PDFParse } from "pdf-parse";
import { getSentences } from "@/app/lib/analysis";

/** Set PDF.js worker to a resolvable path in Node (Next.js server) so analysis doesn't fail. */
function setPdfWorkerPath(): void {
  const workerPath = path.join(
    process.cwd(),
    "node_modules",
    "pdfjs-dist",
    "legacy",
    "build",
    "pdf.worker.mjs"
  );
  try {
    PDFParse.setWorker(pathToFileURL(workerPath).href);
  } catch {
    // ignore if already set or unsupported
  }
}

// Set worker path once when this module loads in Node so PDFParse works in API routes.
if (typeof process !== "undefined" && typeof process.cwd === "function") {
  setPdfWorkerPath();
}

export interface ExtractResult {
  text: string;
  wordCount: number;
  sentenceCount: number;
}

async function extractTextFromBuffer(buffer: Buffer, ext: string): Promise<ExtractResult> {
  let text: string;

  if (ext === "docx") {
    const result = await mammoth.extractRawText({ buffer });
    text = result.value;
  } else if (ext === "txt" || ext === "md") {
    text = buffer.toString("utf-8");
  } else if (ext === "pdf") {
    console.log("[extract-text]", new Date().toISOString(), "PDF: start parsing");
    const parser = new PDFParse({ data: new Uint8Array(buffer) });
    try {
      const result = await parser.getText();
      text = result.text ?? "";
      console.log("[extract-text]", new Date().toISOString(), "PDF: done,", text.length, "chars");
    } finally {
      await parser.destroy();
    }
  } else {
    throw new Error(`Unsupported extension for text extraction: ${ext}`);
  }

  const trimmed = text.trim();
  const sentences = getSentences(trimmed);
  const sentenceCount = sentences.length;
  const wordCount = sentences.reduce((acc, s) => acc + s.split(/\s+/).filter(Boolean).length, 0);

  return { text: trimmed, wordCount, sentenceCount };
}

/**
 * Extracts plain text from a file on disk and returns text plus simple word/sentence counts.
 * filePathOrRelative: either absolute path or relative like "uploads/demo/uuid.docx".
 */
export async function extractTextFromFile(filePathOrRelative: string): Promise<ExtractResult> {
  const absolutePath = path.isAbsolute(filePathOrRelative)
    ? filePathOrRelative
    : path.join(process.cwd(), filePathOrRelative);

  const ext = path.extname(absolutePath).toLowerCase().replace(/^\./, "");
  const buffer = await readFile(absolutePath);
  return extractTextFromBuffer(buffer, ext);
}

/**
 * Extracts plain text directly from an in-memory buffer (no filesystem required).
 * Used by the upload route on serverless environments like Vercel.
 */
export async function extractTextFromMemory(buffer: Buffer, filename: string): Promise<ExtractResult> {
  const ext = filename.toLowerCase().split(".").pop() ?? "";
  return extractTextFromBuffer(buffer, ext);
}
