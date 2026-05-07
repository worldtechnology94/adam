"use client";

import { useMemo } from "react";
import { RULE_IDS, SENTENCE_TYPE_LABELS, SEVERITY_LABELS } from "@/app/lib/mock/mock-violations";
import type { ViolationSeverity, ViolationSentenceType } from "@/app/lib/mock/mock-violations";
import { cn } from "@/app/lib/utils";

export interface ViolationsFilters {
  ruleId: string;
  sentenceType: string;
  severity: string;
  keyword: string;
}

const DEFAULT_FILTERS: ViolationsFilters = {
  ruleId: "",
  sentenceType: "",
  severity: "",
  keyword: "",
};

interface ViolationsFilterBarProps {
  filters: ViolationsFilters;
  onFiltersChange: (f: ViolationsFilters) => void;
  className?: string;
}

export function ViolationsFilterBar({
  filters,
  onFiltersChange,
  className,
}: ViolationsFilterBarProps) {
  const update = (key: keyof ViolationsFilters, value: string) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const hasActiveFilters = useMemo(
    () =>
      filters.ruleId !== "" ||
      filters.sentenceType !== "" ||
      filters.severity !== "" ||
      filters.keyword.trim() !== "",
    [filters]
  );

  const clearFilters = () => {
    onFiltersChange({ ...DEFAULT_FILTERS });
  };

  return (
    <div
      className={cn(
        "flex flex-wrap items-end gap-3 rounded-lg border border-[var(--border)] bg-[var(--background)] p-4",
        className
      )}
      role="search"
      aria-label="Filter violations"
    >
      <div className="min-w-[10rem] flex-1">
        <label htmlFor="filter-keyword" className="mb-1 block text-xs font-medium text-[var(--muted-foreground)]">
          Keyword
        </label>
        <input
          id="filter-keyword"
          type="text"
          value={filters.keyword}
          onChange={(e) => update("keyword", e.target.value)}
          placeholder="Search in sentence or suggestion..."
          className="w-full rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm focus:border-[var(--ring)] focus:outline-none focus:ring-1 focus:ring-[var(--ring)]"
        />
      </div>
      <div>
        <label htmlFor="filter-rule" className="mb-1 block text-xs font-medium text-[var(--muted-foreground)]">
          Rule
        </label>
        <select
          id="filter-rule"
          value={filters.ruleId}
          onChange={(e) => update("ruleId", e.target.value)}
          className="rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm focus:border-[var(--ring)] focus:outline-none focus:ring-1 focus:ring-[var(--ring)]"
        >
          <option value="">All rules</option>
          {RULE_IDS.map((id) => (
            <option key={id} value={id}>
              {id}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="filter-type" className="mb-1 block text-xs font-medium text-[var(--muted-foreground)]">
          Sentence type
        </label>
        <select
          id="filter-type"
          value={filters.sentenceType}
          onChange={(e) => update("sentenceType", e.target.value)}
          className="rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm focus:border-[var(--ring)] focus:outline-none focus:ring-1 focus:ring-[var(--ring)]"
        >
          <option value="">All types</option>
          {(Object.entries(SENTENCE_TYPE_LABELS) as [ViolationSentenceType, string][]).map(
            ([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            )
          )}
        </select>
      </div>
      <div>
        <label htmlFor="filter-severity" className="mb-1 block text-xs font-medium text-[var(--muted-foreground)]">
          Severity
        </label>
        <select
          id="filter-severity"
          value={filters.severity}
          onChange={(e) => update("severity", e.target.value)}
          className="rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm focus:border-[var(--ring)] focus:outline-none focus:ring-1 focus:ring-[var(--ring)]"
        >
          <option value="">All</option>
          {(Object.entries(SEVERITY_LABELS) as [ViolationSeverity, string][]).map(
            ([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            )
          )}
        </select>
      </div>
      {hasActiveFilters && (
        <button
          type="button"
          onClick={clearFilters}
          className="rounded-md border border-[var(--border)] px-3 py-2 text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ring)]"
        >
          Clear filters
        </button>
      )}
    </div>
  );
}

export { DEFAULT_FILTERS };
