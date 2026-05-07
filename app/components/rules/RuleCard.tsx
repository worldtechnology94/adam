"use client";

import { BookOpen, Star } from "lucide-react";
import type { SteRule } from "@/app/lib/mock/mock-rules";
import { cn } from "@/app/lib/utils";

interface RuleCardProps {
  rule: SteRule;
  isSelected?: boolean;
  isFavorite?: boolean;
  onSelect: (id: string) => void;
  onToggleFavorite?: (id: string) => void;
}

export function RuleCard({
  rule,
  isSelected,
  isFavorite,
  onSelect,
  onToggleFavorite,
}: RuleCardProps) {
  return (
    <article
      onClick={() => onSelect(rule.id)}
      className={cn(
        "cursor-pointer rounded-lg border p-4 transition-colors",
        "border-[var(--border)] bg-[var(--background)] hover:border-[var(--primary)] hover:bg-[var(--muted)]/30",
        isSelected && "border-[var(--primary)] bg-[var(--muted)]/40 ring-2 ring-[var(--primary)]/20"
      )}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect(rule.id);
        }
      }}
      aria-pressed={isSelected}
      aria-label={`Open ${rule.id} ${rule.name}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 flex-1 items-start gap-2">
          <BookOpen className="mt-0.5 size-4 shrink-0 text-[var(--muted-foreground)]" aria-hidden />
          <div className="min-w-0">
            <p className="font-mono text-sm font-semibold text-[var(--foreground)]">
              {rule.id}
            </p>
            <p className="mt-0.5 line-clamp-2 text-sm text-[var(--muted-foreground)]">
              {rule.name}
            </p>
            <p className="mt-1 text-xs text-[var(--muted-foreground)]">
              STE-{rule.topic} — {rule.topicName}
            </p>
          </div>
        </div>
        {onToggleFavorite && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite(rule.id);
            }}
            className="shrink-0 rounded p-1 text-[var(--muted-foreground)] hover:text-[var(--accent)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ring)]"
            aria-label={isFavorite ? `Remove ${rule.id} from favorites` : `Add ${rule.id} to favorites`}
            title={isFavorite ? "Remove from favorites" : "Add to favorites"}
          >
            <Star
              className={cn("size-4", isFavorite && "fill-[var(--accent)] text-[var(--accent)]")}
              aria-hidden
            />
          </button>
        )}
      </div>
    </article>
  );
}
