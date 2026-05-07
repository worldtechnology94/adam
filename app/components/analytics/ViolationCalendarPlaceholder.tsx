"use client";

import { Calendar } from "lucide-react";
import type { CalendarDay } from "@/app/lib/mock/mock-analytics";
import { cn } from "@/app/lib/utils";

interface ViolationCalendarPlaceholderProps {
  days: CalendarDay[];
  className?: string;
}

function intensityClass(count: number): string {
  if (count === 0) return "bg-[var(--muted)]/30";
  if (count <= 1) return "bg-[var(--accent)]/40";
  if (count <= 2) return "bg-[var(--accent)]/60";
  return "bg-[var(--accent)]";
}

export function ViolationCalendarPlaceholder({ days, className }: ViolationCalendarPlaceholderProps) {
  return (
    <div
      className={cn(
        "rounded-lg border border-[var(--border)] bg-[var(--background)] p-4",
        className
      )}
      aria-label="Violation activity by day (demo)"
    >
      <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-[var(--foreground)]">
        <Calendar className="size-4" aria-hidden />
        Violation activity
      </div>
      <div className="grid grid-cols-7 gap-1 text-center">
        {days.map((d) => (
          <div
            key={d.date}
            className={cn(
              "rounded p-1 text-xs",
              intensityClass(d.count)
            )}
            title={`${d.date}: ${d.count} violation${d.count !== 1 ? "s" : ""}`}
          >
            {d.count > 0 ? d.count : "·"}
          </div>
        ))}
      </div>
      <p className="mt-2 text-xs text-[var(--muted-foreground)]">
        Demo: density of violations per day. Connect backend for real data.
      </p>
    </div>
  );
}
