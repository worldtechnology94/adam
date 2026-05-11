"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Upload } from "lucide-react";
import type {
  DashboardSummary,
  DocumentMetadata,
  ActivityEntry,
} from "@/app/lib/mock/mock-dashboard";
import { ComplianceScoreGauge } from "@/app/components/dashboard/ComplianceScoreGauge";
import { ViolationSummary } from "@/app/components/dashboard/ViolationSummary";
import { DocumentMetadataBar } from "@/app/components/dashboard/DocumentMetadataBar";
import { RecentActivityFeed } from "@/app/components/dashboard/RecentActivityFeed";
import { MostViolatedRulesChart } from "@/app/components/dashboard/MostViolatedRulesChart";
import { SentenceTypePieChart } from "@/app/components/dashboard/SentenceTypePieChart";
import { ViolationDistributionDonut } from "@/app/components/dashboard/ViolationDistributionDonut";
import { RulesFoundStat } from "@/app/components/dashboard/RulesFoundStat";

function emptySummary(): DashboardSummary {
  return {
    complianceScore: 100,
    violations: { total: 0, critical: 0, major: 0, minor: 0 },
    topViolatedRules: [],
    rulesFoundCount: 0,
    sentenceTypeBreakdown: [],
    violationDistribution: [],
    document: {
      fileName: "",
      wordCount: 0,
      sentenceCount: 0,
      uploadTimestamp: new Date().toISOString(),
      documentType: "mixed",
    },
    recentActivity: [],
  };
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetch("/api/dashboard/summary")
      .then((res) => {
        if (!res.ok) throw new Error(res.statusText);
        return res.json();
      })
      .then((raw) => {
        if (cancelled) return;
        if (raw.document == null) {
          setData(emptySummary());
          return;
        }
        setData({
          complianceScore: raw.complianceScore ?? 100,
          violations: raw.violations ?? { total: 0, critical: 0, major: 0, minor: 0 },
          topViolatedRules: raw.topViolatedRules ?? [],
          rulesFoundCount: raw.rulesFoundCount ?? 0,
          sentenceTypeBreakdown: raw.sentenceTypeBreakdown ?? [],
          violationDistribution: raw.violationDistribution ?? [],
          document: raw.document as DocumentMetadata,
          recentActivity: (raw.recentActivity ?? []) as ActivityEntry[],
        });
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-sm text-[var(--muted-foreground)]">Loading dashboard…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-[var(--border)] bg-[var(--background)] p-6">
        <p className="text-sm text-red-600">Error: {error}</p>
      </div>
    );
  }

  const summary = data ?? emptySummary();
  const hasDocument = summary.document.fileName.length > 0;

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-[var(--foreground)]">Dashboard</h1>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">
            Compliance overview and at-a-glance health summary.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {hasDocument ? (
            <span className="rounded-full border border-[var(--border)] bg-[var(--muted)] px-3 py-1 text-xs font-medium text-[var(--muted-foreground)]">
              Live data
            </span>
          ) : (
            <span className="rounded-full border border-[var(--border)] bg-[var(--muted)] px-3 py-1 text-xs font-medium text-[var(--muted-foreground)]">
              No document
            </span>
          )}
          <Link
            href="/upload"
            className="flex items-center gap-1.5 rounded-lg bg-[var(--primary)] px-3 py-1.5 text-xs font-semibold text-[var(--primary-foreground)] transition-opacity hover:opacity-90"
          >
            <Upload className="size-3.5" aria-hidden />
            Analyse document
          </Link>
        </div>
      </div>

      {/* Document metadata bar */}
      {hasDocument && <DocumentMetadataBar document={summary.document} />}

      {/* Key metrics — gauge takes 2 cols on large screens */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="flex flex-col items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--background)] p-6 sm:col-span-2 lg:col-span-1">
          <ComplianceScoreGauge score={summary.complianceScore} size={220} />
        </div>
        <div className="flex flex-col justify-center">
          <ViolationSummary
            total={summary.violations.total}
            critical={summary.violations.critical}
            major={summary.violations.major}
            minor={summary.violations.minor}
          />
        </div>
        <div className="flex flex-col justify-center">
          <RulesFoundStat count={summary.rulesFoundCount} />
        </div>
      </div>

      {/* Charts row 1 */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-lg border border-[var(--border)] bg-[var(--background)] p-4">
          <h2 className="mb-3 text-sm font-semibold text-[var(--foreground)]">
            Most violated rules
          </h2>
          <MostViolatedRulesChart data={summary.topViolatedRules} />
        </div>
        <div className="rounded-lg border border-[var(--border)] bg-[var(--background)] p-4">
          <h2 className="mb-3 text-sm font-semibold text-[var(--foreground)]">
            Sentence type breakdown
          </h2>
          <SentenceTypePieChart data={summary.sentenceTypeBreakdown} />
        </div>
      </div>

      {/* Charts row 2 */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-lg border border-[var(--border)] bg-[var(--background)] p-4">
          <h2 className="mb-3 text-sm font-semibold text-[var(--foreground)]">
            Violation distribution
          </h2>
          <ViolationDistributionDonut data={summary.violationDistribution} />
        </div>
        <RecentActivityFeed activities={summary.recentActivity} />
      </div>

    </div>
  );
}
