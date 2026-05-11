import { readFile } from "fs/promises";
import path from "path";
import mammoth from "mammoth";
import { getSentences } from "@/app/lib/analysis";

export interface ExtractResult {
  text: string;
  wordCount: number;
  sentenceCount: number;
}

function polyfillDOMMatrix() {
  if (typeof globalThis.DOMMatrix !== "undefined") return;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (globalThis as any).DOMMatrix = class DOMMatrix {
    a=1;b=0;c=0;d=1;e=0;f=0;
    is2D=true;isIdentity=true;
    multiply(){ return this; }
    translate(){ return this; }
    scale(){ return this; }
    rotate(){ return this; }
    inverse(){ return this; }
    transformPoint(p: unknown){ return p; }
    toString(){ return "matrix(1,0,0,1,0,0)"; }
  };
}

async function extractPdfText(buffer: Buffer): Promise<string> {
  polyfillDOMMatrix();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mod = await import("pdf-parse") as any;
  const pdfParse = mod.default ?? mod;
  const data = await pdfParse(buffer);
  console.log("[extract-text] PDF pages:", data.numpages, "chars:", data.text.length);
  return data.text;
}

async function extractTextFromBuffer(buffer: Buffer, ext: string): Promise<ExtractResult> {
  let text: string;

  if (ext === "docx") {
    const result = await mammoth.extractRawText({ buffer });
    text = result.value;
  } else if (ext === "txt" || ext === "md") {
    text = buffer.toString("utf-8");
  } else if (ext === "pdf") {
    text = await extractPdfText(buffer);
  } else {
    throw new Error(`Unsupported file type: .${ext}. Use .docx, .txt, .md, or .pdf`);
  }

  const trimmed = text.trim();
  const sentences = getSentences(trimmed);
  const sentenceCount = sentences.length;
  const wordCount = sentences.reduce((acc, s) => acc + s.split(/\s+/).filter(Boolean).length, 0);

  return { text: trimmed, wordCount, sentenceCount };
}

/**
 * Extracts plain text from a file on disk.
 * filePathOrRelative: absolute path or relative like "uploads/demo/uuid.docx".
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
