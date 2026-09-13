"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { CheckCircle2, Circle, Trash2, Plus } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { cn, dateOnlyToLocal } from "@/lib/utils";

type Task = {
  id: string;
  title: string;
  notes: string | null;
  dueDate: string | null;
  completed: boolean;
  priority: number;
};

export default function TasksClient() {
  const queryClient = useQueryClient();
  const { data: tasks, isLoading } = useQuery<Task[]>({
    queryKey: ["tasks"],
    queryFn: () => apiFetch("/api/tasks"),
  });

  const [title, setTitle] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [priority, setPriority] = useState(2);

  const createTask = useMutation({
    mutationFn: () =>
      apiFetch("/api/tasks", {
        method: "POST",
        body: JSON.stringify({ title, dueDate: dueDate || null, priority }),
      }),
    onSuccess: () => {
      setTitle("");
      setDueDate("");
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });

  const toggleTask = useMutation({
    mutationFn: (task: Task) =>
      apiFetch(`/api/tasks/${task.id}`, {
        method: "PATCH",
        body: JSON.stringify({ completed: !task.completed }),
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["tasks"] }),
  });

  const postponeTask = useMutation({
    mutationFn: (task: Task) => {
      const base = task.dueDate ? new Date(task.dueDate) : new Date();
      base.setDate(base.getDate() + 1);
      return apiFetch(`/api/tasks/${task.id}`, {
        method: "PATCH",
        body: JSON.stringify({ dueDate: base.toISOString() }),
      });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["tasks"] }),
  });

  const deleteTask = useMutation({
    mutationFn: (id: string) => apiFetch(`/api/tasks/${id}`, { method: "DELETE" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["tasks"] }),
  });

  return (
    <div className="space-y-5">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (title.trim()) createTask.mutate();
        }}
        className="card flex flex-col gap-3 md:flex-row md:items-end"
      >
        <div className="flex-1">
          <label className="label">New task</label>
          <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Do something..." />
        </div>
        <div>
          <label className="label">Due date</label>
          <input className="input" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
        </div>
        <div>
          <label className="label">Priority</label>
          <select className="input" value={priority} onChange={(e) => setPriority(Number(e.target.value))}>
            <option value={1}>High</option>
            <option value={2}>Medium</option>
            <option value={3}>Low</option>
          </select>
        </div>
        <button type="submit" className="btn-primary">
          <Plus size={16} /> Add
        </button>
      </form>

      {isLoading ? (
        <p className="text-sm text-ink-light">Loading tasks...</p>
      ) : (
        <div className="card">
          <ul className="divide-y divide-cream-300">
            {(tasks || []).map((t) => (
              <li key={t.id} className="flex items-center gap-3 py-3">
                <button onClick={() => toggleTask.mutate(t)} className="text-sage-500 shrink-0">
                  {t.completed ? <CheckCircle2 size={20} /> : <Circle size={20} />}
                </button>
                <div className="flex-1">
                  <p className={cn("text-sm font-medium", t.completed && "line-through text-ink-light")}>
                    {t.title}
                  </p>
                  <p className="text-xs text-ink-light">
                    {t.dueDate ? format(dateOnlyToLocal(t.dueDate), "MMM d") : "No due date"} ·{" "}
                    {t.priority === 1 ? "High" : t.priority === 2 ? "Medium" : "Low"}
                  </p>
                </div>
                <button onClick={() => postponeTask.mutate(t)} className="btn-secondary text-xs px-2 py-1">
                  Postpone
                </button>
                <button onClick={() => deleteTask.mutate(t.id)} className="text-ink-light hover:text-red-500">
                  <Trash2 size={16} />
                </button>
              </li>
            ))}
            {(tasks || []).length === 0 && <p className="py-4 text-sm text-ink-light">No tasks yet.</p>}
          </ul>
        </div>
      )}
    </div>
  );
}
