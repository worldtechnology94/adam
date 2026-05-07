"use client";

import { useTheme } from "@/app/components/theme-provider";
import {
  getSettings,
  setSettings,
  type StoredSettings,
  type ExportFormat,
} from "@/app/lib/settings-storage";
import { MOCK_RULES } from "@/app/lib/mock/mock-rules";
import { EXPORT_FORMATS } from "@/app/lib/mock/mock-reports";
import { cn } from "@/app/lib/utils";

interface SettingsSectionsProps {
  settings: StoredSettings;
  onSettingsChange: (next: StoredSettings) => void;
}

export function SettingsSections({ settings, onSettingsChange }: SettingsSectionsProps) {
  const { theme, setTheme } = useTheme();

  const update = (partial: Partial<StoredSettings>) => {
    setSettings(partial);
    onSettingsChange({ ...settings, ...partial });
  };

  const setNotification = (key: keyof StoredSettings["notifications"], value: boolean) => {
    const next = { ...settings.notifications, [key]: value };
    update({ notifications: next });
  };

  const allRuleIds = MOCK_RULES.map((r) => r.id);
  const enabledSet = new Set(settings.enabledRuleIds);
  const allEnabled = enabledSet.size === 0 || allRuleIds.every((id) => enabledSet.has(id));

  const toggleRule = (ruleId: string) => {
    const currentlyEnabled = allEnabled || enabledSet.has(ruleId);
    const next = currentlyEnabled
      ? (enabledSet.size === 0 ? allRuleIds : settings.enabledRuleIds).filter((id) => id !== ruleId)
      : [...settings.enabledRuleIds, ruleId];
    update({ enabledRuleIds: next });
  };

  return (
    <div className="space-y-8">
      <section aria-labelledby="prefs-heading">
        <h2 id="prefs-heading" className="mb-4 text-lg font-semibold text-[var(--foreground)]">
          User preferences
        </h2>
        <div className="space-y-4 rounded-lg border border-[var(--border)] bg-[var(--background)] p-4">
          <div>
            <label className="block text-sm font-medium text-[var(--foreground)]">Theme</label>
            <div className="mt-2 flex gap-2">
              {(["light", "dark", "high-contrast"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTheme(t)}
                  className={cn(
                    "rounded-md border px-3 py-1.5 text-sm font-medium capitalize focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ring)]",
                    theme === t
                      ? "border-[var(--primary)] bg-[var(--primary)] text-[var(--primary-foreground)]"
                      : "border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] hover:bg-[var(--muted)]"
                  )}
                >
                  {t.replace("-", " ")}
                </button>
              ))}
            </div>
          </div>
          <div>
            <span className="block text-sm font-medium text-[var(--foreground)]">Notifications</span>
            <div className="mt-2 space-y-2">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={settings.notifications.violationAlert}
                  onChange={(e) => setNotification("violationAlert", e.target.checked)}
                  className="rounded border-[var(--border)] text-[var(--primary)] focus:ring-[var(--ring)]"
                />
                <span className="text-sm text-[var(--foreground)]">Violation alerts</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={settings.notifications.emailReport}
                  onChange={(e) => setNotification("emailReport", e.target.checked)}
                  className="rounded border-[var(--border)] text-[var(--primary)] focus:ring-[var(--ring)]"
                />
                <span className="text-sm text-[var(--foreground)]">Email when report is ready</span>
              </label>
            </div>
          </div>
          <div>
            <label htmlFor="default-export" className="block text-sm font-medium text-[var(--foreground)]">
              Default export format
            </label>
            <select
              id="default-export"
              value={settings.defaultExportFormat}
              onChange={(e) => update({ defaultExportFormat: e.target.value as ExportFormat })}
              className="mt-1 rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] focus:border-[var(--ring)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
            >
              {EXPORT_FORMATS.map(({ value, label }) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="language" className="block text-sm font-medium text-[var(--foreground)]">
              Language
            </label>
            <select
              id="language"
              value={settings.language}
              onChange={(e) => update({ language: e.target.value })}
              className="mt-1 rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] focus:border-[var(--ring)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
            >
              <option value="en">English</option>
            </select>
          </div>
        </div>
      </section>

      <section aria-labelledby="analysis-heading">
        <h2 id="analysis-heading" className="mb-4 text-lg font-semibold text-[var(--foreground)]">
          Analysis configuration
        </h2>
        <div className="space-y-4 rounded-lg border border-[var(--border)] bg-[var(--background)] p-4">
          <div>
            <span className="block text-sm font-medium text-[var(--foreground)]">
              Enable / disable rules
            </span>
            <p className="mt-1 text-xs text-[var(--muted-foreground)]">
              Uncheck a rule to exclude it from analysis. Empty = all enabled.
            </p>
            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2">
              {MOCK_RULES.map((rule) => (
                <label key={rule.id} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={allEnabled || enabledSet.has(rule.id)}
                    onChange={() => toggleRule(rule.id)}
                    className="rounded border-[var(--border)] text-[var(--primary)] focus:ring-[var(--ring)]"
                  />
                  <span className="text-sm text-[var(--foreground)]">{rule.id}</span>
                </label>
              ))}
            </div>
          </div>
          <div>
            <span className="block text-sm font-medium text-[var(--foreground)]">
              Custom word list
            </span>
            <p className="mt-1 text-sm text-[var(--muted-foreground)]">
              <span className="rounded border border-dashed border-[var(--border)] px-2 py-1">
                Placeholder: CSV upload for custom approved words (not implemented).
              </span>
            </p>
          </div>
          <div>
            <span className="block text-sm font-medium text-[var(--foreground)]">
              Severity thresholds
            </span>
            <p className="mt-1 text-xs text-[var(--muted-foreground)]">
              Demo: thresholds are fixed. Connect backend to customize.
            </p>
          </div>
        </div>
      </section>

      <section aria-labelledby="integrations-heading">
        <h2 id="integrations-heading" className="mb-4 text-lg font-semibold text-[var(--foreground)]">
          Integrations
        </h2>
        <div className="rounded-lg border border-[var(--border)] bg-[var(--background)] p-4">
          <p className="text-sm text-[var(--muted-foreground)]">
            REST API, Webhook, and SSO configuration will be available when the backend is connected.
          </p>
        </div>
      </section>
    </div>
  );
}
