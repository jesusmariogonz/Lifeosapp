"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, Globe2, Wallet, Palette } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { cn } from "@/lib/utils";
import { SUPPORTED_CURRENCIES } from "@/lib/currency";

const THEMES: { value: "light" | "night" | "calm"; label: string; blurb: string; swatch: string[] }[] = [
  {
    value: "light",
    label: "Light",
    blurb: "Cream & sage — the original calm daytime look.",
    swatch: ["#faf8f3", "#e3e9da", "#8a9a7e", "#2f2c26"],
  },
  {
    value: "night",
    label: "Night",
    blurb: "Dark background with a warm orange accent, easy on the eyes at night.",
    swatch: ["#1a1815", "#292623", "#e07a2a", "#f0ece4"],
  },
  {
    value: "calm",
    label: "Calm Blue",
    blurb: "A cool, soft blue palette for a quieter focus.",
    swatch: ["#f3f7fb", "#d6e5f5", "#5b8ac4", "#1e2630"],
  },
];

function getTimezoneList(): string[] {
  try {
    // @ts-ignore — supportedValuesOf is available in modern Node/browsers
    if (typeof Intl.supportedValuesOf === "function") {
      // @ts-ignore
      return Intl.supportedValuesOf("timeZone");
    }
  } catch {
    // fall through to a small manual fallback list
  }
  return [
    "UTC",
    "America/New_York",
    "America/Chicago",
    "America/Denver",
    "America/Los_Angeles",
    "America/Mexico_City",
    "America/Bogota",
    "America/Sao_Paulo",
    "America/Argentina/Buenos_Aires",
    "Europe/London",
    "Europe/Madrid",
    "Europe/Berlin",
    "Europe/Paris",
    "Asia/Tokyo",
    "Asia/Shanghai",
    "Asia/Kolkata",
    "Australia/Sydney",
  ];
}

