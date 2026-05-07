"use client";

import ReactMarkdown from "react-markdown";
import { Copy, User, Bot } from "lucide-react";
import { useCallback, useState } from "react";
import type { ChatMessage } from "@/app/lib/mock/mock-chat";
import { cn } from "@/app/lib/utils";

interface ChatMessageBubbleProps {
  message: ChatMessage;
}

export function ChatMessageBubble({ message }: ChatMessageBubbleProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    const text = message.suggestedSentence ?? message.content;
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [message]);

  const showCopyButton =
    message.role === "assistant" &&
    (message.suggestedSentence ?? message.content.trim().length > 0);

  return (
    <div
      className={cn(
        "flex gap-3",
        message.role === "user" && "flex-row-reverse"
      )}
      role="article"
      aria-label={message.role === "user" ? "Your message" : "ADAM reply"}
    >
      <div
        className={cn(
          "flex size-8 shrink-0 items-center justify-center rounded-full",
          message.role === "user"
            ? "bg-[var(--primary)] text-[var(--primary-foreground)]"
            : "bg-[var(--muted)] text-[var(--muted-foreground)]"
        )}
        aria-hidden
      >
        {message.role === "user" ? (
          <User className="size-4" />
        ) : (
          <Bot className="size-4" />
        )}
      </div>
      <div
        className={cn(
          "flex min-w-0 flex-1 flex-col gap-1 rounded-lg px-4 py-3",
          message.role === "user"
            ? "bg-[var(--primary)] text-[var(--primary-foreground)]"
            : "border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)]"
        )}
      >
        <div
          className={cn(
            "text-sm",
            message.role === "user"
              ? "text-[var(--primary-foreground)]"
              : "text-[var(--foreground)]"
          )}
        >
          {message.role === "assistant" ? (
            <ReactMarkdown
              components={{
                p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                ul: ({ children }) => (
                  <ul className="mb-2 list-inside list-disc space-y-0.5 last:mb-0">
                    {children}
                  </ul>
                ),
                ol: ({ children }) => (
                  <ol className="mb-2 list-inside list-decimal space-y-0.5 last:mb-0">
                    {children}
                  </ol>
                ),
                strong: ({ children }) => (
                  <strong className="font-semibold">{children}</strong>
                ),
                code: ({ children }) => (
                  <code className="rounded bg-[var(--muted)] px-1 py-0.5 font-mono text-xs">
                    {children}
                  </code>
                ),
              }}
            >
              {message.content}
            </ReactMarkdown>
          ) : (
            <p className="whitespace-pre-wrap text-sm">{message.content}</p>
          )}
        </div>
        {showCopyButton && (
          <button
            type="button"
            onClick={handleCopy}
            className="mt-1 flex w-fit items-center gap-1.5 rounded border border-[var(--border)] bg-[var(--muted)]/50 px-2 py-1 text-xs font-medium text-[var(--foreground)] hover:bg-[var(--muted)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ring)]"
            aria-label="Copy to document"
          >
            <Copy className="size-3" aria-hidden />
            {copied ? "Copied!" : "Copy to document"}
          </button>
        )}
      </div>
    </div>
  );
}
