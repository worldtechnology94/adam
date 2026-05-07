/**
 * T3.2 — GET /api/documents/[id]
 *
 * Returns document metadata (id, name, filePath, mimeType, wordCount, sentenceCount, uploadedAt).
 *
 * @see thesisplan.md T3.2
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/db";

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

    return NextResponse.json({
      id: doc.id,
      name: doc.name,
      filePath: doc.filePath,
      mimeType: doc.mimeType,
      wordCount: doc.wordCount,
      sentenceCount: doc.sentenceCount,
      documentType: doc.documentType,
      revision: doc.revision,
      author: doc.author,
      uploadedAt: doc.uploadedAt.toISOString(),
    });
  } catch (e) {
    console.error("Document get error:", e);
    return NextResponse.json({ error: "Failed to fetch document" }, { status: 500 });
  }
}
