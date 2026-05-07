"use client";

import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
} from "@tanstack/react-table";
import { useMemo, useState, Fragment } from "react";
import Link from "next/link";
import { ChevronDown, ChevronUp, ChevronsUpDown, AlertCircle, AlertTriangle, Info } from "lucide-react";
import type { Violation } from "@/app/lib/mock/mock-violations";
import { SEVERITY_LABELS, SENTENCE_TYPE_LABELS } from "@/app/lib/mock/mock-violations";
import { cn } from "@/app/lib/utils";

const PAGE_SIZE = 10;

interface ViolationsTableProps {
  data: Violation[];
  onRowClick?: (violation: Violation) => void;
  expandedId?: string | null;
  selection?: Set<string>;
  onSelectionChange?: (ids: Set<string>) => void;
  renderRowActions?: (violation: Violation) => React.ReactNode;
  renderExpanded?: (violation: Violation) => React.ReactNode;
}

export function ViolationsTable({
  data,
  onRowClick,
  expandedId,
  selection = new Set(),
  onSelectionChange,
  renderRowActions,
  renderExpanded,
}: ViolationsTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);

  const toggleSelection = (id: string) => {
    const next = new Set(selection);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    onSelectionChange?.(next);
  };

  const toggleSelectAll = () => {
    if (selection.size === data.length) onSelectionChange?.(new Set());
    else onSelectionChange?.(new Set(data.map((v) => v.id)));
  };

  const columns = useMemo<ColumnDef<Violation>[]>(
    () => [
      {
        id: "select",
        header: () => (
          <input
            type="checkbox"
            checked={data.length > 0 && selection.size === data.length}
            onChange={toggleSelectAll}
            aria-label="Select all"
            className="rounded border-[var(--border)]"
          />
        ),
        cell: ({ row }) => (
          <input
            type="checkbox"
            checked={selection.has(row.original.id)}
            onChange={() => toggleSelection(row.original.id)}
            onClick={(e) => e.stopPropagation()}
            aria-label={`Select ${row.original.id}`}
            className="rounded border-[var(--border)]"
          />
        ),
        size: 40,
      },
      {
        accessorKey: "sentenceExcerpt",
        header: "Sentence",
        cell: ({ getValue }) => (
          <span className="line-clamp-2 text-sm" title={String(getValue())}>
            {String(getValue())}
          </span>
        ),
      },
      {
        accessorKey: "ruleId",
        header: "Rule ID",
        cell: ({ getValue }) => {
          const ruleId = String(getValue());
          return (
            <Link
              href={`/rules?highlight=${encodeURIComponent(ruleId)}`}
              className="font-mono text-xs text-[var(--primary)] underline hover:no-underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ring)] rounded"
              aria-label={`View rule ${ruleId} in Rule Library`}
            >
              {ruleId}
            </Link>
          );
        },
        size: 90,
      },
      {
        accessorKey: "ruleName",
        header: "Rule",
        cell: ({ getValue }) => (
          <span className="text-sm">{String(getValue())}</span>
        ),
        size: 180,
      },
      {
        accessorKey: "sentenceType",
        header: "Type",
        cell: ({ getValue }) => (
          <span className="text-xs">
            {SENTENCE_TYPE_LABELS[getValue() as keyof typeof SENTENCE_TYPE_LABELS]}
          </span>
        ),
        size: 120,
      },
      {
        accessorKey: "wordCount",
        header: "Words",
        cell: ({ getValue }) => (
          <span className="tabular-nums text-sm">{Number(getValue())}</span>
        ),
        size: 70,
      },
      {
        accessorKey: "severity",
        header: "Severity",
        cell: ({ getValue }) => {
          const s = getValue() as keyof typeof SEVERITY_LABELS;
          const Icon = s === "critical" ? AlertCircle : s === "major" ? AlertTriangle : Info;
          return (
            <span
              className={cn(
                "inline-flex items-center gap-1.5 text-xs font-medium",
                s === "critical" && "severity-critical",
                s === "major" && "severity-major",
                s === "minor" && "severity-minor"
              )}
              role="img"
              aria-label={`Severity: ${SEVERITY_LABELS[s]}`}
            >
              <Icon className="size-3.5 shrink-0" aria-hidden strokeWidth={2} />
              {SEVERITY_LABELS[s]}
            </span>
          );
        },
        size: 90,
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ getValue }) => {
          const status = getValue() as "pending" | "accepted" | "rejected";
          if (status === "pending")
            return <span className="text-xs text-[var(--muted-foreground)]">Pending</span>;
          return (
            <span
              className={cn(
                "rounded px-1.5 py-0.5 text-xs font-medium",
                status === "accepted" && "bg-[var(--success)]/15 text-[var(--success)]",
                status === "rejected" && "bg-[var(--danger)]/15 text-[var(--danger)]"
              )}
            >
              {status === "accepted" ? "Accepted" : "Rejected"}
            </span>
          );
        },
        size: 95,
      },
      {
        accessorKey: "aiSuggestion",
        header: "AI Suggestion",
        cell: ({ getValue }) => (
          <span className="line-clamp-2 text-sm" title={String(getValue())}>
            {String(getValue())}
          </span>
        ),
      },
      ...(renderRowActions
        ? [
            {
              id: "actions",
              header: "",
              cell: ({ row }: { row: { original: Violation } }) =>
                renderRowActions(row.original),
              size: 140,
            } as ColumnDef<Violation>,
          ]
        : []),
    ],
    [data.length, selection, renderRowActions]
  );

  const table = useReactTable({
    data,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: PAGE_SIZE } },
  });

  return (
    <div className="space-y-3">
      <div className="overflow-x-auto rounded-lg border border-[var(--border)]">
        <table className="w-full text-left text-sm" role="table" aria-label="Violation log">
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id} className="border-b border-[var(--border)] bg-[var(--muted)]/50">
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="px-4 py-3 font-semibold text-[var(--foreground)]"
                    style={{ width: header.getSize() }}
                  >
                    <div className="flex items-center gap-1">
                      {header.column.getCanSort() ? (
                        <button
                          type="button"
                          onClick={() => header.column.toggleSorting()}
                          className="flex items-center gap-1 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ring)]"
                          aria-label={`Sort by ${header.column.id}. ${header.column.getIsSorted() === "asc" ? "Ascending" : header.column.getIsSorted() === "desc" ? "Descending" : "Click to sort"}`}
                        >
                          {flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                          {{
                            asc: <ChevronUp className="size-4" aria-hidden />,
                            desc: <ChevronDown className="size-4" aria-hidden />,
                          }[header.column.getIsSorted() as string] ?? (
                            <ChevronsUpDown className="size-4 opacity-50" aria-hidden />
                          )}
                        </button>
                      ) : (
                        flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row) => (
              <Fragment key={row.id}>
                <tr
                  key={row.id}
                  onClick={() => onRowClick?.(row.original)}
                  className={cn(
                    "border-b border-[var(--border)] transition-colors",
                    expandedId === row.original.id && "bg-[var(--muted)]/30",
                    "hover:bg-[var(--muted)]/20 cursor-pointer"
                  )}
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-4 py-2">
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </td>
                  ))}
                </tr>
                {renderExpanded &&
                  expandedId === row.original.id && (
                    <tr key={`${row.id}-expanded`}>
                      <td
                        colSpan={columns.length}
                        className="bg-[var(--muted)]/20 px-4 py-3"
                      >
                        {renderExpanded(row.original)}
                      </td>
                    </tr>
                  )}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-[var(--muted-foreground)]">
          Showing {table.getState().pagination.pageIndex * PAGE_SIZE + 1}–
          {Math.min(
            (table.getState().pagination.pageIndex + 1) * PAGE_SIZE,
            data.length
          )}{" "}
          of {data.length}
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            className="rounded-md border border-[var(--border)] px-3 py-1.5 text-sm disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ring)]"
            aria-label="Previous page"
          >
            Previous
          </button>
          <button
            type="button"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            className="rounded-md border border-[var(--border)] px-3 py-1.5 text-sm disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ring)]"
            aria-label="Next page"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
