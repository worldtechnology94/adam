"use client";

import { MessageSquare } from "lucide-react";
import { MODE_PROMPTS } from "@/app/lib/mock/mock-chat";
import { cn } from "@/app/lib/utils";

interface ModePromptsProps {
  onInsert: (text: string) => void;
  className?: string;
}

export function ModePrompts({ onInsert, className }: ModePromptsProps) {
  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      <span className="flex items-center gap-1.5 text-xs font-medium text-[var(--muted-foreground)]">
        <MessageSquare className="size-3.5" aria-hidden />
        Quick prompts:
      </span>
      {MODE_PROMPTS.map(({ label, template }) => (
        <button
          key={label}
          type="button"
          onClick={() => onInsert(template)}
          className="rounded-md border border-[var(--border)] bg-[var(--muted)]/30 px-2.5 py-1 text-xs font-medium text-[var(--foreground)] hover:bg-[var(--muted)]/50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ring)]"
        >
          {label}
        </button>
      ))}
    </div>
  );
}
