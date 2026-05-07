"use client";

import { FileText } from "lucide-react";
import type { ProjectDocument } from "@/app/lib/mock/mock-projects";
import { cn } from "@/app/lib/utils";

interface ProjectDocumentListProps {
  documents: ProjectDocument[];
  className?: string;
}

function scoreColor(score: number): string {
  if (score >= 80) return "text-[var(--success)]";
  if (score >= 60) return "text-[var(--accent)]";
  return "text-[var(--danger)]";
}

export function ProjectDocumentList({ documents, className }: ProjectDocumentListProps) {
  if (documents.length === 0) {
    return (
      <p className="text-sm text-[var(--muted-foreground)]">
        No documents in this project yet. Upload documents from the Upload page and assign them to this project.
      </p>
    );
  }
  return (
    <ul className={cn("space-y-2", className)} role="list">
      {documents.map((doc) => (
        <li
          key={doc.id}
          className="flex items-center gap-3 rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-2"
        >
          <FileText className="size-4 shrink-0 text-[var(--muted-foreground)]" aria-hidden />
          <div className="min-w-0 flex-1">
            <span className="truncate text-sm font-medium text-[var(--foreground)]">
              {doc.name}
            </span>
            <span className="ml-2 text-xs text-[var(--muted-foreground)]">
              Analyzed {doc.lastAnalyzed}
            </span>
          </div>
          <span className={cn("shrink-0 text-sm font-medium", scoreColor(doc.score))}>
            {doc.score}%
          </span>
        </li>
      ))}
    </ul>
  );
}
