"use client";

import { FileText } from "lucide-react";
import { cn } from "@/app/lib/utils";

interface PreviewPaneProps {
  fileName?: string;
  previewText?: string | null;
  isLoading?: boolean;
  className?: string;
}

const TEXT_EXTENSIONS = [".txt", ".md"];

export function PreviewPane({
  fileName,
  previewText,
  isLoading = false,
  className,
}: PreviewPaneProps) {
  const hasPreview = previewText != null && previewText.length > 0;

  return (
    <div
      className={cn(
        "rounded-lg border border-[var(--border)] bg-[var(--background)]",
        className
      )}
      role="region"
      aria-label="Document preview"
    >
      <div className="flex items-center gap-2 border-b border-[var(--border)] px-4 py-2">
        <FileText
          className="size-4 text-[var(--muted-foreground)]"
          aria-hidden
        />
        <span className="text-sm font-semibold text-[var(--foreground)]">
          Pre-analysis preview
        </span>
        {fileName && (
          <span className="truncate text-xs text-[var(--muted-foreground)]">
            {fileName}
          </span>
        )}
      </div>
      <div className="min-h-[10rem] max-h-[20rem] overflow-auto p-4">
        {isLoading && (
          <p className="text-sm text-[var(--muted-foreground)]">
            Loading preview...
          </p>
        )}
        {!isLoading && !fileName && (
          <p className="text-sm text-[var(--muted-foreground)]">
            Select or drop a document to see a preview.
          </p>
        )}
        {!isLoading && fileName && !hasPreview && (
          <p className="text-sm text-[var(--muted-foreground)]">
            Preview not available for this format. Analysis will run on the full
            document.
          </p>
        )}
        {!isLoading && hasPreview && (
          <pre className="whitespace-pre-wrap font-sans text-sm text-[var(--foreground)]">
            {previewText}
          </pre>
        )}
      </div>
    </div>
  );
}

export function canPreviewAsText(fileName: string): boolean {
  const lower = fileName.toLowerCase();
  return TEXT_EXTENSIONS.some((ext) => lower.endsWith(ext));
}

export function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve((reader.result as string) ?? "");
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file, "UTF-8");
  });
}
