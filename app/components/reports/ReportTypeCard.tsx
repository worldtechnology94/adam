"use client";

import type { ReportType } from "@/app/lib/mock/mock-reports";
import { cn } from "@/app/lib/utils";

interface ReportTypeCardProps {
  report: ReportType;
  selected: boolean;
  onSelect: () => void;
}

export function ReportTypeCard({ report, selected, onSelect }: ReportTypeCardProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "w-full rounded-lg border px-4 py-3 text-left transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ring)]",
        selected
          ? "border-[var(--primary)] bg-[var(--primary)]/10"
          : "border-[var(--border)] bg-[var(--background)] hover:bg-[var(--muted)]/50"
      )}
      aria-pressed={selected}
      aria-label={`Select ${report.name}`}
    >
      <span className="font-medium text-[var(--foreground)]">{report.name}</span>
      <p className="mt-1 text-sm text-[var(--muted-foreground)]">
        {report.description}
      </p>
    </button>
  );
}
