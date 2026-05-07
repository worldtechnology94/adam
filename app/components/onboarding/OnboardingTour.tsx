"use client";

import { useState, useEffect, useCallback } from "react";
import * as Dialog from "@radix-ui/react-dialog";

const STORAGE_KEY = "adam-tour-completed";

const STEPS = [
  {
    title: "Welcome to ADAM",
    body: "ADAM helps you write STE-compliant technical documentation. Use the sidebar to move between Dashboard, Upload, Violations, Rules, and more.",
  },
  {
    title: "Navigate and explore",
    body: "From the Dashboard you can see compliance scores and recent activity. Upload documents to analyze, then review violations and use the Rule Library for reference.",
  },
  {
    title: "Keyboard shortcuts",
    body: "Press the ? key at any time to open the keyboard shortcuts help.",
  },
];

export function OnboardingTour() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      if (localStorage.getItem(STORAGE_KEY) === "true") return;
      setOpen(true);
    } catch {
      // ignore
    }
  }, []);

  const complete = useCallback(() => {
    try {
      localStorage.setItem(STORAGE_KEY, "true");
    } catch {
      // ignore
    }
    setOpen(false);
  }, []);

  const handleNext = useCallback(() => {
    if (step >= STEPS.length - 1) complete();
    else setStep((s) => s + 1);
  }, [step, complete]);

  const handleSkip = useCallback(() => {
    complete();
  }, [complete]);

  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;

  return (
    <Dialog.Root open={open} onOpenChange={(o) => !o && complete()}>
      <Dialog.Portal>
        <Dialog.Overlay
          className="fixed inset-0 z-[60] bg-black/50 transition-opacity"
          aria-hidden
        />
        <Dialog.Content
          className="fixed left-1/2 top-1/2 z-[60] w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-lg border border-[var(--border)] bg-[var(--background)] p-6 shadow-lg focus:outline-none"
        >
          <Dialog.Title className="text-lg font-semibold text-[var(--foreground)]">
            {current.title}
          </Dialog.Title>
          <Dialog.Description className="mt-2 text-sm text-[var(--muted-foreground)]">
            {current.body}
          </Dialog.Description>
          <div className="mt-6 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={handleSkip}
              className="text-sm font-medium text-[var(--muted-foreground)] hover:text-[var(--foreground)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ring)] rounded"
              aria-label="Skip tour"
            >
              Skip tour
            </button>
            <button
              type="button"
              onClick={handleNext}
              className="rounded-md bg-[var(--primary)] px-4 py-2 text-sm font-medium text-[var(--primary-foreground)] hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ring)]"
              aria-label={isLast ? "Finish tour" : "Next step"}
            >
              {isLast ? "Finish" : "Next"}
            </button>
          </div>
          <p className="sr-only" aria-live="polite">
            Step {step + 1} of {STEPS.length}
          </p>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
