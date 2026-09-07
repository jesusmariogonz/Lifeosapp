"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { apiFetch } from "@/lib/api";

type WellnessLog = {
  id: string;
  date: string;
  sleepHours: number | null;
  weight: number | null;
  steps: number | null;
  exerciseMinutes: number | null;
  waterOz: number | null;
  energy: number | null;
  stress: number | null;
};

// V4: wearable/health integration hook (this form would be pre-filled from a connected device)
export default function WellnessClient() {
  const queryClient = useQueryClient();
  const { data: logs, isLoading } = useQuery<WellnessLog[]>({
    queryKey: ["wellness"],
    queryFn: () => apiFetch("/api/wellness"),
  });

  const [form, setForm] = useState({
    sleepHours: "",
    weight: "",
    steps: "",
    exerciseMinutes: "",
    waterOz: "",
    energy: "5",
    stress: "5",
  });

  const saveLog = useMutation({
    mutationFn: () =>
      apiFetch("/api/wellness", {
        method: "POST",
        body: JSON.stringify({
          date: new Date(),
          sleepHours: form.sleepHours ? Number(form.sleepHours) : null,
          weight: form.weight ? Number(form.weight) : null,
          steps: form.steps ? Number(form.steps) : null,
          exerciseMinutes: form.exerciseMinutes ? Number(form.exerciseMinutes) : null,
          waterOz: form.waterOz ? Number(form.waterOz) : null,
          energy: Number(form.energy),
          stress: Number(form.stress),
        }),
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["wellness"] }),
  });

  return (
    <div className="space-y-5">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          saveLog.mutate();
        }}
        className="card grid grid-cols-2 gap-3 md:grid-cols-4"
      >
        {[
          ["sleepHours", "Sleep (hrs)"],
          ["weight", "Weight"],
          ["steps", "Steps"],
          ["exerciseMinutes", "Exercise (min)"],
          ["waterOz", "Water (oz)"],
        ].map(([key, label]) => (
          <div key={key}>
            <label className="label">{label}</label>
            <input
              className="input"
              type="number"
              value={(form as any)[key]}
              onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
            />
          </div>
        ))}
        <div>
          <label className="label">Energy (1-10)</label>
          <input
            className="input"
            type="number"
            min={1}
            max={10}
            value={form.energy}
            onChange={(e) => setForm((f) => ({ ...f, energy: e.target.value }))}
          />
        </div>
        <div>
          <label className="label">Stress (1-10)</label>
          <input
            className="input"
            type="number"
            min={1}
            max={10}
            value={form.stress}
            onChange={(e) => setForm((f) => ({ ...f, stress: e.target.value }))}
          />
        </div>
        <div className="col-span-2 flex items-end md:col-span-4">
          <button type="submit" className="btn-primary">
            Save today's log
          </button>
        </div>
      </form>

      <div className="card">
        <h2 className="mb-3 font-serif text-lg">Recent logs</h2>
        {isLoading ? (
          <p className="text-sm text-ink-light">Loading...</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[500px] text-left text-sm">
              <thead className="text-ink-light">
                <tr>
                  <th className="py-1 pr-2">Date</th>
                  <th className="py-1 pr-2">Sleep</th>
                  <th className="py-1 pr-2">Steps</th>
                  <th className="py-1 pr-2">Exercise</th>
                  <th className="py-1 pr-2">Energy</th>
                  <th className="py-1 pr-2">Stress</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cream-300">
                {(logs || []).map((l) => (
                  <tr key={l.id}>
                    <td className="py-1 pr-2">{format(new Date(l.date), "MMM d")}</td>
                    <td className="py-1 pr-2">{l.sleepHours ?? "—"}</td>
                    <td className="py-1 pr-2">{l.steps ?? "—"}</td>
                    <td className="py-1 pr-2">{l.exerciseMinutes ?? "—"}</td>
                    <td className="py-1 pr-2">{l.energy ?? "—"}</td>
                    <td className="py-1 pr-2">{l.stress ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {(logs || []).length === 0 && <p className="text-sm text-ink-light">No logs yet.</p>}
          </div>
        )}
      </div>
    </div>
  );
}
