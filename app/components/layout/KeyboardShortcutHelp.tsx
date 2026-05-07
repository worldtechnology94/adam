"use client";

import { useEffect, useState, useCallback } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Keyboard } from "lucide-react";

const shortcuts = [
  { keys: "?", description: "Show this keyboard shortcuts help" },
  { keys: "Esc", description: "Close dialog or menu" },
  { keys: "Tab", description: "Move focus between interactive elements" },
  { keys: "Enter", description: "Activate focused link or button" },
];

export function KeyboardShortcutHelp() {
  const [open, setOpen] = useState(false);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "?" && !e.ctrlKey && !e.metaKey && !e.altKey) {
        const target = e.target as HTMLElement;
        if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable) return;
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    },
    []
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Portal>
        <Dialog.Overlay
          className="fixed inset-0 z-50 bg-black/50 transition-opacity duration-200 data-[state=closed]:opacity-0 data-[state=open]:opacity-100"
          aria-hidden
        />
        <Dialog.Content
          className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-lg border border-[var(--border)] bg-[var(--background)] p-6 shadow-lg transition-opacity duration-200 focus:outline-none data-[state=closed]:opacity-0 data-[state=open]:opacity-100"
          aria-describedby="keyboard-shortcuts-description"
          aria-labelledby="keyboard-shortcuts-title"
          onCloseAutoFocus={(e) => e.preventDefault()}
        >
          <div className="flex items-center gap-2">
            <Keyboard className="size-5 text-[var(--muted-foreground)]" aria-hidden />
            <Dialog.Title
              id="keyboard-shortcuts-title"
              className="text-lg font-semibold text-[var(--foreground)]"
            >
              Keyboard shortcuts
            </Dialog.Title>
          </div>
          <p id="keyboard-shortcuts-description" className="mt-1 text-sm text-[var(--muted-foreground)]">
            Press <kbd className="rounded border border-[var(--border)] bg-[var(--muted)] px-1.5 py-0.5 font-mono text-xs">?</kbd> from any screen to open this help.
          </p>
          <dl className="mt-4 space-y-3">
            {shortcuts.map(({ keys, description }) => (
              <div key={keys} className="flex items-center justify-between gap-4">
                <dt className="text-sm text-[var(--foreground)]">{description}</dt>
                <dd>
                  <kbd className="rounded border border-[var(--border)] bg-[var(--muted)] px-2 py-1 font-mono text-xs text-[var(--foreground)]">
                    {keys}
                  </kbd>
                </dd>
              </div>
            ))}
          </dl>
          <Dialog.Close asChild>
            <button
              type="button"
              className="mt-6 w-full rounded-md bg-[var(--primary)] px-4 py-2 text-sm font-medium text-[var(--primary-foreground)] hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ring)]"
              aria-label="Close keyboard shortcuts dialog"
            >
              Close
            </button>
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
