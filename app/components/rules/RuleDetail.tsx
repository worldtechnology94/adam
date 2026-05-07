"use client";

import { useState, useCallback } from "react";
import { Check, X, Star } from "lucide-react";
import type { SteRule } from "@/app/lib/mock/mock-rules";
import { cn } from "@/app/lib/utils";

interface RuleDetailProps {
  rule: SteRule;
  isFavorite: boolean;
  onToggleFavorite: (id: string) => void;
  onClose?: () => void;
}

/** Mock "Test this rule" result for demo: simple heuristic or random. */
function getMockTestResult(sentence: string, ruleId: string): { compliant: boolean; message: string } {
  const lower = sentence.toLowerCase().trim();
  if (!lower) return { compliant: true, message: "No sentence entered." };
  // Simple demo logic: if sentence has "utilize" or "prior to" and rule is STE-1.x, violation
  if (ruleId.startsWith("STE-1") && (lower.includes("utilize") || lower.includes("prior to"))) {
    return { compliant: false, message: "Contains non-approved word(s). Use the approved alternatives from the dictionary." };
  }
  if (ruleId === "STE-8.1" && lower.includes(";")) {
    return { compliant: false, message: "Semicolons are not allowed in STE. Use two sentences or 'and'/'or'." };
  }
  if (ruleId.startsWith("STE-5") && lower.split(/\s+/).length > 20) {
    return { compliant: false, message: "Sentence is too long. Keep procedural sentences to 20 words or fewer." };
  }
  // Default: compliant for demo
  return { compliant: true, message: "This sentence appears to comply with this rule. (Demo result)" };
}

export function RuleDetail({
  rule,
  isFavorite,
  onToggleFavorite,
  onClose,
}: RuleDetailProps) {
  const [testSentence, setTestSentence] = useState("");
  const [testResult, setTestResult] = useState<{ compliant: boolean; message: string } | null>(null);

  const runTest = useCallback(() => {
    setTestResult(getMockTestResult(testSentence, rule.id));
  }, [testSentence, rule.id]);

  return (
    <div className="space-y-6 rounded-lg border border-[var(--border)] bg-[var(--background)] p-6">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-mono text-lg font-bold text-[var(--foreground)]">
              {rule.id}
            </h2>
            <button
              type="button"
              onClick={() => onToggleFavorite(rule.id)}
              className={cn(
                "rounded p-1.5",
                isFavorite ? "text-[var(--accent)]" : "text-[var(--muted-foreground)] hover:text-[var(--accent)]"
              )}
              aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
            >
              <Star className={cn("size-5", isFavorite && "fill-current")} aria-hidden />
            </button>
          </div>
          <p className="mt-1 text-base font-medium text-[var(--foreground)]">
            {rule.name}
          </p>
          <p className="text-sm text-[var(--muted-foreground)]">
            STE-{rule.topic} — {rule.topicName}
          </p>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-[var(--border)] px-3 py-2 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ring)]"
          >
            Close
          </button>
        )}
      </div>

      <section aria-labelledby="rule-desc-head">
        <h3 id="rule-desc-head" className="text-sm font-semibold text-[var(--foreground)]">
          Explanation
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-[var(--foreground)]">
          {rule.description}
        </p>
      </section>

      <section aria-labelledby="rule-spec-head">
        <h3 id="rule-spec-head" className="text-sm font-semibold text-[var(--foreground)]">
          Specification (ASD-STE100)
        </h3>
        <p className="mt-2 rounded-md border border-[var(--border)] bg-[var(--muted)]/30 px-3 py-2 font-mono text-xs italic text-[var(--foreground)]">
          {rule.specText}
        </p>
      </section>

      <section aria-labelledby="rule-compliant-head">
        <h3 id="rule-compliant-head" className="flex items-center gap-2 text-sm font-semibold text-[var(--foreground)]">
          <Check className="size-4 text-[var(--success)]" aria-hidden />
          Compliant examples
        </h3>
        <ul className="mt-2 space-y-1.5" role="list">
          {rule.compliantExamples.map((ex, i) => (
            <li
              key={i}
              className="rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)]"
            >
              {ex.text}
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="rule-noncompliant-head">
        <h3 id="rule-noncompliant-head" className="flex items-center gap-2 text-sm font-semibold text-[var(--foreground)]">
          <X className="size-4 text-[var(--danger)]" aria-hidden />
          Non-compliant examples
        </h3>
        <ul className="mt-2 space-y-1.5" role="list">
          {rule.nonCompliantExamples.map((ex, i) => (
            <li
              key={i}
              className="rounded-md border border-[var(--border)] border-l-4 border-l-[var(--danger)] bg-[var(--background)] px-3 py-2 text-sm"
            >
              <p className="text-[var(--foreground)]">{ex.text}</p>
              {ex.reason && (
                <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                  {ex.reason}
                </p>
              )}
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="rule-test-head">
        <h3 id="rule-test-head" className="text-sm font-semibold text-[var(--foreground)]">
          Test this rule
        </h3>
        <p className="mt-1 text-xs text-[var(--muted-foreground)]">
          Enter a sentence to check it against this rule. Result is a demo and not from the full STE engine.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <input
            type="text"
            value={testSentence}
            onChange={(e) => {
              setTestSentence(e.target.value);
              setTestResult(null);
            }}
            onKeyDown={(e) => e.key === "Enter" && runTest()}
            placeholder="Type a sentence..."
            className="min-w-[16rem] flex-1 rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm focus:border-[var(--ring)] focus:outline-none focus:ring-1 focus:ring-[var(--ring)]"
            aria-label="Sentence to test"
          />
          <button
            type="button"
            onClick={runTest}
            className="rounded-md bg-[var(--primary)] px-4 py-2 text-sm font-medium text-[var(--primary-foreground)] hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ring)]"
          >
            Run
          </button>
        </div>
        {testResult && (
          <div
            className={cn(
              "mt-3 rounded-md border px-3 py-2 text-sm",
              testResult.compliant
                ? "border-[var(--success)] bg-[var(--success)]/10 text-[var(--success)]"
                : "border-[var(--danger)] bg-[var(--danger)]/10 text-[var(--danger)]"
            )}
            role="status"
          >
            {testResult.compliant ? "Compliant" : "Violation"}: {testResult.message}
          </div>
        )}
      </section>
    </div>
  );
}
