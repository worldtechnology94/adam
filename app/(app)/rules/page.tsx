"use client";

import { useCallback, useMemo, useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  getFavoriteRuleIds,
  toggleFavorite as persistToggleFavorite,
  type SteRule,
  type SteTopicId,
} from "@/app/lib/mock/mock-rules";
import { RuleCard } from "@/app/components/rules/RuleCard";
import { RuleDetail } from "@/app/components/rules/RuleDetail";

function filterRules(
  rules: SteRule[],
  search: string,
  topic: SteTopicId | "",
  favoritesOnly: boolean,
  favoriteIds: string[]
): SteRule[] {
  return rules.filter((rule) => {
    if (favoritesOnly && !favoriteIds.includes(rule.id)) return false;
    if (topic && rule.topic !== topic) return false;
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    const text = [
      rule.id,
      rule.name,
      rule.description,
      rule.specText,
      ...rule.compliantExamples.map((e) => e.text),
      ...rule.nonCompliantExamples.map((e) => e.text + " " + (e.reason ?? "")),
    ].join(" ");
    return text.toLowerCase().includes(q);
  });
}

function RulesPageContent() {
  const searchParams = useSearchParams();
  const [mounted, setMounted] = useState(false);

  const [rules, setRules] = useState<SteRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [topic, setTopic] = useState<SteTopicId | "">("");
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [favorites, setFavorites] = useState<string[]>([]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetch("/api/rules")
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          const msg =
            typeof data?.details === "string"
              ? `${data?.error ?? res.statusText}: ${data.details}`
              : typeof data?.error === "string"
                ? data.error
                : res.statusText;
          throw new Error(msg);
        }
        return data;
      })
      .then((data: SteRule[]) => {
        if (cancelled) return;
        setRules(Array.isArray(data) ? data : []);
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load rules");
        setRules([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (mounted) setFavorites(getFavoriteRuleIds());
  }, [mounted]);

  useEffect(() => {
    if (!mounted || rules.length === 0) return;
    const r = searchParams.get("rule") ?? searchParams.get("highlight");
    if (r && rules.some((x) => x.id === r)) setSelectedId(r);
  }, [mounted, searchParams, rules]);

  useEffect(() => {
    if (!selectedId) return;
    const el = document.getElementById(`rule-${selectedId}`);
    if (el) {
      const t = setTimeout(() => {
        el.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }, 150);
      return () => clearTimeout(t);
    }
  }, [selectedId]);

  const updateUrl = useCallback((id: string | null) => {
    const url = new URL(window.location.href);
    if (id) url.searchParams.set("rule", id);
    else url.searchParams.delete("rule");
    window.history.replaceState({}, "", url.toString());
  }, []);

  const handleSelectRule = useCallback(
    (id: string) => {
      setSelectedId(id);
      updateUrl(id);
    },
    [updateUrl]
  );

  const handleCloseDetail = useCallback(() => {
    setSelectedId(null);
    updateUrl(null);
  }, [updateUrl]);

  const filtered = useMemo(
    () => filterRules(rules, search, topic, favoritesOnly, favorites),
    [rules, search, topic, favoritesOnly, favorites]
  );

  const selectedRule = useMemo(
    () => (selectedId ? rules.find((r) => r.id === selectedId) ?? null : null),
    [rules, selectedId]
  );

  const handleToggleFavorite = useCallback((id: string) => {
    persistToggleFavorite(id);
    setFavorites(getFavoriteRuleIds());
  }, []);

  if (!mounted || loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-semibold text-[var(--foreground)]">
            Rule Reference Library
          </h1>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">
            Loading rules…
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-semibold text-[var(--foreground)]">
            Rule Reference Library
          </h1>
          <p className="mt-2 text-sm text-red-600">Error: {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h1 className="text-xl font-semibold text-[var(--foreground)]">
            Rule Reference Library
          </h1>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">
            Searchable library of STE rules with examples and test sandbox.
          </p>
        </div>
        <span
          className="rounded-full border border-[var(--border)] bg-[var(--muted)] px-3 py-1 text-xs font-medium text-[var(--muted-foreground)]"
          title={rules.length > 0 ? "Rules from database." : "No rules in database. Run npm run seed:rules."}
        >
          {rules.length > 0 ? "Live data" : "No rules"}
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search rules..."
          className="min-w-[12rem] flex-1 rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm focus:border-[var(--ring)] focus:outline-none focus:ring-1 focus:ring-[var(--ring)]"
          aria-label="Search rule names, descriptions, and examples"
        />
        <select
          value={topic}
          onChange={(e) => setTopic((e.target.value || "") as SteTopicId | "")}
          className="rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm focus:border-[var(--ring)] focus:outline-none focus:ring-1 focus:ring-[var(--ring)]"
          aria-label="Filter by STE topic"
        >
          <option value="">All topics (1–10)</option>
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((t) => (
            <option key={t} value={t}>
              STE-{t}
            </option>
          ))}
        </select>
        <label className="flex cursor-pointer items-center gap-2 text-sm text-[var(--foreground)]">
          <input
            type="checkbox"
            checked={favoritesOnly}
            onChange={(e) => setFavoritesOnly(e.target.checked)}
            className="rounded border-[var(--border)]"
            aria-label="Show only favorite rules"
          />
          Favorites only
        </label>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-2">
          <h2 className="text-sm font-semibold text-[var(--foreground)]">
            Rules ({filtered.length})
          </h2>
          <div className="max-h-[32rem] space-y-2 overflow-y-auto">
            {filtered.length === 0 ? (
              <p className="py-4 text-sm text-[var(--muted-foreground)]">
                {rules.length === 0
                  ? "No rules in library. Run npm run seed:rules to load rules."
                  : "No rules match your search or filter."}
              </p>
            ) : (
              filtered.map((rule) => (
                <div key={rule.id} id={`rule-${rule.id}`}>
                  <RuleCard
                    rule={rule}
                    isSelected={selectedId === rule.id}
                    isFavorite={favorites.includes(rule.id)}
                    onSelect={handleSelectRule}
                    onToggleFavorite={handleToggleFavorite}
                  />
                </div>
              ))
            )}
          </div>
        </div>

        <div className="lg:sticky lg:top-4 lg:self-start">
          {selectedRule ? (
            <RuleDetail
              rule={selectedRule}
              isFavorite={favorites.includes(selectedRule.id)}
              onToggleFavorite={handleToggleFavorite}
              onClose={handleCloseDetail}
            />
          ) : (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-[var(--border)] bg-[var(--muted)]/20 p-8 text-center">
              <p className="text-sm text-[var(--muted-foreground)]">
                Select a rule to see full details, examples, and the test sandbox.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function RulesPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-6">
          <div>
            <h1 className="text-xl font-semibold text-[var(--foreground)]">
              Rule Reference Library
            </h1>
            <p className="mt-1 text-sm text-[var(--muted-foreground)]">
              Loading…
            </p>
          </div>
        </div>
      }
    >
      <RulesPageContent />
    </Suspense>
  );
}
