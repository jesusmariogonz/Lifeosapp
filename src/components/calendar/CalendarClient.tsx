"use client";

import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  addDays,
  addMonths,
  addWeeks,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Plus, Trash2, X } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { cn, dateOnlyToLocal } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n/LocaleProvider";

type EventT = {
  id: string;
  title: string;
  description: string | null;
  startsAt: string;
  endsAt: string;
  allDay: boolean;
  location: string | null;
};

type TaskT = {
  id: string;
  title: string;
  completed: boolean;
  priority: number;
  dueDate: string | null;
};

type View = "month" | "week" | "day";

type Contact = {
  id: string;
  name: string;
  importantDates: { id: string; label: string; date: string; recurring: boolean }[];
};

// V4: Relationships feed — important dates surface on the calendar alongside real events
function contactDateOccurrences(contacts: Contact[], year: number): EventT[] {
  const occurrences: EventT[] = [];
  for (const c of contacts) {
    for (const d of c.importantDates) {
      const orig = new Date(d.date);
      // Stored as a date-only value (midnight UTC) — read month/day/year in
      // UTC so the calendar date doesn't shift with the viewer's timezone.
      const occursYear = d.recurring ? year : orig.getUTCFullYear();
      if (d.recurring || occursYear === year) {
        const occ = new Date(occursYear, orig.getUTCMonth(), orig.getUTCDate());
        occurrences.push({
          id: `cd-${d.id}-${occursYear}`,
          title: `${d.label}: ${c.name}`,
          description: null,
          startsAt: occ.toISOString(),
          endsAt: occ.toISOString(),
          allDay: true,
          location: null,
        });
      }
    }
  }
  return occurrences;
}

// The user's own birthday surfaces the same way — a synthetic, non-deletable
// all-day event repeated every year it's shown for.
function birthdayOccurrences(birthday: string | null | undefined, years: number[], label: string): EventT[] {
  if (!birthday) return [];
  const orig = new Date(birthday);
  if (isNaN(orig.getTime())) return [];
  // Stored as a date-only value (midnight UTC) — read month/day in UTC so
  // the calendar date doesn't shift with the viewer's timezone.
  return years.map((year) => {
    const occ = new Date(year, orig.getUTCMonth(), orig.getUTCDate());
    return {
      id: `bday-${year}`,
      title: label,
      description: null,
      startsAt: occ.toISOString(),
      endsAt: occ.toISOString(),
      allDay: true,
      location: null,
    };
  });
}

