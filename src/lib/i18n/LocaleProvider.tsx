"use client";

import { createContext, useContext, useMemo, useState } from "react";
import { getDictionary, type Dictionary, type Locale } from "./dictionaries";

type LocaleContextValue = {
  locale: Locale;
  dict: Dictionary;
  setLocale: (locale: Locale) => void;
};

const LocaleContext = createContext<LocaleContextValue | null>(null);

export function LocaleProvider({
  initialLocale,
  children,
}: {
  initialLocale: Locale;
  children: React.ReactNode;
}) {
  const [locale, setLocale] = useState<Locale>(initialLocale);
  const value = useMemo<LocaleContextValue>(
    () => ({ locale, dict: getDictionary(locale), setLocale }),
    [locale]
  );

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

/**
 * Client-side hook for reading the current locale's translations. Falls back
 * to the English dictionary (with a no-op setter) if used outside a
 * `LocaleProvider` — this keeps components usable in isolation/tests.
 */
export function useTranslation(): LocaleContextValue {
  const ctx = useContext(LocaleContext);
  if (ctx) return ctx;
  return { locale: "en", dict: getDictionary("en"), setLocale: () => {} };
}
