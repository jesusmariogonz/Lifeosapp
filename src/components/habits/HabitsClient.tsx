"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format, subDays } from "date-fns";
import { Plus, Trash2, Flame } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { cn, toDateOnly } from "@/lib/utils";

type HabitLog = { id: string; date: string; completed: boolean };
type Habit = { id: string; name: string; frequency: string; targetPerWeek: number | null; logs: HabitLog[] };

function calcStreak(logs: HabitLog[]): number {
  const dates = new Set(logs.filter((l) => l.completed).map((l) => toDateOnly(new Date(l.date)).getTime()));
  let streak = 0;
  let cursor = toDateOnly(new Date());
  while (dates.has(cursor.getTime())) {
    streak++;
    cursor = subDays(cursor, 1);
  }
  return streak;
}

export default function HabitsClient() {
  const queryClient = useQueryClient();
  const { data: habits, isLoading } = useQuery<Habit[]>({
    queryKey: ["habits"],
    queryFn: () => apiFetch("/api/habits"),
  });

  const [name, setName] = useState("");
  const [frequency, setFrequency] = useState("DAILY");

  const createHabit = useMutation({
    mutationFn: () => apiFetch("/api/habits", { method: "POST", body: JSON.stringify({ name, frequency }) }),
    onSuccess: () => {
      setName("");
      queryClient.invalidateQueries({ queryKey: ["habits"] });
    },
  });

  const deleteHabit = useMutation({
    mutationFn: (id: string) => apiFetch(`/api/habits/${id}`, { method: "DELETE" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["habits"] }),
  });

  const toggleLog = useMutation({
    mutationFn: (habitId: string) => apiFetch("/api/habits/log", { method: "POST", body: JSON.stringify({ habitId }) }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["habits"] }),
  });

  const todayKey = toDateOnly(new Date()).getTime();

  return (
    <div className="space-y-5">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (name.trim()) createHabit.mutate();
        }}
        className="card flex flex-col gap-3 md:flex-row md:items-end"
      >
        <div className="flex-1">
          <label className="label">New habit</label>
          <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Drink water" />
        </div>
        <div>
          <label className="label">Frequency</label>
          <select className="input" value={frequency} onChange={(e) => setFrequency(e.target.value)}>
            <option value="DAILY">Daily</option>
            <option value="WEEKLY">Weekly</option>
            <option value="X_PER_WEEK">X per week</option>
          </select>
        </div>
        <button type="submit" className="btn-primary">
          <Plus size={16} /> Add
        </button>
      </form>

      {isLoading ? (
        <p className="text-sm text-ink-light">Loading habits...</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {(habits || []).map((h) => {
            const doneToday = h.logs.some(
              (l) => toDateOnly(new Date(l.date)).getTime() === todayKey && l.completed
            );
            const streak = calcStreak(h.logs);
            const last7 = Array.from({ length: 7 }).map((_, i) => {
              const d = subDays(new Date(), 6 - i);
              const key = toDateOnly(d).getTime();
              const done = h.logs.some((l) => toDateOnly(new Date(l.date)).getTime() === key && l.completed);
              return { d, done };
            });
            return (
              <div key={h.id} className="card">
                <div className="mb-2 flex items-center justify-between">
                  <div>
                    <p className="font-medium">{h.name}</p>
                    <p className="text-xs text-ink-light">{h.frequency.replace("_", " ").toLowerCase()}</p>
                  </div>
                  <button onClick={() => deleteHabit.mutate(h.id)} className="text-ink-light hover:text-red-500">
                    <Trash2 size={16} />
                  </button>
                </div>
                <div className="mb-3 flex items-center gap-1 text-sm text-sage-600">
                  <Flame size={16} /> {streak} day streak
                </div>
                <div className="flex items-center gap-2">
                  {last7.map(({ d, done }, i) => (
                    <div key={i} className="flex flex-col items-center gap-1">
                      <span className="text-[10px] text-ink-light">{format(d, "EEEEE")}</span>
                      <div
                        className={cn(
                          "h-5 w-5 rounded-full border-2",
                          done ? "border-sage-400 bg-sage-400" : "border-cream-300"
                        )}
                      />
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => toggleLog.mutate(h.id)}
                  className={cn("btn-secondary mt-3 w-full", doneToday && "bg-sage-100 text-sage-600")}
                >
                  {doneToday ? "Marked done today" : "Mark done today"}
                </button>
              </div>
            );
          })}
          {(habits || []).length === 0 && <p className="text-sm text-ink-light">No habits yet.</p>}
        </div>
      )}
    </div>
  );
}
