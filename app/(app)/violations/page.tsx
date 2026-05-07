"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { Violation, ViolationStatus } from "@/app/lib/mock/mock-violations";
import { ViolationsFilterBar, DEFAULT_FILTERS, type ViolationsFilters } from "@/app/components/violations/ViolationsFilterBar";
import { ViolationsTable } from "@/app/components/violations/ViolationsTable";
import { ViolationRowActions } from "@/app/components/violations/ViolationRowActions";
import { ViolationExpandedRow } from "@/app/components/violations/ViolationExpandedRow";
import { ViolationHeatmapPlaceholder } from "@/app/components/violations/ViolationHeatmapPlaceholder";

const PAGE_SIZE = 20;

function mapApiViolation(raw: {
  id: string;
  sentenceExcerpt: string;
  ruleId: string;
  ruleName: string;
  sentenceType?: string | null;
  wordCount?: number;
  severity: string;
  aiSuggestion?: string | null;
  paragraphContext?: string | null;
  position?: { start: number; end: number };
  status: string;
}): Violation {
  return {
    id: raw.id,
    sentenceExcerpt: raw.sentenceExcerpt,
    ruleId: raw.ruleId,
    ruleName: raw.ruleName,
    sentenceType: (raw.sentenceType as Violation["sentenceType"]) ?? "instructional",
    wordCount: raw.wordCount ?? 0,
    severity: raw.severity as Violation["severity"],
    aiSuggestion: raw.aiSuggestion ?? "",
    paragraphContext: raw.paragraphContext ?? undefined,
    position: raw.position,
    status: raw.status as Violation["status"],
  };
}

function exportToCSV(violations: Violation[]) {
  const headers = [
    "Rule ID",
    "Rule Name",
    "Sentence",
    "Type",
    "Severity",
    "Word Count",
    "AI Suggestion",
  ];
  const rows = violations.map((v) =>
    [
      v.ruleId,
      v.ruleName,
      `"${v.sentenceExcerpt.replace(/"/g, '""')}"`,
      v.sentenceType,
      v.severity,
      v.wordCount,
      `"${(v.aiSuggestion ?? "").replace(/"/g, '""')}"`,
    ].join(",")
  );
  return [headers.join(","), ...rows].join("\n");
}

function exportToJSON(violations: Violation[]) {
  return JSON.stringify(
    violations.map((v) => ({
      id: v.id,
      ruleId: v.ruleId,
      ruleName: v.ruleName,
      sentenceExcerpt: v.sentenceExcerpt,
      sentenceType: v.sentenceType,
      severity: v.severity,
      wordCount: v.wordCount,
      aiSuggestion: v.aiSuggestion,
    })),
    null,
    2
  );
}

