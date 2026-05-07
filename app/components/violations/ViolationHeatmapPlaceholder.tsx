"use client";

import { BarChart3 } from "lucide-react";
import { cn } from "@/app/lib/utils";

interface ViolationHeatmapPlaceholderProps {
  className?: string;
}

/**
 * Placeholder for "Violation heatmap" — document preview with density per paragraph.
 * Will be replaced with real heatmap when we have paragraph-level data.
 */
export function ViolationHeatmapPlaceholder({ className }: ViolationHeatmapPlaceholderProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-[var(--border)] bg-[var(--muted)]/20 p-8 text-center",
        className
      )}
      role="region"
      aria-label="Violation heatmap placeholder"
    >
      <BarChart3 className="size-10 text-[var(--muted-foreground)]" aria-hidden />
      <p className="text-sm font-medium text-[var(--foreground)]">
        Violation heatmap
      </p>
      <p className="text-xs text-[var(--muted-foreground)]">
        Document preview with density of violations per paragraph will appear here.
      </p>
    </div>
  );
}
