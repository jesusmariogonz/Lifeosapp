"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2 } from "lucide-react";
import { apiFetch } from "@/lib/api";

type Objective = { id: string; title: string; description: string | null };
type Goal = { id: string; title: string; description: string | null; vision: string | null; objectives: Objective[] };

export default function GoalsClient() {
  const queryClient = useQueryClient();
  const { data: goals, isLoading } = useQuery<Goal[]>({ queryKey: ["goals"], queryFn: () => apiFetch("/api/goals") });

  const [title, setTitle] = useState("");
  const [vision, setVision] = useState("");

  const createGoal = useMutation({
    mutationFn: () => apiFetch("/api/goals", { method: "POST", body: JSON.stringify({ title, vision }) }),
    onSuccess: () => {
      setTitle("");
      setVision("");
      queryClient.invalidateQueries({ queryKey: ["goals"] });
    },
  });

  const deleteGoal = useMutation({
    mutationFn: (id: string) => apiFetch(`/api/goals/${id}`, { method: "DELETE" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["goals"] }),
  });

  const [objectiveDrafts, setObjectiveDrafts] = useState<Record<string, string>>({});

  const createObjective = useMutation({
    mutationFn: (goalId: string) =>
      apiFetch("/api/objectives", {
        method: "POST",
        body: JSON.stringify({ goalId, title: objectiveDrafts[goalId] }),
      }),
    onSuccess: (_data, goalId) => {
      setObjectiveDrafts((s) => ({ ...s, [goalId]: "" }));
      queryClient.invalidateQueries({ queryKey: ["goals"] });
    },
  });

  return (
    <div className="space-y-5">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (title.trim()) createGoal.mutate();
        }}
        className="card flex flex-col gap-3 md:flex-row md:items-end"
      >
        <div className="flex-1">
          <label className="label">New goal</label>
          <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Run a marathon" />
        </div>
        <div className="flex-1">
          <label className="label">Vision (optional)</label>
          <input className="input" value={vision} onChange={(e) => setVision(e.target.value)} placeholder="Why does this matter?" />
        </div>
        <button type="submit" className="btn-primary">
          <Plus size={16} /> Add goal
        </button>
      </form>

      {isLoading ? (
        <p className="text-sm text-ink-light">Loading goals...</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {(goals || []).map((g) => (
            <div key={g.id} className="card">
              <div className="mb-2 flex items-start justify-between">
                <div>
                  <p className="font-serif text-lg">{g.title}</p>
                  {g.vision && <p className="text-xs italic text-ink-light">{g.vision}</p>}
                </div>
                <button onClick={() => deleteGoal.mutate(g.id)} className="text-ink-light hover:text-red-500">
                  <Trash2 size={16} />
                </button>
              </div>
              <ul className="mb-2 space-y-1">
                {g.objectives.map((o) => (
                  <li key={o.id} className="text-sm text-ink-light">
                    • {o.title}
                  </li>
                ))}
              </ul>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (objectiveDrafts[g.id]?.trim()) createObjective.mutate(g.id);
                }}
                className="flex gap-2"
              >
                <input
                  className="input"
                  placeholder="Add objective"
                  value={objectiveDrafts[g.id] || ""}
                  onChange={(e) => setObjectiveDrafts((s) => ({ ...s, [g.id]: e.target.value }))}
                />
                <button type="submit" className="btn-secondary px-3">
                  <Plus size={14} />
                </button>
              </form>
            </div>
          ))}
          {(goals || []).length === 0 && <p className="text-sm text-ink-light">No goals yet.</p>}
        </div>
      )}
    </div>
  );
}
