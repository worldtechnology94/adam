"use client";

import { FileText, Hash, MessageSquare, Calendar, Tag } from "lucide-react";
import type { DocumentMetadata } from "@/app/lib/mock/mock-dashboard";

const documentTypeLabels: Record<DocumentMetadata["documentType"], string> = {
  procedure: "Procedure",
  description: "Description",
  warning: "Warning",
  mixed: "Mixed",
};

function formatDate(iso: string): string {
  try {
    const d = new Date(iso);
    return new Intl.DateTimeFormat("en-GB", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(d);
  } catch {
    return iso;
  }
}

interface DocumentMetadataBarProps {
  document: DocumentMetadata;
}

export function DocumentMetadataBar({ document: doc }: DocumentMetadataBarProps) {
  return (
    <div
      className="flex flex-wrap items-center gap-x-6 gap-y-2 rounded-lg border border-[var(--border)] bg-[var(--muted)]/50 px-4 py-3"
      role="region"
      aria-label="Document metadata"
    >
      <div className="flex min-w-0 flex-1 items-center gap-2 sm:min-w-0">
        <FileText
          className="size-4 shrink-0 text-[var(--muted-foreground)]"
          aria-hidden
        />
        <span
          className="truncate text-sm font-medium text-[var(--foreground)]"
          title={doc.fileName}
        >
          {doc.fileName}
        </span>
      </div>
      <div className="flex flex-wrap items-center gap-4 text-sm text-[var(--muted-foreground)]">
        <span className="flex items-center gap-1.5" title="Word count">
          <Hash className="size-4 shrink-0" aria-hidden />
          <span>{doc.wordCount.toLocaleString()} words</span>
        </span>
        <span className="flex items-center gap-1.5" title="Sentence count">
          <MessageSquare className="size-4 shrink-0" aria-hidden />
          <span>{doc.sentenceCount} sentences</span>
        </span>
        <span className="flex items-center gap-1.5" title="Upload time">
          <Calendar className="size-4 shrink-0" aria-hidden />
          <span>{formatDate(doc.uploadTimestamp)}</span>
        </span>
        <span className="flex items-center gap-1.5" title="Document type">
          <Tag className="size-4 shrink-0" aria-hidden />
          <span>{documentTypeLabels[doc.documentType]}</span>
        </span>
      </div>
    </div>
  );
}
