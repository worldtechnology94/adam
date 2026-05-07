"use client";

import { Activity } from "lucide-react";
import type { ProjectActivityEntry } from "@/app/lib/mock/mock-projects";
import { cn } from "@/app/lib/utils";

interface ProjectActivityLogProps {
  entries: ProjectActivityEntry[];
  className?: string;
}

export function ProjectActivityLog({ entries, className }: ProjectActivityLogProps) {
  return (
    <div className={cn("rounded-lg border border-[var(--border)] bg-[var(--background)] p-4", className)}>
      <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-[var(--foreground)]">
        <Activity className="size-4" aria-hidden />
        Activity
      </h3>
      {entries.length === 0 ? (
        <p className="text-sm text-[var(--muted-foreground)]">No recent activity.</p>
      ) : (
        <ul className="space-y-2" role="list">
          {entries.map((e) => (
            <li key={e.id} className="flex flex-wrap gap-x-2 text-sm">
              <span className="text-[var(--muted-foreground)]">{e.timestamp}</span>
              <span className="text-[var(--foreground)]">{e.user}</span>
              <span className="text-[var(--muted-foreground)]">{e.action}</span>
              {e.documentName && (
                <span className="text-[var(--foreground)]">— {e.documentName}</span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
