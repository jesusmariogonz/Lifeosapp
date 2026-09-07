"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { apiFetch } from "@/lib/api";
import { cn } from "@/lib/utils";

type Entry = { id: string; date: string; mood: number; energy: number; stress: number; text: string | null };

const MOODS = ["😞", "😕", "😐", "🙂", "😄"];

export default function JournalClient() {
  const queryClient = useQueryClient();
  const { data: entries, isLoading } = useQuery<Entry[]>({ queryKey: ["journal"], queryFn: () => apiFetch("/api/journal") });

  const [mood, setMood] = useState(3);
  const [energy, setEnergy] = useState(5);
  const [stress, setStress] = useState(5);
  const [text, setText] = useState("");

  const saveEntry = useMutation({
    mutationFn: () =>
      apiFetch("/api/journal", {
        method: "POST",
        body: JSON.stringify({ date: new Date(), mood, energy, stress, text }),
      }),
    onSuccess: () => {
      setText("");
      queryClient.invalidateQueries({ queryKey: ["journal"] });
    },
  });

  return (
    <div className="space-y-5">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          saveEntry.mutate();
        }}
        className="card space-y-3"
      >
        <div>
          <label className="label">Mood</label>
          <div className="flex gap-2">
            {MOODS.map((emoji, i) => (
              <button
                type="button"
                key={i}
                onClick={() => setMood(i + 1)}
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-full border-2 text-lg",
                  mood === i + 1 ? "border-sage-400 bg-sage-100" : "border-cream-300"
                )}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Energy (1-10)</label>
            <input className="input" type="number" min={1} max={10} value={energy} onChange={(e) => setEnergy(Number(e.target.value))} />
          </div>
          <div>
            <label className="label">Stress (1-10)</label>
            <input className="input" type="number" min={1} max={10} value={stress} onChange={(e) => setStress(Number(e.target.value))} />
          </div>
        </div>
        <div>
          <label className="label">Today's entry</label>
          <textarea className="input min-h-[100px]" value={text} onChange={(e) => setText(e.target.value)} placeholder="What's on your mind?" />
        </div>
        <button type="submit" className="btn-primary">
          Save entry
        </button>
      </form>

      <div className="space-y-3">
        {isLoading && <p className="text-sm text-ink-light">Loading...</p>}
        {(entries || []).map((e) => (
          <div key={e.id} className="card">
            <div className="mb-1 flex items-center justify-between">
              <p className="font-medium">{format(new Date(e.date), "EEEE, MMM d")}</p>
              <span className="text-lg">{MOODS[e.mood - 1]}</span>
            </div>
            <p className="text-xs text-ink-light">Energy {e.energy}/10 · Stress {e.stress}/10</p>
            {e.text && <p className="mt-2 text-sm">{e.text}</p>}
          </div>
        ))}
        {(entries || []).length === 0 && !isLoading && <p className="text-sm text-ink-light">No entries yet.</p>}
      </div>
    </div>
  );
}
