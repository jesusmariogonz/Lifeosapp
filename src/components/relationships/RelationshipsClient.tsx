"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Trash2, Plus, X } from "lucide-react";
import { apiFetch } from "@/lib/api";

type ImportantDate = { id: string; label: string; date: string; recurring: boolean };
type Contact = {
  id: string;
  name: string;
  relationship: string | null;
  notes: string | null;
  importantDates: ImportantDate[];
};

type DraftDate = { label: string; date: string };

export default function RelationshipsClient() {
  const queryClient = useQueryClient();
  const { data: contacts, isLoading } = useQuery<Contact[]>({
    queryKey: ["contacts"],
    queryFn: () => apiFetch("/api/contacts"),
  });

  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [relationship, setRelationship] = useState("");
  const [notes, setNotes] = useState("");
  const [dates, setDates] = useState<DraftDate[]>([{ label: "Birthday", date: "" }]);

  const createContact = useMutation({
    mutationFn: () =>
      apiFetch("/api/contacts", {
        method: "POST",
        body: JSON.stringify({
          name,
          relationship: relationship || null,
          notes: notes || null,
          importantDates: dates.filter((d) => d.date).map((d) => ({ label: d.label, date: d.date, recurring: true })),
        }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
      setName("");
      setRelationship("");
      setNotes("");
      setDates([{ label: "Birthday", date: "" }]);
      setShowForm(false);
    },
  });

  const deleteContact = useMutation({
    mutationFn: (id: string) => apiFetch(`/api/contacts/${id}`, { method: "DELETE" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["contacts"] }),
  });

  const today = new Date();
  const upcoming = (contacts || [])
    .flatMap((c) => c.importantDates.map((d) => ({ ...d, contactName: c.name })))
    .map((d) => {
      const orig = new Date(d.date);
      const next = new Date(today.getFullYear(), orig.getMonth(), orig.getDate());
      if (next < new Date(today.getFullYear(), today.getMonth(), today.getDate())) next.setFullYear(next.getFullYear() + 1);
      return { ...d, next };
    })
    .sort((a, b) => a.next.getTime() - b.next.getTime())
    .slice(0, 6);

  return (
    <div className="space-y-5">
      <div className="card">
        <h2 className="mb-3 font-serif text-lg text-ink">Upcoming important dates</h2>
        {upcoming.length === 0 ? (
          <p className="text-sm text-ink-light">No important dates yet — add a contact below.</p>
        ) : (
          <ul className="space-y-2">
            {upcoming.map((d) => (
              <li key={d.id} className="flex items-center justify-between text-sm">
                <span className="text-ink">
                  {d.label} — <span className="text-ink-light">{d.contactName}</span>
                </span>
                <span className="text-ink-light">{format(d.next, "MMM d")}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="card">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-serif text-lg text-ink">Contacts</h2>
          <button className="btn-secondary" onClick={() => setShowForm((s) => !s)}>
            {showForm ? <X size={16} /> : <Plus size={16} />}
            {showForm ? "Cancel" : "Add contact"}
          </button>
        </div>

        {showForm && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              createContact.mutate();
            }}
            className="mb-5 space-y-3 rounded-xl bg-sage-50 p-4"
          >
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="label">Name</label>
                <input className="input" required value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div>
                <label className="label">Relationship</label>
                <input
                  className="input"
                  placeholder="e.g. Sister, Friend, Colleague"
                  value={relationship}
                  onChange={(e) => setRelationship(e.target.value)}
                />
              </div>
            </div>
            <div>
              <label className="label">Notes</label>
              <textarea className="input" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
            </div>
            <div>
              <label className="label">Important dates</label>
              <div className="space-y-2">
                {dates.map((d, i) => (
                  <div key={i} className="flex gap-2">
                    <input
                      className="input"
                      placeholder="Label (e.g. Birthday)"
                      value={d.label}
                      onChange={(e) => setDates((ds) => ds.map((x, idx) => (idx === i ? { ...x, label: e.target.value } : x)))}
                    />
                    <input
                      className="input"
                      type="date"
                      value={d.date}
                      onChange={(e) => setDates((ds) => ds.map((x, idx) => (idx === i ? { ...x, date: e.target.value } : x)))}
                    />
                  </div>
                ))}
                <button
                  type="button"
                  className="text-xs text-sage-600 underline"
                  onClick={() => setDates((ds) => [...ds, { label: "", date: "" }])}
                >
                  + add another date
                </button>
              </div>
            </div>
            <button type="submit" className="btn-primary" disabled={createContact.isPending}>
              Save contact
            </button>
          </form>
        )}

        {isLoading ? (
          <p className="text-sm text-ink-light">Loading...</p>
        ) : (contacts || []).length === 0 ? (
          <p className="text-sm text-ink-light">No contacts yet.</p>
        ) : (
          <div className="space-y-3">
            {(contacts || []).map((c) => (
              <div key={c.id} className="flex items-start justify-between rounded-xl border border-cream-300/60 p-3">
                <div>
                  <p className="text-sm font-medium text-ink">
                    {c.name} {c.relationship && <span className="font-normal text-ink-light">· {c.relationship}</span>}
                  </p>
                  {c.notes && <p className="mt-0.5 text-xs text-ink-light">{c.notes}</p>}
                  {c.importantDates.length > 0 && (
                    <p className="mt-1 text-xs text-ink-light">
                      {c.importantDates.map((d) => `${d.label}: ${format(new Date(d.date), "MMM d")}`).join(" · ")}
                    </p>
                  )}
                </div>
                <button
                  className="text-ink-light hover:text-red-500"
                  onClick={() => deleteContact.mutate(c.id)}
                  title="Delete contact"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
