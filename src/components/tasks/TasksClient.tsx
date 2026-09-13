"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { CheckCircle2, Circle, Trash2, Plus, Repeat, ChevronUp, ChevronDown, Pencil, X } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { cn, dateOnlyToLocal } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n/LocaleProvider";

type Task = {
  id: string;
  title: string;
  notes: string | null;
  dueDate: string | null;
  completed: boolean;
  priority: number;
  order: number;
  recurrence: string | null;
  recurrenceDays: number[];
  recurringGroupId: string | null;
};

type RepeatOption = "NONE" | "DAILY" | "WEEKLY" | "WEEKDAYS" | "CUSTOM";

// Day-of-week numbers use JS Date's getUTCDay() convention (0=Sunday..6=Saturday),
// matching how dueDate ("YYYY-MM-DD") parses to a UTC-midnight Date.
const DAY_ORDER = [1, 2, 3, 4, 5, 6, 0]; // displayed Mon..Sun

export default function TasksClient() {
  const { dict } = useTranslation();
  const t = dict.pages.tasks;
  const queryClient = useQueryClient();
  const { data: tasks, isLoading } = useQuery<Task[]>({
    queryKey: ["tasks"],
    queryFn: () => apiFetch("/api/tasks"),
  });

  const dayLabels: Record<number, string> = {
    1: t.dayMon,
    2: t.dayTue,
    3: t.dayWed,
    4: t.dayThu,
    5: t.dayFri,
    6: t.daySat,
    0: t.daySun,
  };

  const [title, setTitle] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [priority, setPriority] = useState(2);
  const [repeat, setRepeat] = useState<RepeatOption>("NONE");
  const [customDays, setCustomDays] = useState<number[]>([]);
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  function handleDueDateChange(value: string) {
    setDueDate(value);
    if (!value) {
      setRepeat("NONE");
      setCustomDays([]);
    }
  }

  function handleRepeatChange(value: RepeatOption) {
    setRepeat(value);
    if (value === "CUSTOM" && dueDate) {
      // Default to including the due date's own weekday so it isn't
      // silently dropped from the series.
      const anchorDay = dateOnlyToLocal(dueDate).getDay();
      setCustomDays((prev) => (prev.includes(anchorDay) ? prev : [...prev, anchorDay]));
    }
  }

  function toggleCustomDay(day: number) {
    setCustomDays((prev) => (prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]));
  }

  const createTask = useMutation({
    mutationFn: () =>
      apiFetch("/api/tasks", {
        method: "POST",
        body: JSON.stringify({
          title,
          dueDate: dueDate || null,
          priority,
          recurrence: repeat === "NONE" ? null : repeat,
          recurrenceDays: repeat === "CUSTOM" ? customDays : [],
        }),
      }),
    onSuccess: () => {
      setTitle("");
      setDueDate("");
      setRepeat("NONE");
      setCustomDays([]);
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
    mutationFn: ({ id, scope }: { id: string; scope?: "series" }) =>
      apiFetch(`/api/tasks/${id}${scope === "series" ? "?scope=series" : ""}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      setTaskToDelete(null);
    },
  });

  const editTask = useMutation({
    mutationFn: (vars: { id: string; title: string; dueDate: string | null; priority: number }) =>
      apiFetch(`/api/tasks/${vars.id}`, {
        method: "PATCH",
        body: JSON.stringify({ title: vars.title, dueDate: vars.dueDate, priority: vars.priority }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      setEditingTask(null);
    },
  });

  const reorderTasks = useMutation({
    mutationFn: (updates: { id: string; order: number }[]) =>
      apiFetch("/api/tasks/reorder", { method: "PATCH", body: JSON.stringify({ updates }) }),
  });

  const sortedTasks = [...(tasks || [])].sort((a, b) => {
    if (a.completed !== b.completed) return a.completed ? 1 : -1;
    if (a.order !== b.order) return a.order - b.order;
    const aDue = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
    const bDue = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
    if (aDue !== bDue) return aDue - bDue;
    return a.priority - b.priority;
  });

  // Touch-friendly reordering (arrow buttons instead of drag-and-drop, since
  // this app is tested live on a phone and native HTML5 DnD has poor/no
  // touch support). Swaps `order` with the adjacent task and updates the
  // cache optimistically so it feels instant, then persists in one request.
  function moveTask(task: Task, direction: -1 | 1) {
    const idx = sortedTasks.findIndex((tk) => tk.id === task.id);
    const swapIdx = idx + direction;
    if (swapIdx < 0 || swapIdx >= sortedTasks.length) return;
    const other = sortedTasks[swapIdx];
    if (other.completed !== task.completed) return; // keep completed/open groups separate

    const updates = [
      { id: task.id, order: other.order },
      { id: other.id, order: task.order },
    ];

    queryClient.setQueryData<Task[]>(["tasks"], (old) =>
      old?.map((tk) => {
        const update = updates.find((u) => u.id === tk.id);
        return update ? { ...tk, order: update.order } : tk;
      })
    );
    reorderTasks.mutate(updates);
  }

  const repeatDisabled = !dueDate;

  return (
    <div className="space-y-5">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (title.trim()) createTask.mutate();
        }}
        className="card flex flex-col gap-3"
      >
        <div className="flex flex-col gap-3 md:flex-row md:items-end">
          <div className="flex-1">
            <label className="label">{t.newTask}</label>
            <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder={t.titlePlaceholder} />
          </div>
          <div>
            <label className="label">{t.dueDate}</label>
            <input className="input" type="date" value={dueDate} onChange={(e) => handleDueDateChange(e.target.value)} />
          </div>
          <div>
            <label className="label">{t.priority}</label>
            <select className="input" value={priority} onChange={(e) => setPriority(Number(e.target.value))}>
              <option value={1}>{t.priorityHigh}</option>
              <option value={2}>{t.priorityMedium}</option>
              <option value={3}>{t.priorityLow}</option>
            </select>
          </div>
          <button type="submit" className="btn-primary">
            <Plus size={16} /> {t.addTask}
          </button>
        </div>

        <div>
          <label className="label">{t.repeat}</label>
          {repeatDisabled ? (
            <p className="text-xs text-ink-light">{t.repeatNeedsDueDate}</p>
          ) : (
            <>
              <select
                className="input"
                value={repeat}
                onChange={(e) => handleRepeatChange(e.target.value as RepeatOption)}
              >
                <option value="NONE">{t.repeatNone}</option>
                <option value="DAILY">{t.repeatDaily}</option>
                <option value="WEEKLY">{t.repeatWeekly}</option>
                <option value="WEEKDAYS">{t.repeatWeekdays}</option>
                <option value="CUSTOM">{t.repeatCustom}</option>
              </select>
              {repeat === "CUSTOM" && (
                <div className="mt-2">
                  <p className="mb-1 text-xs text-ink-light">{t.customDays}</p>
                  <div className="flex flex-wrap gap-2">
                    {DAY_ORDER.map((day) => (
                      <button
                        type="button"
                        key={day}
                        onClick={() => toggleCustomDay(day)}
                        className={cn(
                          "rounded-full border px-3 py-1 text-xs font-medium",
                          customDays.includes(day)
                            ? "border-sage-400 bg-sage-400 text-white"
                            : "border-cream-300 text-ink-light"
                        )}
                      >
                        {dayLabels[day]}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </form>

      {isLoading ? (
        <p className="text-sm text-ink-light">{t.loading}</p>
      ) : (
        <div className="card">
          <ul className="divide-y divide-cream-300">
            {sortedTasks.map((task, idx) => (
              <li key={task.id} className="flex items-center gap-3 py-3">
                <div className="flex shrink-0 flex-col">
                  <button
                    onClick={() => moveTask(task, -1)}
                    disabled={idx === 0 || sortedTasks[idx - 1]?.completed !== task.completed}
                    className="text-ink-light hover:text-ink disabled:opacity-20"
                    aria-label={t.moveUp}
                  >
                    <ChevronUp size={14} />
                  </button>
                  <button
                    onClick={() => moveTask(task, 1)}
                    disabled={idx === sortedTasks.length - 1 || sortedTasks[idx + 1]?.completed !== task.completed}
                    className="text-ink-light hover:text-ink disabled:opacity-20"
                    aria-label={t.moveDown}
                  >
                    <ChevronDown size={14} />
                  </button>
                </div>
                <button onClick={() => toggleTask.mutate(task)} className="text-sage-500 shrink-0">
                  {task.completed ? <CheckCircle2 size={20} /> : <Circle size={20} />}
                </button>
                <div className="flex-1">
                  <p className={cn("flex items-center gap-1.5 text-sm font-medium", task.completed && "line-through text-ink-light")}>
                    {task.title}
                    {task.recurringGroupId && (
                      <Repeat size={12} className="shrink-0 text-ink-light" aria-label={t.recurringBadge} />
                    )}
                  </p>
                  <p className="text-xs text-ink-light">
                    {task.dueDate ? format(dateOnlyToLocal(task.dueDate), "MMM d") : t.noDueDate} ·{" "}
                    {task.priority === 1 ? t.priorityHigh : task.priority === 2 ? t.priorityMedium : t.priorityLow}
                  </p>
                </div>
                <button onClick={() => postponeTask.mutate(task)} className="btn-secondary text-xs px-2 py-1">
                  {t.postpone}
                </button>
                <button onClick={() => setEditingTask(task)} className="text-ink-light hover:text-sage-600" aria-label={t.editTask}>
                  <Pencil size={16} />
                </button>
                <button onClick={() => setTaskToDelete(task)} className="text-ink-light hover:text-red-500">
                  <Trash2 size={16} />
                </button>
              </li>
            ))}
            {sortedTasks.length === 0 && <p className="py-4 text-sm text-ink-light">{t.empty}</p>}
          </ul>
        </div>
      )}

      {taskToDelete && (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center bg-ink/30 p-4"
          onClick={() => setTaskToDelete(null)}
        >
          <div className="card w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-serif text-lg text-ink">{t.deleteTaskTitle}</h3>
            <p className="mt-1 text-sm text-ink-light">{t.deleteTaskBody}</p>
            <div className="mt-4 flex flex-col gap-2">
              {taskToDelete.recurringGroupId ? (
                <>
                  <button
                    className="rounded-xl bg-red-500 px-4 py-2 text-sm font-medium text-white hover:bg-red-600 disabled:opacity-60"
                    disabled={deleteTask.isPending}
                    onClick={() => deleteTask.mutate({ id: taskToDelete.id })}
                  >
                    {deleteTask.isPending ? t.deleting : t.deleteOnceOption}
                  </button>
                  <button
                    className="rounded-xl bg-red-500 px-4 py-2 text-sm font-medium text-white hover:bg-red-600 disabled:opacity-60"
                    disabled={deleteTask.isPending}
                    onClick={() => deleteTask.mutate({ id: taskToDelete.id, scope: "series" })}
                  >
                    {deleteTask.isPending ? t.deleting : t.deleteSeriesOption}
                  </button>
                  <button className="btn-secondary" onClick={() => setTaskToDelete(null)}>
                    {t.cancel}
                  </button>
                </>
              ) : (
                <div className="flex justify-end gap-2">
                  <button className="btn-secondary" onClick={() => setTaskToDelete(null)}>
                    {t.cancel}
                  </button>
                  <button
                    className="rounded-xl bg-red-500 px-4 py-2 text-sm font-medium text-white hover:bg-red-600 disabled:opacity-60"
                    disabled={deleteTask.isPending}
                    onClick={() => deleteTask.mutate({ id: taskToDelete.id })}
                  >
                    {deleteTask.isPending ? t.deleting : t.deleteOnceOption}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {editingTask && (
        <EditTaskModal
          task={editingTask}
          onClose={() => setEditingTask(null)}
          onSave={(vars) => editTask.mutate(vars)}
          isSaving={editTask.isPending}
        />
      )}
    </div>
  );
}

function EditTaskModal({
  task,
  onClose,
  onSave,
  isSaving,
}: {
  task: Task;
  onClose: () => void;
  onSave: (vars: { id: string; title: string; dueDate: string | null; priority: number }) => void;
  isSaving: boolean;
}) {
  const { dict } = useTranslation();
  const t = dict.pages.tasks;
  const [title, setTitle] = useState(task.title);
  const [dueDate, setDueDate] = useState(task.dueDate ? format(dateOnlyToLocal(task.dueDate), "yyyy-MM-dd") : "");
  const [priority, setPriority] = useState(task.priority);

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-ink/30 sm:items-center sm:px-4" onClick={onClose}>
      <div
        className="card w-full max-w-sm rounded-b-none sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-serif text-lg">{t.editTaskTitle}</h3>
          <button onClick={onClose} aria-label={t.cancelEdit}>
            <X size={18} />
          </button>
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (title.trim()) onSave({ id: task.id, title, dueDate: dueDate || null, priority });
          }}
          className="space-y-3"
        >
          <div>
            <label className="label">{t.newTask}</label>
            <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} required />
          </div>
          <div>
            <label className="label">{t.dueDate}</label>
            <input className="input" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
          </div>
          <div>
            <label className="label">{t.priority}</label>
            <select className="input" value={priority} onChange={(e) => setPriority(Number(e.target.value))}>
              <option value={1}>{t.priorityHigh}</option>
              <option value={2}>{t.priorityMedium}</option>
              <option value={3}>{t.priorityLow}</option>
            </select>
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" className="btn-secondary" onClick={onClose}>
              {t.cancelEdit}
            </button>
            <button type="submit" className="btn-primary" disabled={isSaving}>
              {t.saveChanges}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
