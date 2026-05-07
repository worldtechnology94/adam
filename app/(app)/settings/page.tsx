"use client";

import { useState, useEffect } from "react";
import { getSettings, getDefaultSettings, type StoredSettings } from "@/app/lib/settings-storage";
import { SettingsSections } from "@/app/components/settings/SettingsSections";

export default function SettingsPage() {
  const [settings, setSettings] = useState<StoredSettings>(getDefaultSettings());
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setSettings(getSettings());
    setMounted(true);
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-[var(--foreground)]">
          Settings &amp; Configuration
        </h1>
        <p className="mt-1 text-sm text-[var(--muted-foreground)]">
          Theme, notifications, analysis rules, and custom word lists. Preferences are saved in this browser.
        </p>
      </div>

      {mounted && (
        <SettingsSections settings={settings} onSettingsChange={setSettings} />
      )}
    </div>
  );
}
