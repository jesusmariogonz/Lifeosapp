import { fromZonedTime, toZonedTime } from "date-fns-tz";
import { prisma } from "@/lib/prisma";

export const DEFAULT_TIMEZONE = "UTC";

/**
 * Look up a user's stored IANA timezone, falling back to UTC if unset/invalid.
 */
export async function getUserTimezone(userId: string): Promise<string> {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { timezone: true } });
  return isValidTimeZone(user?.timezone) ? (user!.timezone as string) : DEFAULT_TIMEZONE;
}

export function isValidTimeZone(tz?: string | null): boolean {
  if (!tz) return false;
  try {
    Intl.DateTimeFormat(undefined, { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

/**
 * Returns the user's local calendar date (YYYY-MM-DD) for a given instant, in their timezone.
 * Example: a user in America/Mexico_City at 11pm local on Sept 12 has a UTC instant of
 * Sept 13 05:00 — this returns "2026-09-12", the correct local calendar date.
 */
export function localDateString(instant: Date, timeZone: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(instant);
}

/**
 * Converts a local calendar date (YYYY-MM-DD) in the given timezone to the UTC Date
 * instant representing local midnight (00:00:00) of that day.
 */
export function localMidnightUtc(dateStr: string, timeZone: string): Date {
  return fromZonedTime(`${dateStr}T00:00:00`, timeZone);
}

/**
 * Given an instant and a user's timezone, returns the UTC Date range [start, end)
 * covering "today" (local calendar day) for that user — start is local midnight
 * today (as a UTC instant), end is local midnight tomorrow.
 */
export function localDayRangeUtc(timeZone: string, instant: Date = new Date()): { start: Date; end: Date; dateStr: string } {
  const dateStr = localDateString(instant, timeZone);
  const start = localMidnightUtc(dateStr, timeZone);
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
  return { start, end, dateStr };
}

/**
 * Converts an arbitrary instant to a UTC Date representing local midnight of that
 * instant's calendar day in the given timezone — the timezone-aware analog of the
 * old `toDateOnly` (which used server/UTC local time via setHours(0,0,0,0)).
 */
export function toDateOnlyInTimeZone(instant: Date, timeZone: string): Date {
  const dateStr = localDateString(instant, timeZone);
  return localMidnightUtc(dateStr, timeZone);
}

/**
 * Start of the ISO (Monday-based) week containing `instant`, in the given timezone,
 * returned as the UTC instant of local midnight that Monday.
 */
export function startOfWeekMondayInTimeZone(instant: Date, timeZone: string): Date {
  const zoned = toZonedTime(instant, timeZone);
  const day = zoned.getDay(); // 0=Sun..6=Sat, in the zoned wall-clock representation
  const diff = (day === 0 ? -6 : 1) - day;
  const zonedMonday = new Date(zoned);
  zonedMonday.setDate(zonedMonday.getDate() + diff);
  const dateStr = `${zonedMonday.getFullYear()}-${String(zonedMonday.getMonth() + 1).padStart(2, "0")}-${String(
    zonedMonday.getDate()
  ).padStart(2, "0")}`;
  return localMidnightUtc(dateStr, timeZone);
}
