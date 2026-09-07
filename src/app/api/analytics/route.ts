import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/session";
import { startOfWeekMonday, toDateOnly } from "@/lib/utils";

// V2: cross-area analytics — real aggregates computed from user data, no mock data
export async function GET() {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const today = toDateOnly(new Date());
  const weeksBack = 10;
  const rangeStart = new Date(today);
  rangeStart.setDate(rangeStart.getDate() - weeksBack * 7);
  const thirtyDaysAgo = new Date(today);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const sixMonthsAgo = new Date(today.getFullYear(), today.getMonth() - 5, 1);

  const [habits, habitLogs, tasks, wellnessLogs, transactions, journalEntries] = await Promise.all([
    prisma.habit.findMany({ where: { userId } }),
    prisma.habitLog.findMany({ where: { habit: { userId }, date: { gte: rangeStart } } }),
    prisma.task.findMany({ where: { userId, createdAt: { gte: rangeStart } } }),
    prisma.wellnessLog.findMany({ where: { userId, date: { gte: thirtyDaysAgo } }, orderBy: { date: "asc" } }),
    prisma.transaction.findMany({ where: { userId, date: { gte: sixMonthsAgo } } }),
    prisma.journalEntry.findMany({ where: { userId, date: { gte: rangeStart } }, orderBy: { date: "asc" } }),
  ]);

  // Habit completion trend: weekly % of possible completions logged
  const habitWeeks: { weekStart: string; percent: number }[] = [];
  for (let i = weeksBack - 1; i >= 0; i--) {
    const ws = startOfWeekMonday(new Date(today.getTime() - i * 7 * 86400000));
    const we = new Date(ws.getTime() + 7 * 86400000);
    const possible = habits.length * 7;
    const completed = habitLogs.filter((l) => l.date >= ws && l.date < we && l.completed).length;
    habitWeeks.push({
      weekStart: ws.toISOString().slice(0, 10),
      percent: possible > 0 ? Math.round((completed / possible) * 100) : 0,
    });
  }

  // Task velocity: completed vs created per week
  const taskWeeks: { weekStart: string; created: number; completed: number }[] = [];
  for (let i = weeksBack - 1; i >= 0; i--) {
    const ws = startOfWeekMonday(new Date(today.getTime() - i * 7 * 86400000));
    const we = new Date(ws.getTime() + 7 * 86400000);
    const created = tasks.filter((t) => t.createdAt >= ws && t.createdAt < we).length;
    const completed = tasks.filter((t) => t.completedAt && t.completedAt >= ws && t.completedAt < we).length;
    taskWeeks.push({ weekStart: ws.toISOString().slice(0, 10), created, completed });
  }

  // Wellness trend (last 30 days)
  const wellnessTrend = wellnessLogs.map((w) => ({
    date: w.date.toISOString().slice(0, 10),
    sleepHours: w.sleepHours,
    energy: w.energy,
    stress: w.stress,
  }));

  // Finance: income vs expenses per month, last 6 months
  const monthKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  const financeMonths: { month: string; income: number; expenses: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const m = new Date(today.getFullYear(), today.getMonth() - i, 1);
    const key = monthKey(m);
    const monthTx = transactions.filter((t) => monthKey(t.date) === key);
    financeMonths.push({
      month: key,
      income: Math.round(monthTx.filter((t) => t.isIncome).reduce((s, t) => s + t.amount, 0) * 100) / 100,
      expenses: Math.round(monthTx.filter((t) => !t.isIncome).reduce((s, t) => s + t.amount, 0) * 100) / 100,
    });
  }

  const categoryMap = new Map<string, number>();
  for (const t of transactions) {
    if (t.isIncome) continue;
    categoryMap.set(t.category, (categoryMap.get(t.category) || 0) + t.amount);
  }
  const spendingByCategory = Array.from(categoryMap.entries())
    .map(([category, amount]) => ({ category, amount: Math.round(amount * 100) / 100 }))
    .sort((a, b) => b.amount - a.amount);

  // Mood trend
  const moodTrend = journalEntries.map((j) => ({
    date: j.date.toISOString().slice(0, 10),
    mood: j.mood,
    energy: j.energy,
    stress: j.stress,
  }));

  // Correlations — simple, honest, observational
  const habitLogDates = new Set(
    habitLogs.filter((l) => l.completed).map((l) => l.date.toISOString().slice(0, 10))
  );
  const journalByDate = new Map(journalEntries.map((j) => [j.date.toISOString().slice(0, 10), j]));
  const moodOnHabitDays: number[] = [];
  const moodOnNonHabitDays: number[] = [];
  for (const [date, j] of journalByDate) {
    if (habitLogDates.has(date)) moodOnHabitDays.push(j.mood);
    else moodOnNonHabitDays.push(j.mood);
  }
  const avg = (arr: number[]) => (arr.length ? Math.round((arr.reduce((s, x) => s + x, 0) / arr.length) * 100) / 100 : null);

  const sleepValues = wellnessLogs.filter((w) => w.sleepHours != null).map((w) => w.sleepHours as number);
  const stressValues = wellnessLogs.filter((w) => w.stress != null).map((w) => w.stress as number);
  const avgSleep = avg(sleepValues);
  const avgStress = avg(stressValues);

  // sleep vs stress: split days into "lower sleep" / "higher sleep" halves by median, compare avg stress
  const sleepDays = wellnessLogs.filter((w) => w.sleepHours != null && w.stress != null);
  let stressOnLowSleep: number | null = null;
  let stressOnHighSleep: number | null = null;
  if (sleepDays.length >= 4) {
    const sorted = [...sleepDays].sort((a, b) => (a.sleepHours as number) - (b.sleepHours as number));
    const mid = Math.floor(sorted.length / 2);
    stressOnLowSleep = avg(sorted.slice(0, mid).map((w) => w.stress as number));
    stressOnHighSleep = avg(sorted.slice(mid).map((w) => w.stress as number));
  }

  const correlations = {
    avgMoodOnHabitDays: avg(moodOnHabitDays),
    avgMoodOnNonHabitDays: avg(moodOnNonHabitDays),
    habitDaysSampled: moodOnHabitDays.length,
    nonHabitDaysSampled: moodOnNonHabitDays.length,
    avgSleep,
    avgStress,
    stressOnLowSleepDays: stressOnLowSleep,
    stressOnHighSleepDays: stressOnHighSleep,
  };

  return NextResponse.json({
    habitWeeks,
    taskWeeks,
    wellnessTrend,
    financeMonths,
    spendingByCategory,
    moodTrend,
    correlations,
  });
}
