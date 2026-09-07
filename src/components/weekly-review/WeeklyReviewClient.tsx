"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { apiFetch } from "@/lib/api";
import { startOfWeekMonday } from "@/lib/utils";

type Review = {
  id: string;
  weekStart: string;
  tasksCompleted: number;
  habitsPercent: number;
  wentWell: string | null;
  improve: string | null;
  nextPriority: string | null;
};

// V3: AI planning assistant hook (past reviews are the training signal for a future planner)
export default function WeeklyReviewClient() {
  const queryClient = useQueryClient();
  const { data: reviews, isLoading } = useQuery<Review[]>({
    queryKey: ["weekly-review"],
    queryFn: () => apiFetch("/api/weekly-review"),
  });

  const [tasksCompleted, setTasksCompleted] = useState("");
  const [habitsPercent, setHabitsPercent] = useState("");
  const [wentWell, setWentWell] = useState("");
  const [improve, setImprove] = useState("");
  const [nextPriority, setNextPriority] = useState("");

  const saveReview = useMutation({
    mutationFn: () =>
      apiFetch("/api/weekly-review", {
        method: "POST",
        body: JSON.stringify({
          weekStart: startOfWeekMonday(new Date()),
          tasksCompleted: Number(tasksCompleted) || 0,
          habitsPercent: Number(habitsPercent) || 0,
          wentWell,
          improve,
          nextPriority,
        }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["weekly-review"] });
    },
  });

  return (
    <div className="space-y-5">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          saveReview.mutate();
        }}
        className="card space-y-3"
      >
        <p className="text-sm text-ink-light">
          Week of {format(startOfWeekMonday(new Date()), "MMM d, yyyy")}
        </p>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Tasks completed</label>
            <input className="input" type="number" value={tasksCompleted} onChange={(e) => setTasksCompleted(e.target.value)} />
          </div>
          <div>
            <label className="label">Habits completed (%)</label>
            <input className="input" type="number" value={habitsPercent} onChange={(e) => setHabitsPercent(e.target.value)} />
          </div>
        </div>
        <div>
          <label className="label">What went well?</label>
          <textarea className="input" value={wentWell} onChange={(e) => setWentWell(e.target.value)} />
        </div>
        <div>
          <label className="label">What to improve?</label>
          <textarea className="input" value={improve} onChange={(e) => setImprove(e.target.value)} />
        </div>
        <div>
          <label className="label">Next week's top priority</label>
          <input className="input" value={nextPriority} onChange={(e) => setNextPriority(e.target.value)} />
        </div>
        <button type="submit" className="btn-primary">
          Save weekly review
        </button>
      </form>

      <div className="space-y-3">
        {isLoading && <p className="text-sm text-ink-light">Loading...</p>}
        {(reviews || []).map((r) => (
          <div key={r.id} className="card">
            <p className="font-medium">Week of {format(new Date(r.weekStart), "MMM d, yyyy")}</p>
            <p className="text-xs text-ink-light">
              {r.tasksCompleted} tasks completed · {r.habitsPercent}% habits
            </p>
            {r.wentWell && <p className="mt-2 text-sm"><strong>Went well:</strong> {r.wentWell}</p>}
            {r.improve && <p className="text-sm"><strong>Improve:</strong> {r.improve}</p>}
            {r.nextPriority && <p className="text-sm"><strong>Next priority:</strong> {r.nextPriority}</p>}
          </div>
        ))}
        {(reviews || []).length === 0 && !isLoading && <p className="text-sm text-ink-light">No reviews yet.</p>}
      </div>
    </div>
  );
}
