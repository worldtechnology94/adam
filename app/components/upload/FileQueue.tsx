"use client";

import { FileText, X } from "lucide-react";
import * as Progress from "@radix-ui/react-progress";
import { cn } from "@/app/lib/utils";

export interface FileQueueItem {
  file: File;
  id: string;
  progress?: number; // 0–100, optional for simulated progress
}

interface FileQueueProps {
  items: FileQueueItem[];
  onRemove: (id: string) => void;
  onClearAll?: () => void;
  className?: string;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function FileQueue({ items, onRemove, onClearAll, className }: FileQueueProps) {
  if (items.length === 0) return null;

  return (
    <div
      className={cn("rounded-lg border border-[var(--border)] bg-[var(--background)]", className)}
      role="region"
      aria-label="Upload queue"
    >
      <div className="flex items-center justify-between gap-2 border-b border-[var(--border)] px-4 py-2">
        <h3 className="text-sm font-semibold text-[var(--foreground)]">
          Files ({items.length})
        </h3>
        {onClearAll && (
          <button
            type="button"
            onClick={onClearAll}
            className="text-xs font-medium text-[var(--muted-foreground)] hover:text-[var(--foreground)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ring)]"
          >
            Clear all
          </button>
        )}
      </div>
      <ul className="divide-y divide-[var(--border)]" role="list">
        {items.map(({ file, id, progress }) => (
          <li
            key={id}
            className="flex items-center gap-3 px-4 py-3"
          >
            <FileText
              className="size-5 shrink-0 text-[var(--muted-foreground)]"
              aria-hidden
            />
            <div className="min-w-0 flex-1">
              <p
                className="truncate text-sm font-medium text-[var(--foreground)]"
                title={file.name}
              >
                {file.name}
              </p>
              <p className="text-xs text-[var(--muted-foreground)]">
                {formatSize(file.size)}
              </p>
              {progress !== undefined && (
                <Progress.Root
                  value={progress}
                  className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-[var(--muted)]"
                  aria-valuenow={progress}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label={`Upload progress ${progress}%`}
                >
                  <Progress.Indicator
                    className="h-full bg-[var(--primary)] transition-transform duration-300"
                    style={{ transform: `translateX(-${100 - progress}%)` }}
                  />
                </Progress.Root>
              )}
            </div>
            <button
              type="button"
              onClick={() => onRemove(id)}
              className="shrink-0 rounded-md p-1.5 text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ring)]"
              aria-label={`Remove ${file.name}`}
            >
              <X className="size-4" aria-hidden />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
