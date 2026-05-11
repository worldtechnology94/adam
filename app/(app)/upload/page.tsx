"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { DropZone } from "@/app/components/upload/DropZone";
import {
  FileQueue,
  type FileQueueItem,
} from "@/app/components/upload/FileQueue";
import {
  PreviewPane,
  canPreviewAsText,
  readFileAsText,
} from "@/app/components/upload/PreviewPane";
import { PasteFromClipboard } from "@/app/components/upload/PasteFromClipboard";
import {
  UploadMetadataForm,
  type UploadMetadataFormValues,
} from "@/app/components/upload/UploadMetadataForm";

const MAX_FILES = 20;

function generateId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export default function UploadPage() {
  const router = useRouter();
  const [queue, setQueue] = useState<FileQueueItem[]>([]);
  const [previewText, setPreviewText] = useState<string | null>(null);
  const [previewFileName, setPreviewFileName] = useState<string | undefined>();
  const [previewLoading, setPreviewLoading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [overflowMessage, setOverflowMessage] = useState<string | null>(null);

  const handleFilesAccepted = useCallback((files: File[]) => {
    setOverflowMessage(null);
    const newItems: FileQueueItem[] = files.map((file) => ({
      file,
      id: generateId(),
      progress: 0,
    }));
    setQueue((prev) => {
      const combined = [...prev, ...newItems].slice(0, MAX_FILES);
      const added = combined.length - prev.length;
      const skipped = newItems.length - added;
      if (skipped > 0) {
        setOverflowMessage(
          `Only the first ${MAX_FILES} files are kept. ${skipped} file(s) were not added.`
        );
      }
      return combined;
    });
    setTimeout(() => {
      setQueue((prev) =>
        prev.map((item) =>
          item.progress === 0 ? { ...item, progress: 100 } : item
        )
      );
    }, 800);
  }, []);

  const handleClearAll = useCallback(() => {
    setQueue([]);
    setPreviewText(null);
    setPreviewFileName(undefined);
    setOverflowMessage(null);
  }, []);

  const handleRemove = useCallback((id: string) => {
    setQueue((prev) => {
      const next = prev.filter((item) => item.id !== id);
      if (previewFileName && next.every((i) => i.file.name !== previewFileName)) {
        setPreviewText(null);
        setPreviewFileName(undefined);
      }
      return next;
    });
  }, [previewFileName]);

  // Update preview when queue changes: use first .txt/.md file
  useEffect(() => {
    const firstTextFile = queue.find((item) =>
      canPreviewAsText(item.file.name)
    );
    if (!firstTextFile) {
      setPreviewText(null);
      setPreviewFileName(undefined);
      return;
    }
    if (firstTextFile.file.name === previewFileName) return;

    setPreviewFileName(firstTextFile.file.name);
    setPreviewLoading(true);
    readFileAsText(firstTextFile.file)
      .then((text) => {
        setPreviewText(text.slice(0, 8000));
      })
      .catch(() => {
        setPreviewText(null);
      })
      .finally(() => {
        setPreviewLoading(false);
      });
  }, [queue, previewFileName]);

  const handleMetadataSubmit = useCallback((_values: UploadMetadataFormValues) => {
    // Optional: persist metadata to state/store when we have backend
  }, []);

  const ALLOWED_EXTENSIONS = [".docx", ".txt", ".md", ".pdf"];

  const handleAnalyze = useCallback(
    async (metadata: UploadMetadataFormValues) => {
      if (queue.length === 0) return;
      const files = queue.map((item) => item.file);
      const unsupported = files.filter(
        (f) => !ALLOWED_EXTENSIONS.some((ext) => f.name.toLowerCase().endsWith(ext))
      );
      if (unsupported.length > 0) {
        setOverflowMessage(
          `Unsupported file(s): ${unsupported.map((f) => f.name).join(", ")}. Use .docx, .txt, .md, or .pdf.`
        );
        return;
      }
      setIsAnalyzing(true);
      setOverflowMessage(null);
      try {
        let lastDocumentId: number | null = null;
        const total = files.length;
        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          const step = total > 1 ? ` (${i + 1}/${total})` : "";
          console.log("[Upload] Uploading", file.name + step);
          const formData = new FormData();
          formData.set("file", file);
          const uploadRes = await fetch("/api/documents/upload", {
            method: "POST",
            body: formData,
          });
          if (!uploadRes.ok) {
            const err = await uploadRes.json().catch(() => ({}));
            const detail = err.details ? ` — ${err.details}` : "";
            throw new Error((err.error ?? `Upload failed: ${file.name}`) + detail);
          }
          const uploadData = await uploadRes.json();
          const docId = uploadData.id;
          if (typeof docId !== "number") throw new Error("Invalid upload response");
          lastDocumentId = docId;
          console.log("[Upload] Analyzing document id", docId + step);
          const analyzeRes = await fetch(`/api/documents/${docId}/analyze`, {
            method: "POST",
          });
          if (!analyzeRes.ok) {
            const err = await analyzeRes.json().catch(() => ({}));
            throw new Error(err.error ?? `Analysis failed: ${file.name}`);
          }
          console.log("[Upload] Done", file.name + step);
        }
        console.log("[Upload] Redirecting to dashboard");
        router.push("/dashboard");
      } catch (e) {
        console.error("[Upload] Error:", e);
        setOverflowMessage(e instanceof Error ? e.message : "Upload or analysis failed");
      } finally {
        setIsAnalyzing(false);
      }
    },
    [queue, router]
  );

  const handlePaste = useCallback((file: File) => {
    handleFilesAccepted([file]);
  }, [handleFilesAccepted]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h1 className="text-xl font-semibold text-[var(--foreground)]">
            Document Upload
          </h1>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">
            Drag and drop or select documents for STE compliance analysis.
          </p>
        </div>
        <span
          className="rounded-full border border-[var(--border)] bg-[var(--muted)] px-3 py-1 text-xs font-medium text-[var(--muted-foreground)]"
          title="Files are uploaded and analyzed; dashboard and violations show the latest run."
        >
          .docx, .txt, .md, .pdf
        </span>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex-1">
          <DropZone onFilesAccepted={handleFilesAccepted} />
        </div>
        <PasteFromClipboard onPaste={handlePaste} className="sm:self-end" />
      </div>

      {overflowMessage && (
        <p className="text-sm text-[var(--accent)]" role="status">
          {overflowMessage}
        </p>
      )}

      {queue.length > 0 && (
        <FileQueue
          items={queue}
          onRemove={handleRemove}
          onClearAll={handleClearAll}
        />
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <PreviewPane
          fileName={previewFileName}
          previewText={previewText}
          isLoading={previewLoading}
        />
        <div className="rounded-lg border border-[var(--border)] bg-[var(--background)] p-4">
          <h2 className="mb-3 text-sm font-semibold text-[var(--foreground)]">
            Document metadata (optional)
          </h2>
          <UploadMetadataForm
            onSubmit={handleMetadataSubmit}
            onAnalyze={handleAnalyze}
            hasFiles={queue.length > 0}
            isAnalyzing={isAnalyzing}
          />
        </div>
      </div>
    </div>
  );
}
