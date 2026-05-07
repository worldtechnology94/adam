"use client";

import { Check, X, Pencil } from "lucide-react";
import type { Violation } from "@/app/lib/mock/mock-violations";
import { cn } from "@/app/lib/utils";

interface ViolationRowActionsProps {
  violation: Violation;
  onAccept: (id: string) => void;
  onReject: (id: string) => void;
  onEdit: (id: string) => void;
  /** When true, buttons are disabled (e.g. while PATCH is in flight). */
  isUpdating?: boolean;
}

export function ViolationRowActions({
  violation,
  onAccept,
  onReject,
  onEdit,
  isUpdating = false,
}: ViolationRowActionsProps) {
  const isPending = violation.status === "pending";

  return (
    <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
      <button
        type="button"
        onClick={() => onAccept(violation.id)}
        disabled={!isPending || isUpdating}
        className="rounded p-1.5 text-[var(--success)] hover:bg-[var(--muted)] disabled:opacity-40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ring)]"
        aria-label={`Accept suggestion for ${violation.ruleId}`}
        title="Accept"
      >
        <Check className="size-4" aria-hidden />
      </button>
      <button
        type="button"
        onClick={() => onReject(violation.id)}
        disabled={!isPending || isUpdating}
        className="rounded p-1.5 text-[var(--danger)] hover:bg-[var(--muted)] disabled:opacity-40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ring)]"
        aria-label={`Reject suggestion for ${violation.ruleId}`}
        title="Reject"
      >
        <X className="size-4" aria-hidden />
      </button>
      <button
        type="button"
        onClick={() => onEdit(violation.id)}
        className="rounded p-1.5 text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ring)]"
        aria-label={`Edit violation ${violation.ruleId}`}
        title="Edit"
      >
        <Pencil className="size-4" aria-hidden />
      </button>
    </div>
  );
}
