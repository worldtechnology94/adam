"use client";

import { MessageCircle } from "lucide-react";
import type { MockConversation } from "@/app/lib/mock/mock-chat";
import { cn } from "@/app/lib/utils";

const PLACEHOLDER_REPLY =
  "This is a demo reply. When the backend is connected, ADAM will use the STE dictionary and rules to give accurate, citation-backed answers.";

interface ConversationHistoryProps {
  conversations: MockConversation[];
  activeId: string | null;
  onSelect: (id: string) => void;
  className?: string;
}

export function ConversationHistory({
  conversations,
  activeId,
  onSelect,
  className,
}: ConversationHistoryProps) {
  return (
    <div
      className={cn(
        "rounded-lg border border-[var(--border)] bg-[var(--background)] p-3",
        className
      )}
      role="navigation"
      aria-label="Conversation history"
    >
      <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-[var(--foreground)]">
        <MessageCircle className="size-4" aria-hidden />
        Conversations
      </h3>
      <ul className="space-y-0.5" role="list">
        {conversations.map((c) => (
          <li key={c.id}>
            <button
              type="button"
              onClick={() => onSelect(c.id)}
              className={cn(
                "w-full rounded-md px-2 py-1.5 text-left text-sm transition-colors",
                "hover:bg-[var(--muted)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ring)]",
                activeId === c.id && "bg-[var(--muted)] font-medium"
              )}
              aria-current={activeId === c.id ? "true" : undefined}
            >
              <span className="block truncate">{c.title}</span>
              <span className="block truncate text-xs text-[var(--muted-foreground)]">
                {c.messageCount} messages · {c.updatedAt}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export { PLACEHOLDER_REPLY };
