"use client";

import { BookOpen } from "lucide-react";

interface RulesFoundStatProps {
  count: number;
}

const TOTAL_RULES = 60;

export function RulesFoundStat({ count }: RulesFoundStatProps) {
  const pct = Math.round((count / TOTAL_RULES) * 100);

  return (
    <div
      className="rounded-lg border border-[var(--border)] bg-[var(--background)] p-4"
      role="region"
      aria-label={`${count} of ${TOTAL_RULES} STE rules triggered in this document`}
    >
      <div className="flex items-center gap-3">
        <div
          className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-[var(--primary)] text-[var(--primary-foreground)]"
          aria-hidden
        >
          <BookOpen className="size-5" />
        </div>
        <div>
          <p className="text-sm font-medium text-[var(--muted-foreground)]">
            Rules triggered
          </p>
          <p className="text-2xl font-bold tabular-nums text-[var(--foreground)]">
            {count}
            <span className="ml-1 text-base font-medium text-[var(--muted-foreground)]">
              / {TOTAL_RULES}
            </span>
          </p>
        </div>
      </div>

      {/* Coverage bar */}
      <div className="mt-3">
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--muted)]">
          <div
            className="h-full rounded-full bg-[var(--primary)] transition-all duration-700"
            style={{ width: `${pct}%` }}
          />
        </div>
        <p className="mt-1 text-right text-xs text-[var(--muted-foreground)]">
          {pct}% rule coverage
        </p>
      </div>
    </div>
  );
}
