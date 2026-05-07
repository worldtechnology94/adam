/**
 * Mock Ask ADAM chat data — Phase F (UI only).
 */

export type ChatRole = "user" | "assistant";

export interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
  /** For assistant: optional suggested sentence to show "Copy" button */
  suggestedSentence?: string;
}

export const MOCK_INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: "m1",
    role: "user",
    content: "How do I rewrite 'The technician should utilize the correct tool' in STE?",
  },
  {
    id: "m2",
    role: "assistant",
    content: `In STE, **"utilize"** is not on the approved word list (see **STE-1.1**). Use **"use"** instead.

**Suggested rewrite:**
The technician must use the correct tool.

If this is a procedure, prefer the imperative: **"Use the correct tool."** so the reader knows exactly what to do.`,
    suggestedSentence: "Use the correct tool.",
  },
  {
    id: "m3",
    role: "user",
    content: "Why can't I use semicolons?",
  },
  {
    id: "m4",
    role: "assistant",
    content: `**STE-8.1** says: *Do not use semicolons.*

Semicolons can make sentences harder to parse, especially for non-native readers and in translation. In STE you should:

1. Use a full stop and start a new sentence.
2. Or use **and** / **or** to join ideas in one sentence.

Example: instead of *"Check the level; then start the engine."* write *"Check the level. Then start the engine."*`,
  },
  {
    id: "m5",
    role: "user",
    content: "Rewrite this: Prior to commencing the procedure, gather the required tools.",
  },
  {
    id: "m6",
    role: "assistant",
    content: `Here’s an STE-compliant version:

**Before you start the procedure, get the correct tools.**

- **Prior to** → **Before** (approved word).
- **Commencing** → **start** (approved verb).
- **Gather** → **get** (approved; "gather" is not on the list).
- **Required** → **correct** or specify the exact tools (clearer in procedures).

This follows **STE-1.1** (approved words) and **STE-4.1** (imperative style for procedures).`,
    suggestedSentence: "Before you start the procedure, get the correct tools.",
  },
];

export const MODE_PROMPTS = [
  {
    label: "Rewrite in STE",
    template: "Please rewrite this sentence in STE-compliant form: ",
  },
  {
    label: "Explain rule",
    template: "Explain STE rule ",
  },
  {
    label: "Compare two sentences",
    template: "Which of these is more STE-compliant and why?\n1) \n2) ",
  },
  {
    label: "Suggest alternative",
    template: "What approved word can I use instead of \"\" in STE? ",
  },
] as const;

export interface MockConversation {
  id: string;
  title: string;
  updatedAt: string;
  messageCount: number;
}

export const MOCK_CONVERSATIONS: MockConversation[] = [
  { id: "c1", title: "STE rewrites and semicolons", updatedAt: "2026-02-28", messageCount: 6 },
  { id: "c2", title: "Noun clusters (STE-2)", updatedAt: "2026-02-27", messageCount: 4 },
  { id: "c3", title: "Passive voice", updatedAt: "2026-02-26", messageCount: 8 },
];
