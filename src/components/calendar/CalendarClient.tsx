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
import { ChevronLeft, ChevronRight, Plus, Trash2, X } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { cn } from "@/lib/utils";

type EventT = {
  id: string;
  title: string;
  description: string | null;
  startsAt: string;
  endsAt: string;
  allDay: boolean;
  location: string | null;
};

type View = "month" | "week" | "day";

export default function CalendarClient() {
  const queryClient = useQueryClient();
  const [view, setView] = useState<View>("month");
  const [cursor, setCursor] = useState(new Date());
  const [modalDate, setModalDate] = useState<Date | null>(null);

  const { data: events } = useQuery<EventT[]>({
    queryKey: ["events"],
    queryFn: () => apiFetch("/api/events"),
  });

  const deleteEvent = useMutation({
    mutationFn: (id: string) => apiFetch(`/api/events/${id}`, { method: "DELETE" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["events"] }),
  });

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

  const eventsFor = (day: Date) => (events || []).filter((e) => isSameDay(new Date(e.startsAt), day));

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
                className={cn("px-3 py-1.5 text-sm capitalize", view === v ? "bg-sage-400 text-white" : "bg-white")}
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
        <MonthView cursor={cursor} eventsFor={eventsFor} onDayClick={setModalDate} />
      )}
      {view === "week" && <WeekView cursor={cursor} eventsFor={eventsFor} onDayClick={setModalDate} onDelete={(id) => deleteEvent.mutate(id)} />}
      {view === "day" && <DayView cursor={cursor} eventsFor={eventsFor} onDelete={(id) => deleteEvent.mutate(id)} />}

      {modalDate && <EventModal date={modalDate} onClose={() => setModalDate(null)} />}
    </div>
  );
}

function MonthView({
  cursor,
  eventsFor,
  onDayClick,
}: {
  cursor: Date;
  eventsFor: (d: Date) => EventT[];
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
              <span className="text-xs font-medium">{format(day, "d")}</span>
              <div className="mt-1 w-full space-y-0.5">
                {dayEvents.slice(0, 2).map((e) => (
                  <div key={e.id} className="truncate rounded bg-sage-200 px-1 py-0.5 text-[10px] text-sage-700">
                    {e.title}
                  </div>
                ))}
                {dayEvents.length > 2 && <div className="text-[10px] text-ink-light">+{dayEvents.length - 2} more</div>}
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
  onDayClick,
  onDelete,
}: {
  cursor: Date;
  eventsFor: (d: Date) => EventT[];
  onDayClick: (d: Date) => void;
  onDelete: (id: string) => void;
}) {
  const start = startOfWeek(cursor);
  const days = Array.from({ length: 7 }).map((_, i) => addDays(start, i));
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {days.map((day) => (
        <div key={day.toISOString()} className="card">
          <div className="mb-2 flex items-center justify-between">
            <p className={cn("font-medium", isSameDay(day, new Date()) && "text-sage-600")}>{format(day, "EEE d")}</p>
            <button onClick={() => onDayClick(day)} className="text-ink-light hover:text-sage-500">
              <Plus size={16} />
            </button>
          </div>
          <ul className="space-y-1">
            {eventsFor(day).map((e) => (
              <li key={e.id} className="flex items-center justify-between rounded bg-cream-100 px-2 py-1 text-xs">
                <span>
                  {e.allDay ? "All day" : format(new Date(e.startsAt), "h:mm a")} — {e.title}
                </span>
                <button onClick={() => onDelete(e.id)} className="text-ink-light hover:text-red-500">
                  <Trash2 size={12} />
                </button>
              </li>
            ))}
            {eventsFor(day).length === 0 && <li className="text-xs text-ink-light">No events</li>}
          </ul>
        </div>
      ))}
    </div>
  );
}

function DayView({
  cursor,
  eventsFor,
  onDelete,
}: {
  cursor: Date;
  eventsFor: (d: Date) => EventT[];
  onDelete: (id: string) => void;
}) {
  const dayEvents = eventsFor(cursor).sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime());
  return (
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
  );
}

function EventModal({ date, onClose }: { date: Date; onClose: () => void }) {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState("");
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("10:00");
  const [allDay, setAllDay] = useState(false);
  const [location, setLocation] = useState("");

  const createEvent = useMutation({
    mutationFn: () => {
      const [sh, sm] = startTime.split(":").map(Number);
      const [eh, em] = endTime.split(":").map(Number);
      const startsAt = new Date(date);
      startsAt.setHours(sh, sm, 0, 0);
      const endsAt = new Date(date);
      endsAt.setHours(eh, em, 0, 0);
      return apiFetch("/api/events", {
        method: "POST",
        body: JSON.stringify({ title, startsAt, endsAt, allDay, location }),
      });
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
          <h3 className="font-serif text-lg">New event — {format(date, "MMM d")}</h3>
          <button onClick={onClose}>
            <X size={18} />
          </button>
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (title.trim()) createEvent.mutate();
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
            Save event
          </button>
        </form>
      </div>
    </div>
  );
}