export default function CalendarClient() {
  const queryClient = useQueryClient();
  const { dict } = useTranslation();
  const [view, setView] = useState<View>("month");
  const [cursor, setCursor] = useState(new Date());
  const [modalDate, setModalDate] = useState<Date | null>(null);
  const [editingEvent, setEditingEvent] = useState<EventT | null>(null);
  const [detailDate, setDetailDate] = useState<Date | null>(null);

  const { data: events } = useQuery<EventT[]>({
    queryKey: ["events"],
    queryFn: () => apiFetch("/api/events"),
  });

  const { data: tasksData } = useQuery<TaskT[]>({
    queryKey: ["tasks"],
    queryFn: () => apiFetch("/api/tasks"),
  });

  const { data: contacts } = useQuery<Contact[]>({
    queryKey: ["contacts"],
    queryFn: () => apiFetch("/api/contacts"),
  });

  const { data: settings } = useQuery<{ birthday: string | null }>({
    queryKey: ["settings"],
    queryFn: () => apiFetch("/api/settings"),
  });

  const contactEvents = useMemo(() => {
    const years = Array.from(new Set([cursor.getFullYear(), cursor.getFullYear() + 1]));
    return years.flatMap((y) => contactDateOccurrences(contacts || [], y));
  }, [contacts, cursor]);

  const birthdayEvents = useMemo(() => {
    const years = [cursor.getFullYear(), cursor.getFullYear() + 1];
    return birthdayOccurrences(settings?.birthday, years, dict.dashboard.yourBirthday);
  }, [settings, cursor, dict]);

  const allEvents = useMemo(
    () => [...(events || []), ...contactEvents, ...birthdayEvents],
    [events, contactEvents, birthdayEvents]
  );

  const deleteEvent = useMutation({
    mutationFn: (id: string) => apiFetch(`/api/events/${id}`, { method: "DELETE" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["events"] }),
  });

  const toggleTask = useMutation({
    mutationFn: (t: TaskT) =>
      apiFetch(`/api/tasks/${t.id}`, { method: "PATCH", body: JSON.stringify({ completed: !t.completed }) }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["tasks"] }),
  });

  function handleDelete(id: string) {
    if (id.startsWith("cd-") || id.startsWith("bday-")) return; // synthetic recurring dates aren't deletable here
    deleteEvent.mutate(id);
  }

  const rangeLabel = useMemo(() => {
    if (view === "month") return format(cursor, "MMMM yyyy");
    if (view === "week")
      return `${format(startOfWeek(cursor), "MMM d")} - ${format(endOfWeek(cursor), "MMM d, yyyy")}`;
    return format(cursor, "EEEE, MMM d yyyy");
  }, [view, cursor]);

  function shift(dir: 1 | -1) {
    if (view === "month") setCursor(addMonths(cursor, dir));
    else if (view === "week") setCursor(addWeeks(cursor, dir));
    else setCursor(addDays(cursor, dir));
  }

  const eventsFor = (day: Date) => allEvents.filter((e) => isSameDay(new Date(e.startsAt), day));
  const tasksFor = (day: Date) =>
    (tasksData || []).filter((t) => t.dueDate && isSameDay(dateOnlyToLocal(t.dueDate), day));

  return (
    <div className="space-y-4">
      <div className="card flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <button onClick={() => shift(-1)} className="btn-secondary px-2 py-1">
            <ChevronLeft size={16} />
          </button>
          <span className="font-serif text-lg">{rangeLabel}</span>
          <button onClick={() => shift(1)} className="btn-secondary px-2 py-1">
            <ChevronRight size={16} />
          </button>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex overflow-hidden rounded-xl border border-cream-300">
            {(["month", "week", "day"] as View[]).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={cn("px-3 py-1.5 text-sm capitalize", view === v ? "bg-sage-400 text-white" : "bg-surface")}
              >
                {v}
              </button>
            ))}
          </div>
          <button onClick={() => setModalDate(new Date())} className="btn-primary px-3 py-1.5">
            <Plus size={16} /> Event
          </button>
        </div>
      </div>

      {view === "month" && (
        <MonthView cursor={cursor} eventsFor={eventsFor} tasksFor={tasksFor} onDayClick={setDetailDate} />
      )}
      {view === "week" && (
        <WeekView cursor={cursor} eventsFor={eventsFor} tasksFor={tasksFor} onDayClick={setDetailDate} onDelete={handleDelete} />
      )}
      {view === "day" && (
        <DayView cursor={cursor} eventsFor={eventsFor} tasksFor={tasksFor} onDelete={handleDelete} onToggleTask={toggleTask.mutate} />
      )}

      {modalDate && <EventModal date={modalDate} onClose={() => setModalDate(null)} />}
      {editingEvent && <EventModal event={editingEvent} onClose={() => setEditingEvent(null)} />}
      {detailDate && (
        <DayDetailModal
          date={detailDate}
          events={eventsFor(detailDate)}
          tasks={tasksFor(detailDate)}
          onClose={() => setDetailDate(null)}
          onDelete={handleDelete}
          onToggleTask={toggleTask.mutate}
          onAddEvent={(d) => {
            setDetailDate(null);
            setModalDate(d);
          }}
          onEditEvent={(e) => {
            setDetailDate(null);
            setEditingEvent(e);
          }}
        />
      )}
    </div>
  );
}

