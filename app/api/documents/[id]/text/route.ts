/**
 * T3.2 — GET /api/documents/[id]/text
 *
 * Extracts and returns plain text from the document file.
 * Updates the Document's wordCount and sentenceCount if not yet set.
 *
 * @see thesisplan.md T3.2
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/db";
import { extractTextFromFile } from "@/app/lib/documents/extract-text";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const idParam = (await params).id;
  const id = parseInt(idParam, 10);
  if (Number.isNaN(id)) {
    return NextResponse.json({ error: "Invalid document id" }, { status: 400 });
  }

  try {
    const doc = await prisma.document.findUnique({
      where: { id },
    });

    if (!doc) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    const { text, wordCount, sentenceCount } = await extractTextFromFile(doc.filePath);

    if (doc.wordCount == null || doc.sentenceCount == null) {
      await prisma.document.update({
        where: { id },
        data: { wordCount, sentenceCount },
      });
    }

    return NextResponse.json({
      text,
      wordCount,
      sentenceCount,
    });
  } catch (e) {
    const err = e instanceof Error ? e : new Error(String(e));
    console.error("Document text extraction error:", err);
    return NextResponse.json(
      { error: "Failed to extract text", details: process.env.NODE_ENV !== "production" ? err.message : undefined },
      { status: 500 }
    );
  }
}
