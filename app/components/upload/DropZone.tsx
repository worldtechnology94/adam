"use client";

import { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Upload } from "lucide-react";
import { cn } from "@/app/lib/utils";

const ACCEPTED_TYPES = {
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
  "application/msword": [".doc"],
  "application/pdf": [".pdf"],
  "text/plain": [".txt"],
  "text/markdown": [".md"],
  "application/xml": [".xml"],
  "text/xml": [".xml"],
  "text/sgml": [".sgml"],
} as const;

const ACCEPTED_EXTENSIONS = ".docx,.doc,.pdf,.txt,.md,.xml,.sgml";

const MAX_FILES = 20;
const MAX_SIZE = 50 * 1024 * 1024; // 50 MB per file

export interface DropZoneProps {
  onFilesAccepted: (files: File[]) => void;
  disabled?: boolean;
  className?: string;
}

export function DropZone({
  onFilesAccepted,
  disabled = false,
  className,
}: DropZoneProps) {
  const onDrop = useCallback(
    (accepted: File[]) => {
      onFilesAccepted(accepted);
    },
    [onFilesAccepted]
  );

  const { getRootProps, getInputProps, isDragActive, fileRejections } = useDropzone({
    onDropAccepted: onDrop,
    accept: ACCEPTED_TYPES,
    maxFiles: MAX_FILES,
    maxSize: MAX_SIZE,
    disabled,
    multiple: true,
  });

  return (
    <div className={cn("w-full", className)}>
      <div
        {...getRootProps()}
        className={cn(
          "flex min-h-[12rem] cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 transition-colors",
          "border-[var(--border)] bg-[var(--muted)]/30 hover:border-[var(--primary)] hover:bg-[var(--muted)]/50",
          "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ring)]",
          isDragActive && "border-[var(--primary)] bg-[var(--muted)]",
          disabled && "cursor-not-allowed opacity-60"
        )}
        aria-label="Drop documents here or click to select files"
      >
        <input {...getInputProps()} aria-describedby="dropzone-hint" />
        <Upload
          className="mb-2 size-10 text-[var(--muted-foreground)]"
          aria-hidden
        />
        <p className="text-center text-sm font-medium text-[var(--foreground)]">
          {isDragActive
            ? "Drop the files here..."
            : "Drag and drop documents here, or click to select"}
        </p>
        <p
          id="dropzone-hint"
          className="mt-1 text-center text-xs text-[var(--muted-foreground)]"
        >
          {ACCEPTED_EXTENSIONS} (max {MAX_FILES} files, 50 MB each)
        </p>
      </div>
      {fileRejections.length > 0 && (
        <div className="mt-2 space-y-1" role="alert">
          <p className="text-sm font-medium text-[var(--danger)]">
            {fileRejections.length} file(s) rejected:
          </p>
          <ul className="list-inside list-disc space-y-0.5 text-xs text-[var(--danger)]">
            {fileRejections.map(({ file, errors }) => {
              const reason = errors.some((e) => e.code === "file-too-large")
                ? "too large"
                : errors.some((e) => e.code === "file-invalid-type")
                  ? "wrong type"
                  : "rejected";
              return (
                <li key={file.name + file.size}>
                  <span className="font-medium">{file.name}</span> — {reason}
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
