// Recurring tasks are modeled as a *template*: creating one immediately
// generates concrete Task rows with real dueDates for a rolling window,
// rather than virtually expanding an abstract rule at read time. This keeps
// Dashboard/Calendar/Analytics working unchanged since they already just
// query real Task rows with real dueDates.
//
// A scheduled job to extend the window further out as it runs low would be
// a reasonable future improvement, but generating a generous window (12
// weeks) upfront is sufficient for this MVP scope.

export type Recurrence = "DAILY" | "WEEKLY" | "WEEKDAYS" | "CUSTOM";

export const RECURRENCE_WINDOW_WEEKS = 12;

// Day-of-week numbers use JS Date's getUTCDay() convention: 0=Sunday .. 6=Saturday.
const WEEKDAY_DAYS = [1, 2, 3, 4, 5]; // Mon-Fri

/**
 * Given an anchor date (the task's own dueDate, stored as UTC midnight —
 * see dateOnlyToLocal/toDateOnly conventions elsewhere in the app) and a
 * recurrence rule, returns every concrete date the series should occupy
 * within the rolling window, inclusive of the anchor date itself.
 *
 * Dates are walked one UTC day at a time (rather than doing date math in
 * local time) so there's no DST/timezone drift — everything here operates
 * on UTC-midnight Date objects.
 */
export function generateRecurrenceDates(
  anchor: Date,
  recurrence: Recurrence,
  recurrenceDays: number[]
): Date[] {
  const dates: Date[] = [];
  const dayMs = 24 * 60 * 60 * 1000;
  const endTime = anchor.getTime() + RECURRENCE_WINDOW_WEEKS * 7 * dayMs;

  let allowedDays: number[] | null = null; // null = every day (DAILY)
  if (recurrence === "WEEKLY") allowedDays = [anchor.getUTCDay()];
  else if (recurrence === "WEEKDAYS") allowedDays = WEEKDAY_DAYS;
  else if (recurrence === "CUSTOM") {
    allowedDays = recurrenceDays && recurrenceDays.length > 0 ? recurrenceDays : [anchor.getUTCDay()];
  }

  for (let t = anchor.getTime(); t <= endTime; t += dayMs) {
    const day = new Date(t);
    if (allowedDays === null || allowedDays.includes(day.getUTCDay())) {
      dates.push(day);
    }
  }

  return dates;
}
