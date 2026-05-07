"use client";

import { Activity, FileText, Upload, FileCheck } from "lucide-react";
import type { ActivityEntry } from "@/app/lib/mock/mock-dashboard";

function formatRelativeTime(iso: string): string {
  try {
    const d = new Date(iso);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return new Intl.DateTimeFormat("en-GB", { dateStyle: "short" }).format(d);
  } catch {
    return iso;
  }
}

function getActivityIcon(action: string) {
  if (action === "analysis_completed") return FileCheck;
  if (action === "document_uploaded") return Upload;
  if (action === "report_generated") return FileText;
  return Activity;
}

interface RecentActivityFeedProps {
  activities: ActivityEntry[];
}

export function RecentActivityFeed({ activities }: RecentActivityFeedProps) {
  return (
    <div
      className="rounded-lg border border-[var(--border)] bg-[var(--background)] p-4"
      role="region"
      aria-label="Recent activity"
    >
      <h3 className="flex items-center gap-2 text-sm font-semibold text-[var(--foreground)]">
        <Activity className="size-4" aria-hidden />
        Recent activity
      </h3>
      {activities.length === 0 && (
        <p className="mt-4 text-sm text-[var(--muted-foreground)]">
          No activity yet — analyse a document to get started.
        </p>
      )}
      <ul className="mt-3 space-y-3" role="list">
        {activities.map((entry) => {
          const Icon = getActivityIcon(entry.action);
          return (
            <li
              key={entry.id}
              className="flex gap-3 border-b border-[var(--border)] pb-3 last:border-0 last:pb-0"
            >
              <div
                className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[var(--muted)] text-[var(--muted-foreground)]"
                aria-hidden
              >
                <Icon className="size-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm text-[var(--foreground)]">
                  {entry.description}
                </p>
                <p
                  className="mt-0.5 text-xs text-[var(--muted-foreground)]"
                  title={entry.timestamp}
                >
                  {formatRelativeTime(entry.timestamp)}
                </p>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
