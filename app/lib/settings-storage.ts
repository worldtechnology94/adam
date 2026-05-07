/**
 * Settings persisted to localStorage — Phase G (UI only).
 */

const KEY_PREFIX = "adam-settings-";

export type ExportFormat = "pdf" | "docx" | "xlsx" | "json" | "html";

export interface StoredSettings {
  notifications: {
    emailReport: boolean;
    violationAlert: boolean;
  };
  defaultExportFormat: ExportFormat;
  language: string;
  enabledRuleIds: string[];
}

const DEFAULTS: StoredSettings = {
  notifications: { emailReport: false, violationAlert: true },
  defaultExportFormat: "pdf",
  language: "en",
  enabledRuleIds: [], // empty = all enabled for demo
};

function getStored<T>(key: string, parse: (s: string) => T): T | null {
  if (typeof window === "undefined") return null;
  try {
    const s = localStorage.getItem(KEY_PREFIX + key);
    if (s == null) return null;
    return parse(s);
  } catch {
    return null;
  }
}

function setStored(key: string, value: string): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(KEY_PREFIX + key, value);
  } catch {
    // ignore
  }
}

export function getSettings(): StoredSettings {
  const notif = getStored("notifications", (s) => JSON.parse(s) as StoredSettings["notifications"]);
  const format = getStored("defaultExportFormat", (s) => s as ExportFormat);
  const lang = getStored("language", (s) => s);
  const rules = getStored("enabledRuleIds", (s) => JSON.parse(s) as string[]);
  return {
    notifications: notif ?? DEFAULTS.notifications,
    defaultExportFormat: format ?? DEFAULTS.defaultExportFormat,
    language: lang ?? DEFAULTS.language,
    enabledRuleIds: rules ?? DEFAULTS.enabledRuleIds,
  };
}

export function setSettings(partial: Partial<StoredSettings>): void {
  const current = getSettings();
  const next = { ...current, ...partial };
  setStored("notifications", JSON.stringify(next.notifications));
  setStored("defaultExportFormat", next.defaultExportFormat);
  setStored("language", next.language);
  setStored("enabledRuleIds", JSON.stringify(next.enabledRuleIds));
}

export function getDefaultSettings(): StoredSettings {
  return { ...DEFAULTS };
}
