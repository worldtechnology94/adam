"use client";

import { useState, useCallback } from "react";
import { Check, X, Star, Loader2, AlertCircle } from "lucide-react";
import type { SteRule } from "@/app/lib/mock/mock-rules";
import { cn } from "@/app/lib/utils";

interface TestViolation {
  ruleId: string;
  ruleName: string;
  severity: string;
  sentenceExcerpt: string;
  positionStart: number;
  positionEnd: number;
  suggestion: string;
}

interface TestResult {
  ruleId: string;
  compliant: boolean | null;
  notImplementable?: boolean;
  violations: TestViolation[];
  message: string;
}

interface RuleDetailProps {
  rule: SteRule;
  isFavorite: boolean;
  onToggleFavorite: (id: string) => void;
  onClose?: () => void;
}

export function RuleDetail({
  rule,
  isFavorite,
  onToggleFavorite,
  onClose,
}: RuleDetailProps) {
  const [testText, setTestText] = useState("");
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [testError, setTestError] = useState<string | null>(null);

  const runTest = useCallback(async () => {
    const trimmed = testText.trim();
    if (!trimmed || isLoading) return;
    setIsLoading(true);
    setTestResult(null);
    setTestError(null);
    try {
      const res = await fetch(`/api/rules/${encodeURIComponent(rule.id)}/test`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: trimmed }),
      });
      const data = await res.json().catch(() => ({ error: "Invalid response" }));
      if (!res.ok) {
        setTestError((data as { error?: string }).error ?? "Test failed. Try again.");
      } else {
        setTestResult(data as TestResult);
      }
    } catch {
      setTestError("Network error. Check your connection and try again.");
    } finally {
      setIsLoading(false);
    }
  }, [testText, isLoading, rule.id]);

  return (
    <div className="space-y-6 rounded-lg border border-[var(--border)] bg-[var(--background)] p-6">

      {/* Header */}
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
                isFavorite
                  ? "text-[var(--accent)]"
                  : "text-[var(--muted-foreground)] hover:text-[var(--accent)]"
              )}
              aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
            >
              <Star className={cn("size-5", isFavorite && "fill-current")} aria-hidden />
            </button>
          </div>
          <p className="mt-1 text-base font-medium text-[var(--foreground)]">{rule.name}</p>
          <p className="text-sm text-[var(--muted-foreground)]">
            Section {rule.topic} — {rule.topicName}
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

      {/* Explanation */}
      <section aria-labelledby="rule-desc-head">
        <h3 id="rule-desc-head" className="text-sm font-semibold text-[var(--foreground)]">
          Explanation
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-[var(--foreground)]">
          {rule.description}
        </p>
      </section>

      {/* Spec text */}
      <section aria-labelledby="rule-spec-head">
        <h3 id="rule-spec-head" className="text-sm font-semibold text-[var(--foreground)]">
          Specification (ASD-STE100 Issue 9)
        </h3>
        <p className="mt-2 rounded-md border border-[var(--border)] bg-[var(--muted)]/30 px-3 py-2 font-mono text-xs italic text-[var(--foreground)]">
          {rule.specText}
        </p>
      </section>

      {/* Compliant examples */}
      {rule.compliantExamples.length > 0 && (
        <section aria-labelledby="rule-compliant-head">
          <h3
            id="rule-compliant-head"
            className="flex items-center gap-2 text-sm font-semibold text-[var(--foreground)]"
          >
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
      )}

      {/* Non-compliant examples */}
      {rule.nonCompliantExamples.length > 0 && (
        <section aria-labelledby="rule-noncompliant-head">
          <h3
            id="rule-noncompliant-head"
            className="flex items-center gap-2 text-sm font-semibold text-[var(--foreground)]"
          >
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
                  <p className="mt-1 text-xs text-[var(--muted-foreground)]">{ex.reason}</p>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Test sandbox — real engine */}
      <section aria-labelledby="rule-test-head">
        <h3 id="rule-test-head" className="text-sm font-semibold text-[var(--foreground)]">
          Test this rule
        </h3>
        <p className="mt-1 text-xs text-[var(--muted-foreground)]">
          Enter a sentence or paragraph and run it against the real STE engine for this rule.
        </p>
        <div className="mt-3 space-y-2">
          <textarea
            value={testText}
            onChange={(e) => {
              setTestText(e.target.value);
              setTestResult(null);
              setTestError(null);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
                e.preventDefault();
                void runTest();
              }
            }}
            placeholder="Type a sentence or paragraph… (Ctrl+Enter to run)"
            rows={3}
            className="w-full rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm focus:border-[var(--ring)] focus:outline-none focus:ring-1 focus:ring-[var(--ring)] disabled:opacity-50"
            aria-label="Text to test against this rule"
            disabled={isLoading}
          />
          <button
            type="button"
            onClick={() => void runTest()}
            disabled={isLoading || !testText.trim()}
            className="rounded-md bg-[var(--primary)] px-4 py-2 text-sm font-medium text-[var(--primary-foreground)] hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ring)] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <Loader2 className="size-4 animate-spin" aria-hidden />
                Testing…
              </span>
            ) : (
              "Run test"
            )}
          </button>
        </div>

        {/* Error */}
        {testError && (
          <div className="mt-3 flex items-start gap-2 rounded-md border border-[var(--danger)]/40 bg-[var(--danger)]/5 px-3 py-2 text-sm text-[var(--danger)]">
            <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
            {testError}
          </div>
        )}

        {/* Result */}
        {testResult && (
          <div className="mt-3 space-y-3">
            {/* Summary */}
            <div
              role="status"
              className={cn(
                "rounded-md border px-3 py-2 text-sm font-medium",
                testResult.notImplementable
                  ? "border-[var(--border)] bg-[var(--muted)]/30 text-[var(--muted-foreground)]"
                  : testResult.compliant
                    ? "border-[var(--success)] bg-[var(--success)]/10 text-[var(--success)]"
                    : "border-[var(--danger)] bg-[var(--danger)]/10 text-[var(--danger)]"
              )}
            >
              {testResult.notImplementable
                ? `ⓘ ${testResult.message}`
                : testResult.compliant
                  ? `✓ Compliant — ${testResult.message}`
                  : `✗ Violation — ${testResult.message}`}
            </div>

            {/* Violation details */}
            {!testResult.compliant &&
              !testResult.notImplementable &&
              testResult.violations.length > 0 && (
                <ul className="space-y-2" role="list">
                  {testResult.violations.map((v, i) => (
                    <li
                      key={i}
                      className="rounded-md border border-[var(--danger)]/30 bg-[var(--background)] px-3 py-2 text-xs"
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={cn(
                            "rounded px-1.5 py-0.5 font-mono text-[10px] uppercase",
                            v.severity === "critical"
                              ? "bg-red-100 text-red-700"
                              : v.severity === "major"
                                ? "bg-orange-100 text-orange-700"
                                : "bg-yellow-100 text-yellow-700"
                          )}
                        >
                          {v.severity}
                        </span>
                        <span className="text-[var(--muted-foreground)]">{v.ruleName}</span>
                      </div>
                      {v.suggestion && (
                        <p className="mt-1.5 text-[var(--foreground)]">{v.suggestion}</p>
                      )}
                    </li>
                  ))}
                </ul>
              )}
          </div>
        )}
      </section>
    </div>
  );
}
