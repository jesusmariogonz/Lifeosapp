"use client";

import { useQuery } from "@tanstack/react-query";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { apiFetch } from "@/lib/api";
import { format } from "date-fns";

type Analytics = {
  habitWeeks: { weekStart: string; percent: number }[];
  taskWeeks: { weekStart: string; created: number; completed: number }[];
  wellnessTrend: { date: string; sleepHours: number | null; energy: number | null; stress: number | null }[];
  financeMonths: { month: string; income: number; expenses: number }[];
  spendingByCategory: { category: string; amount: number }[];
  moodTrend: { date: string; mood: number; energy: number; stress: number }[];
  correlations: {
    avgMoodOnHabitDays: number | null;
    avgMoodOnNonHabitDays: number | null;
    habitDaysSampled: number;
    nonHabitDaysSampled: number;
    avgSleep: number | null;
    avgStress: number | null;
    stressOnLowSleepDays: number | null;
    stressOnHighSleepDays: number | null;
  };
};

const SAGE = "#728565";
const SAGE_LIGHT = "#aebd97";
const SAGE_DARK = "#485440";
const AMBER = "#c99a4b";
const PIE_COLORS = ["#728565", "#aebd97", "#c99a4b", "#8a9a7e", "#5b6b50", "#e3e9da", "#485440"];

function ChartCard({ title, children, empty }: { title: string; children: React.ReactNode; empty?: boolean }) {
  return (
    <div className="card">
      <h2 className="mb-4 font-serif text-lg text-ink">{title}</h2>
      {empty ? <p className="text-sm text-ink-light">Not enough data yet.</p> : <div className="h-64 w-full">{children}</div>}
    </div>
  );
}

const tooltipStyle = {
  borderRadius: 12,
  border: "1px solid #eae3d0",
  background: "#fdfcfa",
  fontSize: 12,
};

