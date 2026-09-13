import { clsx, type ClassValue } from "clsx";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function startOfWeekMonday(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = (day === 0 ? -6 : 1) - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function toDateOnly(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

// Date-only values (e.g. Task.dueDate, User.birthday) are stored as midnight
// UTC ("YYYY-MM-DD" from a <input type="date"> parses that way). Reading
// them with local getters shifts the calendar date for any viewer west of
// UTC. This rebuilds the same calendar date as a *local* midnight Date so it
// compares correctly against locally-constructed day cells (isSameDay, etc.)
// and formats correctly with date-fns.
export function dateOnlyToLocal(value: string | Date): Date {
  const d = typeof value === "string" ? new Date(value) : value;
  return new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
}
