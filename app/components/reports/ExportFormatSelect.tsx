"use client";

import type { ExportFormat } from "@/app/lib/mock/mock-reports";
import { EXPORT_FORMATS } from "@/app/lib/mock/mock-reports";
import { cn } from "@/app/lib/utils";

interface ExportFormatSelectProps {
  value: ExportFormat;
  onChange: (format: ExportFormat) => void;
  disabled?: boolean;
  className?: string;
}

export function ExportFormatSelect({
  value,
  onChange,
  disabled,
  className,
}: ExportFormatSelectProps) {
  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      <span className="sr-only">Export format</span>
      {EXPORT_FORMATS.map(({ value: v, label }) => (
        <button
          key={v}
          type="button"
          onClick={() => onChange(v)}
          disabled={disabled}
          className={cn(
            "rounded-md border px-3 py-1.5 text-sm font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ring)] disabled:opacity-50",
            value === v
              ? "border-[var(--primary)] bg-[var(--primary)] text-[var(--primary-foreground)]"
              : "border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] hover:bg-[var(--muted)]"
          )}
          aria-pressed={value === v}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