export default function AnalyticsClient() {
  const { data, isLoading } = useQuery<Analytics>({
    queryKey: ["analytics"],
    queryFn: () => apiFetch("/api/analytics"),
  });

  if (isLoading || !data) {
    return <p className="text-sm text-ink-light">Loading analytics...</p>;
  }

  const { habitWeeks, taskWeeks, wellnessTrend, financeMonths, spendingByCategory, moodTrend, correlations } = data;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <ChartCard title="Habit completion trend (weekly %)" empty={habitWeeks.every((w) => w.percent === 0)}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={habitWeeks} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eae3d0" />
              <XAxis dataKey="weekStart" tickFormatter={(d) => format(new Date(d), "MMM d")} tick={{ fontSize: 11, fill: "#6b6558" }} />
              <YAxis tick={{ fontSize: 11, fill: "#6b6558" }} domain={[0, 100]} unit="%" />
              <Tooltip contentStyle={tooltipStyle} labelFormatter={(d: any) => format(new Date(d), "MMM d, yyyy")} />
              <Line type="monotone" dataKey="percent" stroke={SAGE} strokeWidth={2.5} dot={false} name="Completed" />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Task velocity (created vs completed / week)" empty={taskWeeks.every((w) => w.created === 0 && w.completed === 0)}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={taskWeeks} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eae3d0" />
              <XAxis dataKey="weekStart" tickFormatter={(d) => format(new Date(d), "MMM d")} tick={{ fontSize: 11, fill: "#6b6558" }} />
              <YAxis tick={{ fontSize: 11, fill: "#6b6558" }} allowDecimals={false} />
              <Tooltip contentStyle={tooltipStyle} labelFormatter={(d: any) => format(new Date(d), "MMM d, yyyy")} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="created" fill={SAGE_LIGHT} radius={[4, 4, 0, 0]} name="Created" />
              <Bar dataKey="completed" fill={SAGE} radius={[4, 4, 0, 0]} name="Completed" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Wellness trend (last 30 days)" empty={wellnessTrend.length === 0}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={wellnessTrend} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eae3d0" />
              <XAxis dataKey="date" tickFormatter={(d) => format(new Date(d), "MMM d")} tick={{ fontSize: 11, fill: "#6b6558" }} />
              <YAxis tick={{ fontSize: 11, fill: "#6b6558" }} />
              <Tooltip contentStyle={tooltipStyle} labelFormatter={(d: any) => format(new Date(d), "MMM d, yyyy")} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Line type="monotone" dataKey="sleepHours" stroke={SAGE} strokeWidth={2} dot={false} name="Sleep (hrs)" connectNulls />
              <Line type="monotone" dataKey="energy" stroke={AMBER} strokeWidth={2} dot={false} name="Energy" connectNulls />
              <Line type="monotone" dataKey="stress" stroke={SAGE_DARK} strokeWidth={2} dot={false} name="Stress" connectNulls />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Mood trend (journal)" empty={moodTrend.length === 0}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={moodTrend} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eae3d0" />
              <XAxis dataKey="date" tickFormatter={(d) => format(new Date(d), "MMM d")} tick={{ fontSize: 11, fill: "#6b6558" }} />
              <YAxis tick={{ fontSize: 11, fill: "#6b6558" }} domain={[1, 5]} />
              <Tooltip contentStyle={tooltipStyle} labelFormatter={(d: any) => format(new Date(d), "MMM d, yyyy")} />
              <Line type="monotone" dataKey="mood" stroke={SAGE} strokeWidth={2.5} dot={{ r: 3 }} name="Mood (1-5)" />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Income vs expenses (last 6 months)" empty={financeMonths.every((m) => m.income === 0 && m.expenses === 0)}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={financeMonths} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eae3d0" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#6b6558" }} />
              <YAxis tick={{ fontSize: 11, fill: "#6b6558" }} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v: any) => `$${Number(v).toLocaleString()}`} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="income" fill={SAGE} radius={[4, 4, 0, 0]} name="Income" />
              <Bar dataKey="expenses" fill={AMBER} radius={[4, 4, 0, 0]} name="Expenses" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Spending by category" empty={spendingByCategory.length === 0}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={spendingByCategory} dataKey="amount" nameKey="category" innerRadius={55} outerRadius={90} paddingAngle={2}>
                {spendingByCategory.map((_, i) => (
                  <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={tooltipStyle} formatter={(v: any) => `$${Number(v).toLocaleString()}`} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <div className="card">
        <h2 className="mb-1 font-serif text-lg text-ink">Correlations</h2>
        <p className="mb-4 text-xs text-ink-light">
          Simple observations from your own data — not judgments, just patterns worth noticing.
        </p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="rounded-xl bg-sage-50 p-4">
            <p className="text-sm text-ink">
              {correlations.avgMoodOnHabitDays != null && correlations.avgMoodOnNonHabitDays != null ? (
                <>
                  Average mood was <strong>{correlations.avgMoodOnHabitDays}</strong> on days with a completed habit,
                  vs <strong>{correlations.avgMoodOnNonHabitDays}</strong> on days without.
                </>
              ) : (
                "Log more habits and journal entries to see this pattern."
              )}
            </p>
            <p className="mt-1 text-xs text-ink-light">
              Based on {correlations.habitDaysSampled} habit-day{correlations.habitDaysSampled === 1 ? "" : "s"} and{" "}
              {correlations.nonHabitDaysSampled} non-habit day{correlations.nonHabitDaysSampled === 1 ? "" : "s"} with journal entries.
            </p>
          </div>
          <div className="rounded-xl bg-sage-50 p-4">
            <p className="text-sm text-ink">
              {correlations.stressOnLowSleepDays != null && correlations.stressOnHighSleepDays != null ? (
                <>
                  On your lower-sleep days, average stress was <strong>{correlations.stressOnLowSleepDays}</strong>; on
                  higher-sleep days it was <strong>{correlations.stressOnHighSleepDays}</strong>.
                </>
              ) : (
                "Log more sleep and stress in Wellness to see this pattern."
              )}
            </p>
            <p className="mt-1 text-xs text-ink-light">
              Overall averages: {correlations.avgSleep ?? "—"}h sleep, stress {correlations.avgStress ?? "—"}/10 (last 30 days).
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