export default function ViolationsPage() {
  const [violations, setViolations] = useState<Violation[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [filters, setFilters] = useState<ViolationsFilters>(DEFAULT_FILTERS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selection, setSelection] = useState<Set<string>>(new Set());
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [localStatus, setLocalStatus] = useState<Record<string, ViolationStatus>>({});
  const [updatingIds, setUpdatingIds] = useState<Set<string>>(new Set());
  const [ruleLibraryIds, setRuleLibraryIds] = useState<string[]>([]);
  const [documentName, setDocumentName] = useState<string | null>(null);

  const fetchViolations = useCallback(async () => {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams();
    if (filters.ruleId) params.set("ruleId", filters.ruleId);
    if (filters.severity) params.set("severity", filters.severity);
    if (filters.sentenceType) params.set("sentenceType", filters.sentenceType);
    if (filters.keyword.trim()) params.set("keyword", filters.keyword.trim());
    params.set("page", String(page));
    params.set("limit", String(PAGE_SIZE));
    try {
      const res = await fetch(`/api/violations?${params.toString()}`);
      if (!res.ok) throw new Error(res.status === 400 ? "Bad request" : "Failed to load");
      const data = await res.json();
      setViolations((data.violations ?? []).map(mapApiViolation));
      setTotal(Number(data.total) ?? 0);
      setDocumentName(data.documentName ?? null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load violations");
      setViolations([]);
      setTotal(0);
      setDocumentName(null);
    } finally {
      setLoading(false);
    }
  }, [filters.ruleId, filters.severity, filters.sentenceType, filters.keyword, page]);

  useEffect(() => {
    fetchViolations();
  }, [fetchViolations]);

  const onFiltersChange = useCallback((next: ViolationsFilters) => {
    setFilters(next);
    setPage(0);
  }, []);

  const displayViolations = useMemo(() => {
    return violations.map((v) => ({
      ...v,
      status: localStatus[v.id] ?? v.status,
    }));
  }, [violations, localStatus]);

  const ruleOptions = useMemo(() => {
    if (ruleLibraryIds.length > 0) return ruleLibraryIds;
    const ids = new Set<string>(["STE-1.1", ...violations.map((v) => v.ruleId)]);
    return Array.from(ids).sort();
  }, [ruleLibraryIds, violations]);

  useEffect(() => {
    fetch("/api/rules")
      .then((res) => (res.ok ? res.json() : []))
      .then((data: { id: string }[]) => {
        if (Array.isArray(data)) setRuleLibraryIds(data.map((r) => r.id).sort());
      })
      .catch(() => {});
  }, []);

  const updateViolationStatus = useCallback(async (id: string, status: ViolationStatus) => {
    setUpdatingIds((prev) => new Set(prev).add(id));
    setError(null);
    try {
      const res = await fetch(`/api/violations/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? `Update failed (${res.status})`);
      }
      setViolations((prev) =>
        prev.map((v) => (v.id === id ? { ...v, status } : v))
      );
      setLocalStatus((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
      setSelection((s) => {
        const next = new Set(s);
        next.delete(id);
        return next;
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to update violation");
      setLocalStatus((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    } finally {
      setUpdatingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  }, []);

  const handleAccept = useCallback(
    (id: string) => {
      setLocalStatus((prev) => ({ ...prev, [id]: "accepted" }));
      setSelection((s) => {
        const next = new Set(s);
        next.delete(id);
        return next;
      });
      void updateViolationStatus(id, "accepted");
    },
    [updateViolationStatus]
  );

  const handleReject = useCallback(
    (id: string) => {
      setLocalStatus((prev) => ({ ...prev, [id]: "rejected" }));
      setSelection((s) => {
        const next = new Set(s);
        next.delete(id);
        return next;
      });
      void updateViolationStatus(id, "rejected");
    },
    [updateViolationStatus]
  );

  const handleEdit = useCallback((_id: string) => {
    // Optional: open modal or inline editor (T4.2 PATCH)
  }, []);

  const handleNoteChange = useCallback((id: string, note: string) => {
    setNotes((prev) => ({ ...prev, [id]: note }));
  }, []);

  const handleAcceptAllForRule = useCallback(
    (ruleId: string) => {
      const pending = violations.filter(
        (v) => v.ruleId === ruleId && (localStatus[v.id] ?? v.status) === "pending"
      );
      pending.forEach((v) => {
        void updateViolationStatus(v.id, "accepted");
      });
      setSelection(new Set());
    },
    [violations, localStatus, updateViolationStatus]
  );

  const handleExportSelected = useCallback((format: "csv" | "json") => {
    const selected = displayViolations.filter((v) => selection.has(v.id));
    if (selected.length === 0) return;
    const content =
      format === "csv" ? exportToCSV(selected) : exportToJSON(selected);
    const blob = new Blob([content], {
      type: format === "csv" ? "text/csv" : "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `violations-export.${format === "csv" ? "csv" : "json"}`;
    a.click();
    URL.revokeObjectURL(url);
  }, [displayViolations, selection]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const hasDocument = total > 0 || !loading;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h1 className="text-xl font-semibold text-[var(--foreground)]">
            Violation Log
          </h1>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">
            Review and act on every rule violation in context.
          </p>
          {documentName && (
            <p className="mt-0.5 text-xs text-[var(--muted-foreground)]" title="Data from this document's latest analysis.">
              Showing: {documentName}
            </p>
          )}
        </div>
        <span
          className="rounded-full border border-[var(--border)] bg-[var(--muted)] px-3 py-1 text-xs font-medium text-[var(--muted-foreground)]"
          title={hasDocument ? "Data from latest analysis run." : "Upload a document and run analysis to see violations."}
        >
          {loading ? "Loading…" : total === 0 ? "No violations" : "Live data"}
        </span>
      </div>

      <ViolationsFilterBar filters={filters} onFiltersChange={onFiltersChange} />

      <div className="flex flex-wrap items-center gap-2">
        <select
          aria-label="Accept all for rule"
          className="rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm focus:border-[var(--ring)] focus:outline-none focus:ring-1 focus:ring-[var(--ring)]"
          defaultValue=""
          onChange={(e) => {
            const v = e.target.value;
            if (v) {
              handleAcceptAllForRule(v);
              e.target.value = "";
            }
          }}
        >
          <option value="">Accept all for rule...</option>
          {ruleOptions.map((id) => (
            <option key={id} value={id}>
              {id}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={() => handleExportSelected("csv")}
          disabled={selection.size === 0}
          className="rounded-md border border-[var(--border)] px-3 py-2 text-sm disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ring)]"
        >
          Export selected (CSV)
        </button>
        <button
          type="button"
          onClick={() => handleExportSelected("json")}
          disabled={selection.size === 0}
          className="rounded-md border border-[var(--border)] px-3 py-2 text-sm disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ring)]"
        >
          Export selected (JSON)
        </button>
        <span className="text-xs text-[var(--muted-foreground)]">|</span>
        <button
          type="button"
          onClick={() => {
            const content = exportToCSV(displayViolations);
            const blob = new Blob([content], { type: "text/csv" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = "violations-export-all.csv";
            a.click();
            URL.revokeObjectURL(url);
          }}
          disabled={displayViolations.length === 0}
          className="rounded-md border border-[var(--border)] px-3 py-2 text-sm disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ring)]"
        >
          Export all filtered (CSV)
        </button>
      </div>

      {error && (
        <div className="rounded-lg border border-[var(--border)] bg-[var(--background)] p-4">
          <p className="text-sm text-red-600">Error: {error}</p>
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center py-12">
          <p className="text-sm text-[var(--muted-foreground)]">Loading violations…</p>
        </div>
      )}

      {!loading && !error && (
        <>
          <ViolationsTable
            key={`${filters.ruleId}-${filters.severity}-${filters.sentenceType}-${filters.keyword}-${page}`}
            data={displayViolations}
            expandedId={expandedId}
            onRowClick={(v) => setExpandedId(expandedId === v.id ? null : v.id)}
            selection={selection}
            onSelectionChange={setSelection}
            renderRowActions={(v) => (
              <ViolationRowActions
                violation={v}
                onAccept={handleAccept}
                onReject={handleReject}
                onEdit={handleEdit}
                isUpdating={updatingIds.has(v.id)}
              />
            )}
            renderExpanded={(v) => (
              <ViolationExpandedRow
                violation={v}
                note={notes[v.id] ?? ""}
                onNoteChange={handleNoteChange}
              />
            )}
          />

          {totalPages > 1 && (
            <div className="flex items-center gap-2 text-sm text-[var(--muted-foreground)]">
              <span>
                Page {page + 1} of {totalPages} ({total} total)
              </span>
              <button
                type="button"
                disabled={page === 0}
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                className="rounded border border-[var(--border)] px-2 py-1 disabled:opacity-50"
              >
                Previous
              </button>
              <button
                type="button"
                disabled={page >= totalPages - 1}
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                className="rounded border border-[var(--border)] px-2 py-1 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          )}

          {!loading && !error && violations.length === 0 && total === 0 && (
            <p className="py-8 text-center text-sm text-[var(--muted-foreground)]">
              No violations. Upload a document and run analysis to see results.
            </p>
          )}
        </>
      )}

      <ViolationHeatmapPlaceholder />
    </div>
  );
}
