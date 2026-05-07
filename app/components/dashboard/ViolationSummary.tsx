"use client";

import { AlertCircle, AlertTriangle, Info } from "lucide-react";

interface ViolationSummaryProps {
  total: number;
  critical: number;
  major: number;
  minor: number;
}

export function ViolationSummary({
  total,
  critical,
  major,
  minor,
}: ViolationSummaryProps) {
  const pct = (n: number) =>
    total > 0 ? `${Math.round((n / total) * 100)}%` : "0%";

  const items = [
    {
      label: "Critical",
      count: critical,
      colorVar: "var(--danger)",
      className: "severity-critical",
      icon: AlertCircle,
    },
    {
      label: "Major",
      count: major,
      colorVar: "var(--accent)",
      className: "severity-major",
      icon: AlertTriangle,
    },
    {
      label: "Minor",
      count: minor,
      colorVar: "var(--muted-foreground)",
      className: "severity-minor",
      icon: Info,
    },
  ] as const;

  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--background)] p-4">
      <h3 className="text-sm font-semibold text-[var(--foreground)]">
        Total violations
      </h3>
      <p className="mt-1 text-3xl font-bold tabular-nums text-[var(--foreground)]">
        {total}
      </p>

      {/* Stacked severity bar */}
      {total > 0 && (
        <div
          className="mt-3 flex h-2 w-full overflow-hidden rounded-full"
          role="img"
          aria-label={`Severity breakdown: ${critical} critical, ${major} major, ${minor} minor`}
        >
          {critical > 0 && (
            <div
              style={{ width: pct(critical), backgroundColor: "var(--danger)" }}
              title={`Critical: ${critical}`}
            />
          )}
          {major > 0 && (
            <div
              style={{ width: pct(major), backgroundColor: "var(--accent)" }}
              title={`Major: ${major}`}
            />
          )}
          {minor > 0 && (
            <div
              style={{ width: pct(minor), backgroundColor: "var(--muted-foreground)", opacity: 0.5 }}
              title={`Minor: ${minor}`}
            />
          )}
        </div>
      )}
      {total === 0 && (
        <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-[var(--success)] opacity-30" />
      )}

      {/* Severity counts */}
      <ul className="mt-3 space-y-1.5" role="list" aria-label="Violations by severity">
        {items.map(({ label, count, colorVar, className, icon: Icon }) => (
          <li key={label} className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-sm text-[var(--muted-foreground)]">
              <Icon className={`size-3.5 shrink-0 ${className}`} aria-hidden strokeWidth={2} />
              {label}
            </span>
            <span
              className="text-sm font-semibold tabular-nums"
              style={{ color: count > 0 ? colorVar : "var(--muted-foreground)" }}
            >
              {count}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
