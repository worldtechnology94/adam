"use client";

import { useCallback, useState } from "react";
import {
  MOCK_INITIAL_MESSAGES,
  MOCK_CONVERSATIONS,
  type ChatMessage,
} from "@/app/lib/mock/mock-chat";
import { ChatMessageBubble } from "@/app/components/ask-adam/ChatMessageBubble";
import { ChatInput } from "@/app/components/ask-adam/ChatInput";
import { ModePrompts } from "@/app/components/ask-adam/ModePrompts";
import { ConversationHistory } from "@/app/components/ask-adam/ConversationHistory";

function generateId() {
  return `msg-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export default function AskAdamPage() {
  const [messages, setMessages] = useState<ChatMessage[]>(MOCK_INITIAL_MESSAGES);
  const [input, setInput] = useState("");
  const [isReplying, setIsReplying] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(
    MOCK_CONVERSATIONS[0]?.id ?? null
  );

  const handleSend = useCallback(async () => {
    const text = input.trim();
    if (!text) return;

    const userMessage: ChatMessage = {
      id: generateId(),
      role: "user",
      content: text,
    };
    const messagesToSend = [...messages, userMessage];
    setMessages(messagesToSend);
    setInput("");
    setIsReplying(true);
    setApiError(null);

    try {
      const res = await fetch("/api/ask-adam", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: messagesToSend.map((m) => ({ role: m.role, content: m.content })),
        }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        const msg = data.details ?? data.error ?? `Request failed (${res.status})`;
        setApiError(msg);
        setMessages((prev) => [...prev, { id: generateId(), role: "assistant", content: `**Error:** ${msg}` }]);
        return;
      }

      const content = typeof data.content === "string" ? data.content : "I couldn’t generate a response.";
      setMessages((prev) => [
        ...prev,
        { id: generateId(), role: "assistant", content },
      ]);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Network error";
      setApiError(msg);
      setMessages((prev) => [
        ...prev,
        { id: generateId(), role: "assistant", content: `**Error:** ${msg}` },
      ]);
    } finally {
      setIsReplying(false);
    }
  }, [input, messages]);

  const handleInsertPrompt = useCallback((text: string) => {
    setInput((prev) => prev + text);
  }, []);

  const handleSelectConversation = useCallback((id: string) => {
    setActiveConversationId(id);
    // Demo: all conversations show the same thread; in real app would load that thread
    setMessages(MOCK_INITIAL_MESSAGES);
  }, []);

  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col gap-4 md:h-[calc(100vh-6rem)]">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h1 className="text-xl font-semibold text-[var(--foreground)]">
            Ask ADAM
          </h1>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">
            AI writing assistant for STE-compliant rewrites and rule Q&amp;A.
          </p>
        </div>
        <span
          className="rounded-full border border-[var(--border)] bg-[var(--muted)] px-3 py-1 text-xs font-medium text-[var(--muted-foreground)]"
          title="Powered by Google Gemini. Set GOOGLE_GENERATIVE_AI_API_KEY or GEMINI_API_KEY in .env."
        >
          Gemini
        </span>
      </div>

      {apiError && (
        <p className="text-sm text-amber-600" role="alert">
          {apiError}
        </p>
      )}

      <div className="flex flex-1 gap-4 overflow-hidden">
        <aside className="hidden w-52 shrink-0 overflow-y-auto md:block">
          <ConversationHistory
            conversations={MOCK_CONVERSATIONS}
            activeId={activeConversationId}
            onSelect={handleSelectConversation}
          />
        </aside>

        <div className="flex min-w-0 flex-1 flex-col rounded-lg border border-[var(--border)] bg-[var(--background)]">
          <div className="flex-1 overflow-y-auto p-4">
            <div className="mx-auto max-w-3xl space-y-4">
              {messages.map((msg) => (
                <ChatMessageBubble key={msg.id} message={msg} />
              ))}
              {isReplying && (
                <div className="flex gap-3" aria-live="polite" aria-busy="true">
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[var(--muted)]">
                    <span className="text-[var(--muted-foreground)]">…</span>
                  </div>
                  <div className="rounded-lg border border-[var(--border)] bg-[var(--muted)]/30 px-4 py-3 text-sm text-[var(--muted-foreground)]">
                    ADAM is thinking…
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="border-t border-[var(--border)] p-4">
            <ModePrompts onInsert={handleInsertPrompt} className="mb-3" />
            <ChatInput
              value={input}
              onChange={setInput}
              onSubmit={handleSend}
              disabled={isReplying}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
