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
  // Dynamic import avoids module-level failures on environments where the
  // PDF.js worker or native deps are unavailable (e.g. Vercel serverless).
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
