"use client";

import { FolderOpen } from "lucide-react";
import type { Project } from "@/app/lib/mock/mock-projects";
import { cn } from "@/app/lib/utils";

interface ProjectCardProps {
  project: Project;
  selected: boolean;
  onSelect: () => void;
}

function scoreColor(score: number): string {
  if (score >= 80) return "text-[var(--success)]";
  if (score >= 60) return "text-[var(--accent)]";
  return "text-[var(--danger)]";
}

export function ProjectCard({ project, selected, onSelect }: ProjectCardProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "w-full rounded-lg border px-4 py-3 text-left transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ring)]",
        selected
          ? "border-[var(--primary)] bg-[var(--primary)]/10"
          : "border-[var(--border)] bg-[var(--background)] hover:bg-[var(--muted)]/50"
      )}
      aria-pressed={selected}
    >
      <div className="flex items-start gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-[var(--muted)] text-[var(--muted-foreground)]">
          <FolderOpen className="size-5" aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <span className="font-medium text-[var(--foreground)]">{project.name}</span>
          {project.description && (
            <p className="mt-0.5 line-clamp-2 text-sm text-[var(--muted-foreground)]">
              {project.description}
            </p>
          )}
          <div className="mt-2 flex flex-wrap gap-3 text-xs text-[var(--muted-foreground)]">
            <span>{project.documentCount} documents</span>
            <span className={cn("font-medium", scoreColor(project.aggregateScore))}>
              Score: {project.aggregateScore}%
            </span>
            <span>Updated {project.lastUpdated}</span>
          </div>
        </div>
      </div>
    </button>
  );
}
