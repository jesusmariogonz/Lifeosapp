import en from "./en";
import es from "./es";

export type Locale = "en" | "es";
export type Dictionary = typeof en;

export const SUPPORTED_LOCALES: Locale[] = ["en", "es"];
export const DEFAULT_LOCALE: Locale = "en";

const dictionaries: Record<Locale, Dictionary> = { en, es };

export function isValidLocale(value?: string | null): value is Locale {
  return !!value && (SUPPORTED_LOCALES as string[]).includes(value);
}

/**
 * Returns the dictionary for a given locale, falling back to the default
 * (English) locale for anything unrecognized. Usable from both server
 * components (e.g. `getDictionary(await getUserLocale(userId))`) and client
 * code (via the `useTranslation` hook, which wraps this).
 */
export function getDictionary(locale?: string | null): Dictionary {
  return dictionaries[isValidLocale(locale) ? locale : DEFAULT_LOCALE];
}

export default dictionaries;
