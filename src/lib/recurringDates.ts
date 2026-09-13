// Shared helper for recurring yearly dates (Contact important dates, user birthday, etc.)
// Given a month/day, returns the next occurrence on/after `from` — rolling to
// next year if this year's occurrence has already passed.
export function nextOccurrence(monthDay: { month: number; day: number }, from: Date): Date {
  const next = new Date(from.getFullYear(), monthDay.month, monthDay.day);
  if (next < from) next.setFullYear(next.getFullYear() + 1);
  return next;
}

// Convenience wrapper for callers that have a Date to pull month/day off of
// (e.g. a stored DateTime column) rather than raw numbers.
export function nextOccurrenceOf(original: Date, from: Date): Date {
  return nextOccurrence({ month: original.getMonth(), day: original.getDate() }, from);
}
