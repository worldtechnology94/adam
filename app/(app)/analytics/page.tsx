"use client";

import { useState, useMemo } from "react";
import {
  getMockScoreTrend,
  getMockViolationCalendarDays,
  MOCK_ANALYTICS_RULE_FREQUENCY,
} from "@/app/lib/mock/mock-analytics";
import { ScoreTrendChart } from "@/app/components/analytics/ScoreTrendChart";
import { RuleFrequencyChart } from "@/app/components/analytics/RuleFrequencyChart";
import { ViolationCalendarPlaceholder } from "@/app/components/analytics/ViolationCalendarPlaceholder";

export default function AnalyticsPage() {
  const [trendDays] = useState(14);
  const scoreTrend = useMemo(() => getMockScoreTrend(trendDays), [trendDays]);
  const calendarDays = useMemo(() => getMockViolationCalendarDays(), []);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h1 className="text-xl font-semibold text-[var(--foreground)]">
            Analytics &amp; Trends
          </h1>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">
            Score trends, rule frequency, and compliance insights over time.
          </p>
        </div>
        <span
          className="rounded-full border border-[var(--border)] bg-[var(--muted)] px-3 py-1 text-xs font-medium text-[var(--muted-foreground)]"
          title="Demo mode. Charts use mock data."
        >
          Demo mode
        </span>
      </div>

      <section aria-labelledby="score-trend-heading">
        <h2 id="score-trend-heading" className="mb-3 text-sm font-semibold text-[var(--foreground)]">
          Compliance score trend (last 14 days)
        </h2>
        <div className="rounded-lg border border-[var(--border)] bg-[var(--background)] p-4">
          <ScoreTrendChart data={scoreTrend} />
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section aria-labelledby="rule-freq-heading">
          <h2 id="rule-freq-heading" className="mb-3 text-sm font-semibold text-[var(--foreground)]">
            Most violated rules (project)
          </h2>
          <div className="rounded-lg border border-[var(--border)] bg-[var(--background)] p-4">
            <RuleFrequencyChart data={MOCK_ANALYTICS_RULE_FREQUENCY} />
          </div>
        </section>

        <section aria-labelledby="calendar-heading">
          <h2 id="calendar-heading" className="mb-3 text-sm font-semibold text-[var(--foreground)]">
            Violation heatmap
          </h2>
          <ViolationCalendarPlaceholder days={calendarDays} />
        </section>
      </div>
    </div>
  );
}
