"use client";

import { useState } from "react";
import type { Violation } from "@/app/lib/mock/mock-violations";
import { DiffView } from "./DiffView";
import { cn } from "@/app/lib/utils";

interface ViolationExpandedRowProps {
  violation: Violation;
  note: string;
  onNoteChange: (id: string, note: string) => void;
}

export function ViolationExpandedRow({
  violation,
  note,
  onNoteChange,
}: ViolationExpandedRowProps) {
  const [localNote, setLocalNote] = useState(note);

  const handleBlur = () => {
    if (localNote !== note) onNoteChange(violation.id, localNote);
  };

  return (
    <div className="space-y-3">
      <DiffView
        original={violation.sentenceExcerpt}
        suggested={violation.aiSuggestion}
      />
      {violation.paragraphContext && (
        <div>
          <p className="mb-1 text-xs font-medium text-[var(--muted-foreground)]">
            Surrounding paragraph
          </p>
          <p className="rounded-md border border-[var(--border)] bg-[var(--muted)]/30 px-3 py-2 text-sm italic text-[var(--foreground)]">
            {violation.paragraphContext}
          </p>
        </div>
      )}
      <div>
        <label
          htmlFor={`note-${violation.id}`}
          className="mb-1 block text-xs font-medium text-[var(--muted-foreground)]"
        >
          Private note
        </label>
        <textarea
          id={`note-${violation.id}`}
          value={localNote}
          onChange={(e) => setLocalNote(e.target.value)}
          onBlur={handleBlur}
          placeholder="Add a note..."
          rows={2}
          className={cn(
            "w-full rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm",
            "focus:border-[var(--ring)] focus:outline-none focus:ring-1 focus:ring-[var(--ring)]"
          )}
        />
      </div>
    </div>
  );
}