function MonthView({
  cursor,
  eventsFor,
  tasksFor,
  onDayClick,
}: {
  cursor: Date;
  eventsFor: (d: Date) => EventT[];
  tasksFor: (d: Date) => TaskT[];
  onDayClick: (d: Date) => void;
}) {
  const start = startOfWeek(startOfMonth(cursor));
  const end = endOfWeek(endOfMonth(cursor));
  const days: Date[] = [];
  let d = start;
  while (d <= end) {
    days.push(d);
    d = addDays(d, 1);
  }

  return (
    <div className="card overflow-x-auto">
      <div className="grid min-w-[600px] grid-cols-7 gap-1 text-center text-xs font-medium text-ink-light">
        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
          <div key={d} className="py-1">
            {d}
          </div>
        ))}
      </div>
      <div className="grid min-w-[600px] grid-cols-7 gap-1">
        {days.map((day) => {
          const dayEvents = eventsFor(day);
          const dayTasks = tasksFor(day);
          const items = [
            ...dayEvents.map((e) => ({ id: e.id, title: e.title, kind: "event" as const })),
            ...dayTasks.map((t) => ({ id: t.id, title: t.title, kind: "task" as const })),
          ];
          return (
            <button
              key={day.toISOString()}
              onClick={() => onDayClick(day)}
              className={cn(
                "flex min-h-[80px] flex-col items-start rounded-lg border border-cream-200 p-1.5 text-left hover:bg-cream-100",
                !isSameMonth(day, cursor) && "opacity-40",
                isSameDay(day, new Date()) && "border-sage-400 bg-sage-50"
              )}
            >
              <div className="flex w-full items-center justify-between">
                <span className="text-xs font-medium">{format(day, "d")}</span>
                <div className="flex items-center gap-0.5">
                  {dayEvents.length > 0 && <span className="h-1.5 w-1.5 rounded-full bg-sage-400" />}
                  {dayTasks.length > 0 && <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />}
                </div>
              </div>
              <div className="mt-1 w-full space-y-0.5">
                {items.slice(0, 2).map((it) => (
                  <div
                    key={it.id}
                    className={cn(
                      "truncate rounded px-1 py-0.5 text-[10px]",
                      it.kind === "event" ? "bg-sage-200 text-sage-700" : "bg-amber-100 text-amber-800"
                    )}
                  >
                    {it.title}
                  </div>
                ))}
                {items.length > 2 && <div className="text-[10px] text-ink-light">+{items.length - 2} more</div>}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function WeekView({
  cursor,
  eventsFor,
  tasksFor,
  onDayClick,
  onDelete,
}: {
  cursor: Date;
  eventsFor: (d: Date) => EventT[];
  tasksFor: (d: Date) => TaskT[];
  onDayClick: (d: Date) => void;
  onDelete: (id: string) => void;
}) {
  const start = startOfWeek(cursor);
  const days = Array.from({ length: 7 }).map((_, i) => addDays(start, i));
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {days.map((day) => {
        const dayTasks = tasksFor(day);
        return (
          <div
            key={day.toISOString()}
            role="button"
            tabIndex={0}
            onClick={() => onDayClick(day)}
            onKeyDown={(e) => e.key === "Enter" && onDayClick(day)}
            className="card cursor-pointer text-left"
          >
            <div className="mb-2 flex items-center justify-between">
              <p className={cn("font-medium", isSameDay(day, new Date()) && "text-sage-600")}>{format(day, "EEE d")}</p>
              <div className="flex items-center gap-1">
                {eventsFor(day).length > 0 && <span className="h-1.5 w-1.5 rounded-full bg-sage-400" />}
                {dayTasks.length > 0 && <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />}
              </div>
            </div>
            <ul className="space-y-1">
              {eventsFor(day).map((e) => (
                <li
                  key={e.id}
                  className="flex items-center justify-between rounded bg-cream-100 px-2 py-1 text-xs"
                  onClick={(ev) => ev.stopPropagation()}
                >
                  <span>
                    {e.allDay ? "All day" : format(new Date(e.startsAt), "h:mm a")} — {e.title}
                  </span>
                  <button onClick={() => onDelete(e.id)} className="text-ink-light hover:text-red-500">
                    <Trash2 size={12} />
                  </button>
                </li>
              ))}
              {dayTasks.map((t) => (
                <li key={t.id} className="rounded bg-amber-50 px-2 py-1 text-xs text-amber-800">
                  <span className={cn(t.completed && "text-ink-light line-through")}>{t.title}</span>
                </li>
              ))}
              {eventsFor(day).length === 0 && dayTasks.length === 0 && (
                <li className="text-xs text-ink-light">No events</li>
              )}
            </ul>
          </div>
        );
      })}
    </div>
  );
}

function DayView({
  cursor,
  eventsFor,
  tasksFor,
  onDelete,
  onToggleTask,
}: {
  cursor: Date;
  eventsFor: (d: Date) => EventT[];
  tasksFor: (d: Date) => TaskT[];
  onDelete: (id: string) => void;
  onToggleTask: (t: TaskT) => void;
}) {
  const dayEvents = eventsFor(cursor).sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime());
  const dayTasks = tasksFor(cursor);
  return (
    <div className="space-y-3">
      <div className="card">
        <ul className="divide-y divide-cream-300">
          {dayEvents.map((e) => (
            <li key={e.id} className="flex items-center justify-between py-3">
              <div>
                <p className="font-medium">{e.title}</p>
                <p className="text-xs text-ink-light">
                  {e.allDay ? "All day" : `${format(new Date(e.startsAt), "h:mm a")} - ${format(new Date(e.endsAt), "h:mm a")}`}
                  {e.location ? ` · ${e.location}` : ""}
                </p>
              </div>
              <button onClick={() => onDelete(e.id)} className="text-ink-light hover:text-red-500">
                <Trash2 size={16} />
              </button>
            </li>
          ))}
          {dayEvents.length === 0 && <p className="py-4 text-sm text-ink-light">No events today.</p>}
        </ul>
      </div>
      <div className="card">
        <p className="mb-2 text-sm font-medium text-ink-light">Tasks due</p>
        <ul className="divide-y divide-cream-300">
          {dayTasks.map((t) => (
            <li key={t.id} className="flex items-center gap-2 py-2">
              <input type="checkbox" checked={t.completed} onChange={() => onToggleTask(t)} />
              <span className={cn("text-sm", t.completed && "text-ink-light line-through")}>{t.title}</span>
            </li>
          ))}
          {dayTasks.length === 0 && <p className="py-2 text-sm text-ink-light">No tasks due today.</p>}
        </ul>
      </div>
    </div>
  );
}

function DayDetailModal({
  date,
  events,
  tasks,
  onClose,
  onDelete,
  onToggleTask,
  onAddEvent,
  onEditEvent,
}: {
  date: Date;
  events: EventT[];
  tasks: TaskT[];
  onClose: () => void;
  onDelete: (id: string) => void;
  onToggleTask: (t: TaskT) => void;
  onAddEvent: (d: Date) => void;
  onEditEvent: (e: EventT) => void;
}) {
  const { dict } = useTranslation();
  const sortedEvents = [...events].sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime());
  const priorityLabel = (p: number) => (p >= 3 ? "High" : p === 2 ? "Medium" : "Low");

  return (
    <div className="fixed inset-0 z-30 flex items-end justify-center bg-black/30 sm:items-center sm:px-4" onClick={onClose}>
      <div
        className="card max-h-[85vh] w-full overflow-y-auto rounded-b-none sm:max-w-md sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-serif text-lg">{format(date, "EEEE, MMM d")}</h3>
          <button onClick={onClose} aria-label={dict.pages.calendar.close}>
            <X size={18} />
          </button>
        </div>

        <div className="mb-4">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-sm font-medium text-ink-light">{dict.pages.calendar.events}</p>
            <button onClick={() => onAddEvent(date)} className="flex items-center gap-1 text-xs text-sage-600 hover:underline">
              <Plus size={12} /> {dict.pages.calendar.addEvent}
            </button>
          </div>
          {sortedEvents.length === 0 && <p className="text-xs text-ink-light">{dict.pages.calendar.noEvents}</p>}
          <ul className="space-y-1.5">
            {sortedEvents.map((e) => {
              const editable = !e.id.startsWith("cd-") && !e.id.startsWith("bday-");
              return (
                <li key={e.id} className="flex items-center justify-between rounded-lg bg-sage-50 px-2.5 py-1.5">
                  {editable ? (
                    <button
                      onClick={() => onEditEvent(e)}
                      className="min-w-0 flex-1 text-left"
                      aria-label={dict.pages.calendar.editEvent}
                    >
                      <p className="truncate text-sm font-medium">{e.title}</p>
                      <p className="text-[11px] text-ink-light">
                        {e.allDay ? dict.pages.calendar.allDay : format(new Date(e.startsAt), "h:mm a")}
                        {e.location ? ` · ${e.location}` : ""}
                      </p>
                    </button>
                  ) : (
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{e.title}</p>
                      <p className="text-[11px] text-ink-light">
                        {e.allDay ? dict.pages.calendar.allDay : format(new Date(e.startsAt), "h:mm a")}
                        {e.location ? ` · ${e.location}` : ""}
                      </p>
                    </div>
                  )}
                  {editable && (
                    <button onClick={() => onDelete(e.id)} className="ml-2 shrink-0 text-ink-light hover:text-red-500">
                      <Trash2 size={14} />
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <p className="text-sm font-medium text-ink-light">{dict.pages.calendar.tasksDue}</p>
            <Link href="/tasks" className="text-xs text-sage-600 hover:underline">
              {dict.pages.calendar.viewAllTasks}
            </Link>
          </div>
          {tasks.length === 0 && <p className="text-xs text-ink-light">{dict.pages.calendar.noTasksDue}</p>}
          <ul className="space-y-1.5">
            {tasks.map((t) => (
              <li key={t.id} className="flex items-center gap-2 rounded-lg bg-amber-50 px-2.5 py-1.5">
                <input type="checkbox" checked={t.completed} onChange={() => onToggleTask(t)} />
                <Link href="/tasks" className="flex-1 min-w-0">
                  <p className={cn("truncate text-sm", t.completed && "text-ink-light line-through")}>{t.title}</p>
                </Link>
                <span className="shrink-0 rounded-full bg-amber-200 px-2 py-0.5 text-[10px] text-amber-800">
                  {priorityLabel(t.priority)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

function EventModal({
  date,
  event,
  onClose,
}: {
  date?: Date;
  event?: EventT;
  onClose: () => void;
}) {
  const { dict } = useTranslation();
  const queryClient = useQueryClient();
  const isEdit = !!event;
  const baseDate = event ? new Date(event.startsAt) : date!;
  const [title, setTitle] = useState(event?.title ?? "");
  const [startTime, setStartTime] = useState(event && !event.allDay ? format(new Date(event.startsAt), "HH:mm") : "09:00");
  const [endTime, setEndTime] = useState(event && !event.allDay ? format(new Date(event.endsAt), "HH:mm") : "10:00");
  const [allDay, setAllDay] = useState(event?.allDay ?? false);
  const [location, setLocation] = useState(event?.location ?? "");

  const saveEvent = useMutation({
    mutationFn: () => {
      const [sh, sm] = startTime.split(":").map(Number);
      const [eh, em] = endTime.split(":").map(Number);
      const startsAt = new Date(baseDate);
      startsAt.setHours(sh, sm, 0, 0);
      const endsAt = new Date(baseDate);
      endsAt.setHours(eh, em, 0, 0);
      const payload = { title, startsAt, endsAt, allDay, location };
      return isEdit
        ? apiFetch(`/api/events/${event!.id}`, { method: "PATCH", body: JSON.stringify(payload) })
        : apiFetch("/api/events", { method: "POST", body: JSON.stringify(payload) });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
      onClose();
    },
  });

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/30 px-4" onClick={onClose}>
      <div className="card w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-serif text-lg">
            {isEdit ? dict.pages.calendar.editEventTitle : dict.pages.calendar.newEventTitle} — {format(baseDate, "MMM d")}
          </h3>
          <button onClick={onClose}>
            <X size={18} />
          </button>
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (title.trim()) saveEvent.mutate();
          }}
          className="space-y-3"
        >
          <div>
            <label className="label">Title</label>
            <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} required />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={allDay} onChange={(e) => setAllDay(e.target.checked)} /> All day
          </label>
          {!allDay && (
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="label">Start</label>
                <input className="input" type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
              </div>
              <div className="flex-1">
                <label className="label">End</label>
                <input className="input" type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
              </div>
            </div>
          )}
          <div>
            <label className="label">Location</label>
            <input className="input" value={location} onChange={(e) => setLocation(e.target.value)} />
          </div>
          <button type="submit" className="btn-primary w-full">
            {isEdit ? dict.pages.calendar.saveChanges : dict.pages.calendar.saveEvent}
          </button>
        </form>
      </div>
    </div>
  );
}
