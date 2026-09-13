"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, CheckCircle2, Circle, Pencil, X } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { cn } from "@/lib/utils";

type Objective = { id: string; title: string; description: string | null; completed: boolean };
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

  const toggleObjective = useMutation({
    mutationFn: (o: Objective) =>
      apiFetch(`/api/objectives/${o.id}`, { method: "PATCH", body: JSON.stringify({ completed: !o.completed }) }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["goals"] }),
  });

  const [editingObjective, setEditingObjective] = useState<Objective | null>(null);

  const editObjective = useMutation({
    mutationFn: (vars: { id: string; title: string; description: string | null }) =>
      apiFetch(`/api/objectives/${vars.id}`, {
        method: "PATCH",
        body: JSON.stringify({ title: vars.title, description: vars.description }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["goals"] });
      setEditingObjective(null);
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
                  <li key={o.id} className="flex items-center gap-2 text-sm">
                    <button onClick={() => toggleObjective.mutate(o)} className="shrink-0 text-sage-500">
                      {o.completed ? <CheckCircle2 size={16} /> : <Circle size={16} />}
                    </button>
                    <span className={cn("flex-1", o.completed ? "text-ink-light line-through" : "text-ink-light")}>
                      {o.title}
                    </span>
                    <button
                      onClick={() => setEditingObjective(o)}
                      className="shrink-0 text-ink-light hover:text-sage-600"
                      aria-label="Edit objective"
                    >
                      <Pencil size={14} />
                    </button>
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

      {editingObjective && (
        <EditObjectiveModal
          objective={editingObjective}
          onClose={() => setEditingObjective(null)}
          onSave={(vars) => editObjective.mutate(vars)}
          isSaving={editObjective.isPending}
        />
      )}
    </div>
  );
}

function EditObjectiveModal({
  objective,
  onClose,
  onSave,
  isSaving,
}: {
  objective: Objective;
  onClose: () => void;
  onSave: (vars: { id: string; title: string; description: string | null }) => void;
  isSaving: boolean;
}) {
  const [title, setTitle] = useState(objective.title);
  const [description, setDescription] = useState(objective.description ?? "");

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-ink/30 sm:items-center sm:px-4" onClick={onClose}>
      <div className="card w-full max-w-sm rounded-b-none sm:rounded-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-serif text-lg">Edit objective</h3>
          <button onClick={onClose} aria-label="Cancel">
            <X size={18} />
          </button>
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (title.trim()) onSave({ id: objective.id, title, description: description || null });
          }}
          className="space-y-3"
        >
          <div>
            <label className="label">Title</label>
            <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} required />
          </div>
          <div>
            <label className="label">Description (optional)</label>
            <input className="input" value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={isSaving}>
              Save changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
