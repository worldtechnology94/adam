"use client";

import { useState, useCallback } from "react";
import { FileDown, Loader2 } from "lucide-react";
import { REPORT_TYPES } from "@/app/lib/mock/mock-reports";
import type { ReportType, ExportFormat } from "@/app/lib/mock/mock-reports";
import { ReportTypeCard } from "@/app/components/reports/ReportTypeCard";
import { ExportFormatSelect } from "@/app/components/reports/ExportFormatSelect";

export default function ReportsPage() {
  const [selectedReport, setSelectedReport] = useState<ReportType | null>(REPORT_TYPES[0] ?? null);
  const [format, setFormat] = useState<ExportFormat>("pdf");
  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated] = useState(false);

  const handleGenerate = useCallback(() => {
    if (!selectedReport) return;
    setGenerating(true);
    setTimeout(() => {
      setGenerating(false);
      setGenerated(true);
    }, 1500);
  }, [selectedReport]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h1 className="text-xl font-semibold text-[var(--foreground)]">
            Reports &amp; Export
          </h1>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">
            Generate compliance reports and export in PDF, DOCX, XLSX, and more.
          </p>
        </div>
        <span
          className="rounded-full border border-[var(--border)] bg-[var(--muted)] px-3 py-1 text-xs font-medium text-[var(--muted-foreground)]"
          title="Demo mode. No file is generated."
        >
          Demo mode
        </span>
      </div>

      <section aria-labelledby="report-type-heading">
        <h2 id="report-type-heading" className="mb-3 text-sm font-semibold text-[var(--foreground)]">
          Report type
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {REPORT_TYPES.map((report) => (
            <ReportTypeCard
              key={report.id}
              report={report}
              selected={selectedReport?.id === report.id}
              onSelect={() => setSelectedReport(report)}
            />
          ))}
        </div>
      </section>

      <section aria-labelledby="format-heading">
        <h2 id="format-heading" className="mb-3 text-sm font-semibold text-[var(--foreground)]">
          Export format
        </h2>
        <ExportFormatSelect value={format} onChange={setFormat} disabled={generating} />
      </section>

      <div className="flex flex-wrap items-center gap-3 border-t border-[var(--border)] pt-4">
        <button
          type="button"
          onClick={handleGenerate}
          disabled={!selectedReport || generating}
          className="inline-flex items-center gap-2 rounded-md bg-[var(--primary)] px-4 py-2 text-sm font-medium text-[var(--primary-foreground)] hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ring)] disabled:opacity-50"
        >
          {generating ? (
            <>
              <Loader2 className="size-4 animate-spin" aria-hidden />
              Generating…
            </>
          ) : (
            "Generate report"
          )}
        </button>
        {generated && (
          <span className="text-sm text-[var(--success)]" role="status">
            Report generated successfully.
          </span>
        )}
        <button
          type="button"
          disabled={!generated}
          className="inline-flex items-center gap-2 rounded-md border border-[var(--border)] bg-[var(--background)] px-4 py-2 text-sm font-medium text-[var(--foreground)] hover:bg-[var(--muted)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ring)] disabled:opacity-50 disabled:cursor-not-allowed"
          title="Demo: download is not implemented"
        >
          <FileDown className="size-4" aria-hidden />
          Download
        </button>
      </div>
    </div>
  );
}
