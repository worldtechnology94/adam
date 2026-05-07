"use client";

import { useCallback, useState } from "react";
import { ClipboardPaste } from "lucide-react";
import { cn } from "@/app/lib/utils";

interface PasteFromClipboardProps {
  onPaste: (file: File) => void;
  disabled?: boolean;
  className?: string;
}

export function PasteFromClipboard({
  onPaste,
  disabled = false,
  className,
}: PasteFromClipboardProps) {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleClick = useCallback(async () => {
    setError(null);
    setSuccess(false);
    try {
      const text = await navigator.clipboard.readText();
      if (!text.trim()) {
        setError("Clipboard is empty or contains no text.");
        return;
      }
      const file = new File(
        [text],
        `pasted-content-${Date.now()}.txt`,
        { type: "text/plain" }
      );
      onPaste(file);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2000);
    } catch (e) {
      setError(
        "Could not read clipboard. Ensure the page has permission or paste manually into a text file."
      );
    }
  }, [onPaste]);

  return (
    <div className={cn("flex flex-col gap-1", className)}>
      <button
        type="button"
        onClick={handleClick}
        disabled={disabled}
        className="inline-flex items-center gap-2 rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm font-medium text-[var(--foreground)] hover:bg-[var(--muted)] disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ring)]"
        aria-label="Paste text from clipboard as a new document"
      >
        <ClipboardPaste className="size-4" aria-hidden />
        Paste from clipboard
      </button>
      {error && (
        <p className="text-xs text-[var(--danger)]" role="alert">
          {error}
        </p>
      )}
      {success && (
        <p className="text-xs text-[var(--success)]" role="status">
          Pasted content added to queue.
        </p>
      )}
    </div>
  );
}
