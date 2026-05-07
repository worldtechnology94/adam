"use client";

import { useMemo } from "react";
import { cn } from "@/app/lib/utils";

/**
 * Simple word-level diff: show original with removed words in red,
 * suggested with added words in green. Naive alignment for demo.
 */
function wordDiff(original: string, suggested: string): { type: "same" | "removed" | "added"; text: string }[] {
  const a = original.split(/\s+/).filter(Boolean);
  const b = suggested.split(/\s+/).filter(Boolean);
  const result: { type: "same" | "removed" | "added"; text: string }[] = [];
  let i = 0;
  let j = 0;
  while (i < a.length || j < b.length) {
    if (i < a.length && j < b.length && a[i] === b[j]) {
      result.push({ type: "same", text: a[i] });
      i++;
      j++;
    } else if (j < b.length && !a.includes(b[j])) {
      result.push({ type: "added", text: b[j] });
      j++;
    } else if (i < a.length && !b.includes(a[i])) {
      result.push({ type: "removed", text: a[i] });
      i++;
    } else if (i < a.length && j < b.length) {
      result.push({ type: "removed", text: a[i] });
      result.push({ type: "added", text: b[j] });
      i++;
      j++;
    } else if (i < a.length) {
      result.push({ type: "removed", text: a[i] });
      i++;
    } else {
      result.push({ type: "added", text: b[j] });
      j++;
    }
  }
  return result;
}

interface DiffViewProps {
  original: string;
  suggested: string;
  className?: string;
}

export function DiffView({ original, suggested, className }: DiffViewProps) {
  const segments = useMemo(
    () => wordDiff(original, suggested),
    [original, suggested]
  );

  return (
    <div
      className={cn("space-y-2 rounded-md border border-[var(--border)] bg-[var(--background)] p-3 font-sans text-sm", className)}
      role="figure"
      aria-label="Original vs suggested sentence diff"
    >
      <p className="text-xs font-medium text-[var(--muted-foreground)]">
        Original → Suggested
      </p>
      <p className="leading-relaxed">
        {segments.map((seg, idx) => (
          <span
            key={idx}
            className={cn(
              seg.type === "removed" && "bg-red-200 text-red-900 line-through dark:bg-red-900/40 dark:text-red-200",
              seg.type === "added" && "bg-emerald-200 text-emerald-900 dark:bg-emerald-900/40 dark:text-emerald-200",
              seg.type === "same" && "text-[var(--foreground)]"
            )}
          >
            {seg.text}{" "}
          </span>
        ))}
      </p>
    </div>
  );
}
