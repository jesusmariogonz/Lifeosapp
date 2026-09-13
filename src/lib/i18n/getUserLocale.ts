import { prisma } from "@/lib/prisma";
import { DEFAULT_LOCALE, isValidLocale, type Locale } from "./dictionaries";

/**
 * Look up a user's stored UI locale, falling back to English if unset/invalid.
 * Mirrors the pattern of `getUserTimezone` in `@/lib/tz`.
 */
export async function getUserLocale(userId: string): Promise<Locale> {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { locale: true } });
  return isValidLocale(user?.locale) ? (user!.locale as Locale) : DEFAULT_LOCALE;
}
