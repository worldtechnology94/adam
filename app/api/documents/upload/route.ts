/**
 * T3.1 — POST /api/documents/upload
 *
 * Multipart form with field "file". Accepts .docx, .txt, .md. Max 5 MB.
 * Saves to uploads/demo/<uuid>.<ext> and creates a Document record.
 *
 * @see thesisplan.md T3.1 — File upload and storage
 */

import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import { prisma } from "@/app/lib/db";

const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
const UPLOAD_DIR = "uploads/demo";

const ALLOWED_TYPES: Record<string, string> = {
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
  "text/plain": "txt",
  "text/markdown": "md",
  "application/pdf": "pdf",
};

const EXT_TO_MIME: Record<string, string> = {
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  txt: "text/plain",
  md: "text/markdown",
  pdf: "application/pdf",
};

function getExtFromMime(mimeType: string): string | null {
  return ALLOWED_TYPES[mimeType] ?? null;
}

function getExtFromFilename(filename: string): string | null {
  const lower = filename.toLowerCase();
  if (lower.endsWith(".docx")) return "docx";
  if (lower.endsWith(".txt")) return "txt";
  if (lower.endsWith(".md")) return "md";
  if (lower.endsWith(".pdf")) return "pdf";
  return null;
}

export async function POST(request: NextRequest) {
  const log = (msg: string, ...args: unknown[]) =>
    console.log(`[upload] ${new Date().toISOString()} ${msg}`, ...args);
  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof File)) {
      log("Rejected: missing or invalid file");
      return NextResponse.json(
        { error: "Missing or invalid form field: file" },
        { status: 400 }
      );
    }

    log("Start:", file.name, `${(file.size / 1024).toFixed(1)} KB`);

    if (file.size > MAX_SIZE_BYTES) {
      return NextResponse.json(
        { error: `File exceeds 5 MB limit (${(file.size / 1024 / 1024).toFixed(2)} MB)` },
        { status: 400 }
      );
    }

    let ext = getExtFromMime(file.type) ?? getExtFromFilename(file.name);
    if (!ext) {
      return NextResponse.json(
        { error: "Unsupported file type. Use .docx, .txt, .md, or .pdf" },
        { status: 400 }
      );
    }

    const dir = path.join(process.cwd(), UPLOAD_DIR);
    await mkdir(dir, { recursive: true });

    const uuid = randomUUID();
    const filename = `${uuid}.${ext}`;
    const filePath = path.join(dir, filename);
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(filePath, buffer);

    const relativePath = `${UPLOAD_DIR}/${filename}`;
    const mimeType = EXT_TO_MIME[ext] ?? file.type;

    const doc = await prisma.document.create({
      data: {
        name: file.name,
        filePath: relativePath,
        mimeType,
      },
    });

    log("Done: document id", doc.id);
    return NextResponse.json({
      id: doc.id,
      name: doc.name,
      filePath: doc.filePath,
      mimeType: doc.mimeType,
      wordCount: doc.wordCount,
      sentenceCount: doc.sentenceCount,
      uploadedAt: doc.uploadedAt.toISOString(),
    });
  } catch (e) {
    const err = e instanceof Error ? e : new Error(String(e));
    console.error("[upload]", new Date().toISOString(), "Error:", err.message);
    return NextResponse.json(
      { error: "Upload failed", details: process.env.NODE_ENV !== "production" ? err.message : undefined },
      { status: 500 }
    );
  }
}
