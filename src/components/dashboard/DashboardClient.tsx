"use client";

import { useState } from "react";
import Link from "next/link";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { es as esLocale } from "date-fns/locale";
import { Star, CheckCircle2, Circle, Flame, Smile } from "lucide-react";
import { usePrioritiesStore } from "@/store/priorities";
import { apiFetch } from "@/lib/api";
import { cn } from "@/lib/utils";
import WeatherCard from "@/components/dashboard/WeatherCard";
import { useTranslation } from "@/lib/i18n/LocaleProvider";

type Task = { id: string; title: string; completed: boolean; priority: number; dueDate: string | null };
type EventT = { id: string; title: string; startsAt: string; endsAt: string; allDay: boolean; location: string | null };
type Habit = { id: string; name: string };
type HabitLog = { id: string; habitId: string; date: string; completed: boolean };
type Wellness = {
  sleepHours: number | null;
  steps: number | null;
  exerciseMinutes: number | null;
  energy: number | null;
  stress: number | null;
} | null;
type Journal = { mood: number; energy: number; text: string | null } | null;
type UpcomingDate = { label: string; contactName: string | null; next: string };

export default function DashboardClient({
  userName,
  events,
  tasks,
  habits,
  habitLogsToday,
  yesterdayWellness,
  todayJournal,
  upcomingDates,
}: {
  userName: string;
  events: EventT[];
  tasks: Task[];
  habits: Habit[];
  habitLogsToday: HabitLog[];
  yesterdayWellness: Wellness;
  todayJournal: Journal;
  upcomingDates: UpcomingDate[];
}) {
  const { dict, locale } = useTranslation();
  const dateFnsLocale = locale === "es" ? esLocale : undefined;
  const now = new Date();
  const todayKey = format(now, "yyyy-MM-dd");
  // Computed client-side (not passed from the server) so this reflects the
  // viewer's own local time rather than the server's (Vercel runs in UTC).
  const hour = now.getHours();
  const greeting =
    hour < 12 ? dict.dashboard.greetingMorning : hour < 18 ? dict.dashboard.greetingAfternoon : dict.dashboard.greetingEvening;
  const hoursLeft = 24 - hour;
  const { getPriorities, togglePriority } = usePrioritiesStore();
  const priorityIds = getPriorities(todayKey);
  const queryClient = useQueryClient();
  const [completedLocal, setCompletedLocal] = useState<Record<string, boolean>>({});
  const [habitDoneLocal, setHabitDoneLocal] = useState<Record<string, boolean>>(
    Object.fromEntries(habitLogsToday.map((l) => [l.habitId, l.completed]))
  );

  const toggleTask = useMutation({
    mutationFn: (task: Task) =>
      apiFetch(`/api/tasks/${task.id}`, {
        method: "PATCH",
        body: JSON.stringify({ completed: !completedLocal[task.id] && !task.completed }),
      }),
    onMutate: (task) => {
      setCompletedLocal((s) => ({ ...s, [task.id]: !(s[task.id] ?? task.completed) }));
    },
  });

  const toggleHabit = useMutation({
    mutationFn: (habitId: string) =>
      apiFetch("/api/habits/log", { method: "POST", body: JSON.stringify({ habitId }) }),
    onMutate: (habitId) => {
      setHabitDoneLocal((s) => ({ ...s, [habitId]: !s[habitId] }));
    },
  });

  const priorityTasks = tasks.filter((t) => priorityIds.includes(t.id));

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-1">
        <h1 className="font-serif text-3xl text-ink md:text-4xl">
          {greeting}, {userName.split(" ")[0]}
        </h1>
        <p className="text-sm text-ink-light">
          {format(now, "EEEE, MMMM d", { locale: dateFnsLocale })} · {hoursLeft} {dict.dashboard.hoursLeftToday}
        </p>
      </header>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
        <WeatherCard />

        {/* Today's priorities */}
        <div className="card md:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-serif text-lg text-ink">{dict.dashboard.todaysPriorities}</h2>
            <span className="text-xs text-ink-light">
              {priorityIds.length}/3 {dict.dashboard.selected}
            </span>
          </div>
          {priorityTasks.length === 0 ? (
            <p className="text-sm text-ink-light">
              {dict.dashboard.pickPriorities}{" "}
              <Link href="/tasks" className="text-sage-600 underline">
                {dict.dashboard.taskList}
              </Link>
              .
            </p>
          ) : (
            <ul className="space-y-2">
              {priorityTasks.map((t) => (
                <li key={t.id} className="flex items-center gap-2">
                  <Star size={16} className="text-sage-500" fill="currentColor" />
                  <span className={cn(t.completed && "line-through text-ink-light")}>{t.title}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
        {/* Upcoming events */}
        <div className="card">
          <h2 className="mb-3 font-serif text-lg text-ink">{dict.dashboard.upcomingEvents}</h2>
          {events.length === 0 ? (
            <p className="text-sm text-ink-light">{dict.dashboard.noEvents}</p>
          ) : (
            <ul className="space-y-3">
              {events.map((e) => (
                <li key={e.id} className="border-l-2 border-sage-300 pl-3">
                  <p className="text-sm font-medium">{e.title}</p>
                  <p className="text-xs text-ink-light">
                    {e.allDay ? dict.dashboard.allDay : format(new Date(e.startsAt), "MMM d, h:mm a", { locale: dateFnsLocale })}
                  </p>
                </li>
              ))}
            </ul>
          )}
          {upcomingDates.length > 0 && (
            <div className="mt-3 space-y-1 border-t border-cream-300 pt-3">
              <p className="text-xs font-medium uppercase tracking-wide text-ink-light">{dict.dashboard.upcomingDates}</p>
              {upcomingDates.map((d, i) => (
                <p key={i} className="text-xs text-ink-light">
                  {d.label}
                  {d.contactName ? ` — ${d.contactName}` : ""} · {format(new Date(d.next), "MMM d", { locale: dateFnsLocale })}
                </p>
              ))}
            </div>
          )}
          <Link href="/calendar" className="mt-3 inline-block text-xs text-sage-600 underline">
            {dict.dashboard.openCalendar}
          </Link>
        </div>

        {/* Today's tasks */}
        <div className="card">
          <h2 className="mb-3 font-serif text-lg text-ink">{dict.dashboard.todaysTasks}</h2>
          {tasks.length === 0 ? (
            <p className="text-sm text-ink-light">{dict.dashboard.allCaughtUp}</p>
          ) : (
            <ul className="space-y-2">
              {tasks.slice(0, 6).map((t) => {
                const done = completedLocal[t.id] ?? t.completed;
                return (
                  <li key={t.id} className="flex items-center gap-2">
                    <button onClick={() => toggleTask.mutate(t)} className="text-sage-500">
                      {done ? <CheckCircle2 size={18} /> : <Circle size={18} />}
                    </button>
                    <div className="flex flex-1 items-center justify-between gap-2">
                      <span className={cn("text-sm", done && "line-through text-ink-light")}>{t.title}</span>
                      <button
                        onClick={() => togglePriority(todayKey, t.id)}
                        className={cn(
                          "text-ink-light hover:text-sage-500",
                          priorityIds.includes(t.id) && "text-sage-500"
                        )}
                        title="Mark as today's priority"
                      >
                        <Star size={14} fill={priorityIds.includes(t.id) ? "currentColor" : "none"} />
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
          <Link href="/tasks" className="mt-3 inline-block text-xs text-sage-600 underline">
            {dict.dashboard.viewAllTasks}
          </Link>
        </div>

        {/* Today's habits */}
        <div className="card">
          <h2 className="mb-3 font-serif text-lg text-ink">{dict.dashboard.habitTracker}</h2>
          {habits.length === 0 ? (
            <p className="text-sm text-ink-light">{dict.dashboard.noHabitsYet}</p>
          ) : (
            <ul className="space-y-2">
              {habits.map((h) => {
                const done = habitDoneLocal[h.id];
                return (
                  <li key={h.id} className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-sm">
                      <Flame size={14} className={done ? "text-sage-500" : "text-ink-light"} />
                      {h.name}
                    </span>
                    <button
                      onClick={() => toggleHabit.mutate(h.id)}
                      className={cn(
                        "h-6 w-6 rounded-full border-2",
                        done ? "border-sage-400 bg-sage-400" : "border-cream-300"
                      )}
                    />
                  </li>
                );
              })}
            </ul>
          )}
          <Link href="/habits" className="mt-3 inline-block text-xs text-sage-600 underline">
            {dict.dashboard.manageHabits}
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        {/* Yesterday wellness summary */}
        <div className="card">
          <h2 className="mb-3 font-serif text-lg text-ink">{dict.dashboard.yesterdaysWellness}</h2>
          {yesterdayWellness ? (
            <div className="grid grid-cols-2 gap-3 text-sm">
              <p>
                {dict.dashboard.sleep}: {yesterdayWellness.sleepHours ?? "—"}h
              </p>
              <p>
                {dict.dashboard.steps}: {yesterdayWellness.steps ?? "—"}
              </p>
              <p>
                {dict.dashboard.exercise}: {yesterdayWellness.exerciseMinutes ?? "—"} min
              </p>
              <p>
                {dict.dashboard.energy}: {yesterdayWellness.energy ?? "—"}/10
              </p>
            </div>
          ) : (
            <p className="text-sm text-ink-light">{dict.dashboard.noLogYesterday}</p>
          )}
          <Link href="/wellness" className="mt-3 inline-block text-xs text-sage-600 underline">
            {dict.dashboard.logWellness}
          </Link>
        </div>

        {/* Journal / mood quick access */}
        <div className="card">
          <h2 className="mb-3 flex items-center gap-2 font-serif text-lg text-ink">
            <Smile size={18} className="text-sage-500" /> {dict.dashboard.todaysJournal}
          </h2>
          {todayJournal ? (
            <div className="text-sm">
              <p>
                {dict.dashboard.mood}: {todayJournal.mood}/5 · {dict.dashboard.energy}: {todayJournal.energy}/10
              </p>
              {todayJournal.text && <p className="mt-1 text-ink-light line-clamp-2">{todayJournal.text}</p>}
            </div>
          ) : (
            <p className="text-sm text-ink-light">{dict.dashboard.notJournaledToday}</p>
          )}
          <Link href="/journal" className="mt-3 inline-block text-xs text-sage-600 underline">
            {dict.dashboard.openJournal}
          </Link>
        </div>
      </div>
    </div>
  );
}