export default function SettingsClient({
  initialTimezone,
  initialCurrency,
  initialTheme,
}: {
  initialTimezone: string;
  initialCurrency: string;
  initialTheme: string;
}) {
  const [timezone, setTimezone] = useState(initialTimezone);
  const [timezoneQuery, setTimezoneQuery] = useState("");
  const [tzSaving, setTzSaving] = useState(false);
  const [tzSaved, setTzSaved] = useState(false);
  const [tzError, setTzError] = useState<string | null>(null);

  const [currency, setCurrency] = useState(initialCurrency);
  const [currSaving, setCurrSaving] = useState(false);
  const [currSaved, setCurrSaved] = useState(false);

  const [theme, setTheme] = useState(initialTheme);
  const [themeError, setThemeError] = useState<string | null>(null);

  const [browserSuggestion, setBrowserSuggestion] = useState<string | null>(null);

  const allTimezones = useMemo(() => getTimezoneList(), []);
  const filteredTimezones = useMemo(() => {
    const q = timezoneQuery.trim().toLowerCase();
    if (!q) return allTimezones.slice(0, 200);
    return allTimezones.filter((tz) => tz.toLowerCase().includes(q)).slice(0, 200);
  }, [allTimezones, timezoneQuery]);

  // One-time convenience: if the saved timezone is still the default "UTC",
  // suggest the browser-detected zone so the user can confirm/save it —
  // never auto-saved silently.
  useEffect(() => {
    if (initialTimezone !== "UTC") return;
    try {
      const detected = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (detected && detected !== "UTC") setBrowserSuggestion(detected);
    } catch {
      // Intl not available — skip the suggestion
    }
  }, [initialTimezone]);

  async function saveTimezone(tz: string) {
    setTzSaving(true);
    setTzError(null);
    setTzSaved(false);
    try {
      await apiFetch("/api/settings", { method: "PATCH", body: JSON.stringify({ timezone: tz }) });
      setTimezone(tz);
      setTzSaved(true);
      setBrowserSuggestion(null);
      setTimeout(() => setTzSaved(false), 2500);
    } catch (e: any) {
      setTzError(e.message || "Could not save timezone");
    } finally {
      setTzSaving(false);
    }
  }

  async function saveCurrency(code: string) {
    setCurrSaving(true);
    try {
      await apiFetch("/api/settings", { method: "PATCH", body: JSON.stringify({ currency: code }) });
      setCurrency(code);
      setCurrSaved(true);
      setTimeout(() => setCurrSaved(false), 2500);
    } finally {
      setCurrSaving(false);
    }
  }

  async function saveTheme(value: string) {
    setTheme(value);
    setThemeError(null);
    // Apply instantly — no need to wait on the network round trip.
    if (typeof document !== "undefined") {
      document.documentElement.setAttribute("data-theme", value);
    }
    try {
      await apiFetch("/api/settings", { method: "PATCH", body: JSON.stringify({ theme: value }) });
    } catch (e: any) {
      setThemeError(e.message || "Could not save theme — it will reset next visit.");
    }
  }

  return (
    <div className="space-y-5">
      {/* Timezone */}
      <div className="card space-y-3">
        <div className="flex items-center gap-2">
          <Globe2 size={18} className="text-sage-500" />
          <h2 className="font-serif text-lg text-ink">Timezone</h2>
        </div>
        <p className="text-sm text-ink-light">
          Used to figure out "today" for your tasks, habits, wellness and journal — so day boundaries
          match your local midnight, not the server's.
        </p>

        {browserSuggestion && (
          <div className="flex flex-col gap-2 rounded-xl border border-sage-300 bg-sage-50 p-3 text-sm sm:flex-row sm:items-center sm:justify-between">
            <span>
              Your browser looks like it's in <strong>{browserSuggestion}</strong>. Use that?
            </span>
            <div className="flex gap-2">
              <button className="btn-primary px-3 py-1.5 text-xs" onClick={() => saveTimezone(browserSuggestion)}>
                Use {browserSuggestion}
              </button>
              <button className="btn-secondary px-3 py-1.5 text-xs" onClick={() => setBrowserSuggestion(null)}>
                Dismiss
              </button>
            </div>
          </div>
        )}

        <div>
          <label className="label">Current timezone</label>
          <p className="mb-2 text-sm font-medium">{timezone}</p>
          <input
            className="input mb-2"
            placeholder="Search timezones… (e.g. Mexico, London, Tokyo)"
            value={timezoneQuery}
            onChange={(e) => setTimezoneQuery(e.target.value)}
          />
          <select
            className="input"
            size={6}
            value={timezone}
            onChange={(e) => saveTimezone(e.target.value)}
          >
            {filteredTimezones.map((tz) => (
              <option key={tz} value={tz}>
                {tz}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2 text-xs">
          {tzSaving && <span className="text-ink-light">Saving…</span>}
          {tzSaved && (
            <span className="flex items-center gap-1 text-sage-600">
              <Check size={14} /> Saved
            </span>
          )}
          {tzError && <span className="text-red-500">{tzError}</span>}
        </div>
      </div>

      {/* Currency */}
      <div className="card space-y-3">
        <div className="flex items-center gap-2">
          <Wallet size={18} className="text-sage-500" />
          <h2 className="font-serif text-lg text-ink">Currency</h2>
        </div>
        <p className="text-sm text-ink-light">Controls how money amounts are formatted across Finance and Analytics.</p>
        <select className="input" value={currency} onChange={(e) => saveCurrency(e.target.value)}>
          {SUPPORTED_CURRENCIES.map((c) => (
            <option key={c.code} value={c.code}>
              {c.code} — {c.label} ({c.symbol})
            </option>
          ))}
        </select>
        <div className="flex items-center gap-2 text-xs">
          {currSaving && <span className="text-ink-light">Saving…</span>}
          {currSaved && (
            <span className="flex items-center gap-1 text-sage-600">
              <Check size={14} /> Saved
            </span>
          )}
        </div>
      </div>

      {/* Theme */}
      <div className="card space-y-3">
        <div className="flex items-center gap-2">
          <Palette size={18} className="text-sage-500" />
          <h2 className="font-serif text-lg text-ink">Theme</h2>
        </div>
        <p className="text-sm text-ink-light">Pick a look — applies instantly, no need to reload.</p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {THEMES.map((t) => (
            <button
              key={t.value}
              onClick={() => saveTheme(t.value)}
              className={cn(
                "rounded-2xl border-2 p-3 text-left transition",
                theme === t.value ? "border-sage-400 shadow-soft" : "border-cream-300 hover:border-sage-200"
              )}
            >
              <div className="mb-2 flex overflow-hidden rounded-lg">
                {t.swatch.map((hex, i) => (
                  <span key={i} className="h-8 flex-1" style={{ backgroundColor: hex }} />
                ))}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{t.label}</span>
                {theme === t.value && <Check size={16} className="text-sage-500" />}
              </div>
              <p className="mt-1 text-xs text-ink-light">{t.blurb}</p>
            </button>
          ))}
        </div>
        {themeError && <p className="text-xs text-red-500">{themeError}</p>}
      </div>
    </div>
  );
}
