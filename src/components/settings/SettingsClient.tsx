"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Globe2, Wallet, Palette, Languages, Cake, Ruler } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { cn } from "@/lib/utils";
import { SUPPORTED_CURRENCIES } from "@/lib/currency";
import { useTranslation } from "@/lib/i18n/LocaleProvider";
import type { Locale } from "@/lib/i18n/dictionaries";

const THEME_VALUES: { value: "light" | "night" | "calm"; swatch: string[] }[] = [
  { value: "light", swatch: ["#faf8f3", "#e3e9da", "#8a9a7e", "#2f2c26"] },
  { value: "night", swatch: ["#1a1815", "#292623", "#e07a2a", "#f0ece4"] },
  { value: "calm", swatch: ["#f3f7fb", "#d6e5f5", "#5b8ac4", "#1e2630"] },
];

const LOCALE_VALUES: Locale[] = ["en", "es"];

const UNITS_VALUES: ("metric" | "imperial")[] = ["metric", "imperial"];

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
  initialLocale,
  initialBirthday,
  initialUnits,
}: {
  initialTimezone: string;
  initialCurrency: string;
  initialTheme: string;
  initialLocale: string;
  initialBirthday: string;
  initialUnits: string;
}) {
  const router = useRouter();
  const { dict, setLocale: setContextLocale } = useTranslation();
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

  const [locale, setLocale] = useState(initialLocale);
  const [localeError, setLocaleError] = useState<string | null>(null);

  const [birthday, setBirthday] = useState(initialBirthday);
  const [bdaySaving, setBdaySaving] = useState(false);
  const [bdaySaved, setBdaySaved] = useState(false);
  const [bdayError, setBdayError] = useState<string | null>(null);

  const [units, setUnits] = useState(initialUnits);
  const [unitsError, setUnitsError] = useState<string | null>(null);

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

  async function saveLocale(value: Locale) {
    setLocale(value);
    setLocaleError(null);
    // Apply instantly to already-mounted client components...
    setContextLocale(value);
    try {
      await apiFetch("/api/settings", { method: "PATCH", body: JSON.stringify({ locale: value }) });
      // ...and re-render server-rendered text (page titles, etc.) with it.
      router.refresh();
    } catch (e: any) {
      setLocaleError(e.message || "Could not save language — it will reset next visit.");
    }
  }

  async function saveBirthday(value: string) {
    setBirthday(value);
    setBdaySaving(true);
    setBdayError(null);
    setBdaySaved(false);
    try {
      await apiFetch("/api/settings", { method: "PATCH", body: JSON.stringify({ birthday: value || null }) });
      setBdaySaved(true);
      setTimeout(() => setBdaySaved(false), 2500);
    } catch (e: any) {
      setBdayError(e.message || "Could not save birthday");
    } finally {
      setBdaySaving(false);
    }
  }

  async function saveUnits(value: string) {
    setUnits(value);
    setUnitsError(null);
    try {
      await apiFetch("/api/settings", { method: "PATCH", body: JSON.stringify({ units: value }) });
    } catch (e: any) {
      setUnitsError(e.message || "Could not save units — it will reset next visit.");
    }
  }

  return (
    <div className="space-y-5">
      {/* Timezone */}
      <div className="card space-y-3">
        <div className="flex items-center gap-2">
          <Globe2 size={18} className="text-sage-500" />
          <h2 className="font-serif text-lg text-ink">{dict.settings.timezone.heading}</h2>
        </div>
        <p className="text-sm text-ink-light">{dict.settings.timezone.description}</p>

        {browserSuggestion && (
          <div className="flex flex-col gap-2 rounded-xl border border-sage-300 bg-sage-50 p-3 text-sm sm:flex-row sm:items-center sm:justify-between">
            <span>
              {dict.settings.timezone.browserSuggestion} <strong>{browserSuggestion}</strong>?
            </span>
            <div className="flex gap-2">
              <button className="btn-primary px-3 py-1.5 text-xs" onClick={() => saveTimezone(browserSuggestion)}>
                {dict.settings.timezone.use} {browserSuggestion}
              </button>
              <button className="btn-secondary px-3 py-1.5 text-xs" onClick={() => setBrowserSuggestion(null)}>
                {dict.settings.timezone.dismiss}
              </button>
            </div>
          </div>
        )}

        <div>
          <label className="label">{dict.settings.timezone.currentLabel}</label>
          <p className="mb-2 text-sm font-medium">{timezone}</p>
          <input
            className="input mb-2"
            placeholder={dict.settings.timezone.searchPlaceholder}
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
          {tzSaving && <span className="text-ink-light">{dict.settings.timezone.saving}</span>}
          {tzSaved && (
            <span className="flex items-center gap-1 text-sage-600">
              <Check size={14} /> {dict.settings.timezone.saved}
            </span>
          )}
          {tzError && <span className="text-red-500">{tzError}</span>}
        </div>
      </div>

      {/* Birthday */}
      <div className="card space-y-3">
        <div className="flex items-center gap-2">
          <Cake size={18} className="text-sage-500" />
          <h2 className="font-serif text-lg text-ink">{dict.settings.birthday.heading}</h2>
        </div>
        <p className="text-sm text-ink-light">{dict.settings.birthday.description}</p>
        <input
          type="date"
          className="input"
          value={birthday}
          onChange={(e) => saveBirthday(e.target.value)}
        />
        <div className="flex items-center gap-2 text-xs">
          {bdaySaving && <span className="text-ink-light">{dict.settings.timezone.saving}</span>}
          {bdaySaved && (
            <span className="flex items-center gap-1 text-sage-600">
              <Check size={14} /> {dict.settings.timezone.saved}
            </span>
          )}
          {bdayError && <span className="text-red-500">{bdayError}</span>}
        </div>
      </div>

      {/* Currency */}
      <div className="card space-y-3">
        <div className="flex items-center gap-2">
          <Wallet size={18} className="text-sage-500" />
          <h2 className="font-serif text-lg text-ink">{dict.settings.currency.heading}</h2>
        </div>
        <p className="text-sm text-ink-light">{dict.settings.currency.description}</p>
        <select className="input" value={currency} onChange={(e) => saveCurrency(e.target.value)}>
          {SUPPORTED_CURRENCIES.map((c) => (
            <option key={c.code} value={c.code}>
              {c.code} — {c.label} ({c.symbol})
            </option>
          ))}
        </select>
        <div className="flex items-center gap-2 text-xs">
          {currSaving && <span className="text-ink-light">{dict.settings.timezone.saving}</span>}
          {currSaved && (
            <span className="flex items-center gap-1 text-sage-600">
              <Check size={14} /> {dict.settings.timezone.saved}
            </span>
          )}
        </div>
      </div>

      {/* Units */}
      <div className="card space-y-3">
        <div className="flex items-center gap-2">
          <Ruler size={18} className="text-sage-500" />
          <h2 className="font-serif text-lg text-ink">{dict.settings.units.heading}</h2>
        </div>
        <p className="text-sm text-ink-light">{dict.settings.units.description}</p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {UNITS_VALUES.map((value) => {
            const info = dict.settings.units[value];
            return (
              <button
                key={value}
                onClick={() => saveUnits(value)}
                className={cn(
                  "rounded-2xl border-2 p-3 text-left transition",
                  units === value ? "border-sage-400 shadow-soft" : "border-cream-300 hover:border-sage-200"
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{info.label}</span>
                  {units === value && <Check size={16} className="text-sage-500" />}
                </div>
                <p className="mt-1 text-xs text-ink-light">{info.blurb}</p>
              </button>
            );
          })}
        </div>
        {unitsError && <p className="text-xs text-red-500">{unitsError}</p>}
      </div>

      {/* Theme */}
      <div className="card space-y-3">
        <div className="flex items-center gap-2">
          <Palette size={18} className="text-sage-500" />
          <h2 className="font-serif text-lg text-ink">{dict.settings.theme.heading}</h2>
        </div>
        <p className="text-sm text-ink-light">{dict.settings.theme.description}</p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {THEME_VALUES.map((t) => {
            const info = dict.settings.theme[t.value];
            return (
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
                  <span className="text-sm font-medium">{info.label}</span>
                  {theme === t.value && <Check size={16} className="text-sage-500" />}
                </div>
                <p className="mt-1 text-xs text-ink-light">{info.blurb}</p>
              </button>
            );
          })}
        </div>
        {themeError && <p className="text-xs text-red-500">{themeError}</p>}
      </div>

      {/* Language */}
      <div className="card space-y-3">
        <div className="flex items-center gap-2">
          <Languages size={18} className="text-sage-500" />
          <h2 className="font-serif text-lg text-ink">{dict.settings.language.heading}</h2>
        </div>
        <p className="text-sm text-ink-light">{dict.settings.language.description}</p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {LOCALE_VALUES.map((value) => {
            const info = dict.settings.language[value];
            return (
              <button
                key={value}
                onClick={() => saveLocale(value)}
                className={cn(
                  "rounded-2xl border-2 p-3 text-left transition",
                  locale === value ? "border-sage-400 shadow-soft" : "border-cream-300 hover:border-sage-200"
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{info.label}</span>
                  {locale === value && <Check size={16} className="text-sage-500" />}
                </div>
                <p className="mt-1 text-xs text-ink-light">{info.blurb}</p>
              </button>
            );
          })}
        </div>
        {localeError && <p className="text-xs text-red-500">{localeError}</p>}
      </div>
    </div>
  );
}
