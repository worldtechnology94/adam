import { readFile } from "fs/promises";
import path from "path";
import mammoth from "mammoth";
import { getSentences } from "@/app/lib/analysis";

export interface ExtractResult {
  text: string;
  wordCount: number;
  sentenceCount: number;
}

async function extractPdfText(buffer: Buffer): Promise<string> {
  // pdfjs-dist uses DOMMatrix internally for text transforms; polyfill it in Node.js.
  if (typeof globalThis.DOMMatrix === "undefined") {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (globalThis as any).DOMMatrix = class DOMMatrix {
      a=1;b=0;c=0;d=1;e=0;f=0;
      m11=1;m12=0;m13=0;m14=0;m21=0;m22=1;m23=0;m24=0;
      m31=0;m32=0;m33=1;m34=0;m41=0;m42=0;m43=0;m44=1;
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

  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");

  // Disable the worker — text extraction runs fine in-process on Node.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (pdfjs.GlobalWorkerOptions as any).workerSrc = "";

  const loadingTask = pdfjs.getDocument({
    data: new Uint8Array(buffer),
    useWorkerFetch: false,
    isEvalSupported: false,
    disableFontFace: true,
  });

  const pdfDoc = await loadingTask.promise;
  const pageTexts: string[] = [];

  for (let i = 1; i <= pdfDoc.numPages; i++) {
    const page = await pdfDoc.getPage(i);
    const content = await page.getTextContent();
    const pageText = content.items
      .map((item: unknown) => {
        const it = item as { str?: string };
        return it.str ?? "";
      })
      .join(" ");
    pageTexts.push(pageText);
    page.cleanup();
  }

  await pdfDoc.destroy();
  console.log("[extract-text] PDF pages:", pdfDoc.numPages, "chars:", pageTexts.join("").length);
  return pageTexts.join("\n");
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
