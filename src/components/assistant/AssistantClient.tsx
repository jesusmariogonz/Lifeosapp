"use client";

import { useState, useRef, useEffect } from "react";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { Sparkles, Send, CalendarCheck, Loader2 } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { usePrioritiesStore } from "@/store/priorities";
import type { ChatMessage, DailyPlan } from "@/types/chat";

const SUGGESTIONS = [
  "Plan my day",
  "How am I doing on my goals this month?",
  "What should I focus on this week?",
];

function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export default function AssistantClient() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [notConfigured, setNotConfigured] = useState(false);
  const [plan, setPlan] = useState<DailyPlan | null>(null);
  const [planApplied, setPlanApplied] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();
  const setPriorities = usePrioritiesStore((s) => s.setPriorities);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const sendMutation = useMutation({
    mutationFn: async (text: string) => {
      const userMsg: ChatMessage = { id: uid(), role: "user", content: text, createdAt: new Date().toISOString() };
      const nextMessages = [...messages, userMsg];
      setMessages(nextMessages);
      const res = await apiFetch<{ role?: string; content?: string; error?: string; message?: string }>(
        "/api/assistant/chat",
        {
          method: "POST",
          body: JSON.stringify({ messages: nextMessages.map((m) => ({ role: m.role, content: m.content })) }),
        }
      );
      if (res.error === "not_configured") {
        setNotConfigured(true);
        return;
      }
      if (res.content) {
        setMessages((prev) => [...prev, { id: uid(), role: "assistant", content: res.content!, createdAt: new Date().toISOString() }]);
      }
    },
  });

  const planMutation = useMutation({
    mutationFn: async () => {
      const res = await apiFetch<DailyPlan & { error?: string }>("/api/assistant/plan", { method: "POST" });
      if ((res as any).error === "not_configured") {
        setNotConfigured(true);
        return null;
      }
      return res;
    },
    onSuccess: (data) => {
      if (data) {
        setPlan(data);
        setPlanApplied(false);
      }
    },
  });

  const acceptPlan = useMutation({
    mutationFn: async () => {
      if (!plan) return;
      const todayKey = new Date().toISOString().slice(0, 10);
      const tasks = await apiFetch<any[]>("/api/tasks");
      const taskIds: string[] = [];
      for (const p of plan.priorities.slice(0, 3)) {
        const existing = tasks.find(
          (t) => !t.completed && t.title.toLowerCase().includes(p.toLowerCase().slice(0, 12))
        );
        if (existing) {
          taskIds.push(existing.id);
        } else {
          const created = await apiFetch<any>("/api/tasks", {
            method: "POST",
            body: JSON.stringify({ title: p, priority: 1 }),
          });
          taskIds.push(created.id);
        }
      }
      setPriorities(todayKey, taskIds);
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
    onSuccess: () => setPlanApplied(true),
  });

  function handleSend(text?: string) {
    const value = (text ?? input).trim();
    if (!value || sendMutation.isPending) return;
    setInput("");
    sendMutation.mutate(value);
  }

  if (notConfigured) {
    return (
      <div className="card flex flex-col items-center gap-3 py-12 text-center">
        <Sparkles className="text-sage-400" size={28} />
        <h2 className="font-serif text-xl text-ink">AI assistant not configured</h2>
        <p className="max-w-md text-sm text-ink-light">
          Set the <code className="rounded bg-cream-200 px-1.5 py-0.5">ANTHROPIC_API_KEY</code> environment
          variable to enable the planning assistant. Everything else in Life OS works without it.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="card">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-serif text-lg text-ink">Generate today's plan</h2>
          <button
            className="btn-primary"
            onClick={() => planMutation.mutate()}
            disabled={planMutation.isPending}
          >
            {planMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <CalendarCheck size={16} />}
            Generate plan
          </button>
        </div>
        {plan && (
          <div className="space-y-4 rounded-xl bg-sage-50 p-4">
            <div>
              <h3 className="mb-2 text-xs font-medium uppercase tracking-wide text-ink-light">Top priorities</h3>
              <ul className="space-y-1 text-sm text-ink">
                {plan.priorities.map((p, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-sage-400 text-xs text-white">
                      {i + 1}
                    </span>
                    {p}
                  </li>
                ))}
              </ul>
            </div>
            {plan.timeBlocks?.length > 0 && (
              <div>
                <h3 className="mb-2 text-xs font-medium uppercase tracking-wide text-ink-light">Suggested time blocks</h3>
                <div className="space-y-1 text-sm text-ink">
                  {plan.timeBlocks.map((b, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <span className="w-24 shrink-0 text-ink-light">{b.start}–{b.end}</span>
                      <span>{b.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {plan.note && <p className="text-sm italic text-ink-light">{plan.note}</p>}
            <button
              className="btn-secondary"
              onClick={() => acceptPlan.mutate()}
              disabled={acceptPlan.isPending || planApplied}
            >
              {planApplied ? "Applied to today's priorities" : acceptPlan.isPending ? "Applying..." : "Accept & set as today's priorities"}
            </button>
          </div>
        )}
      </div>

      <div className="card flex h-[520px] flex-col">
        <h2 className="mb-3 font-serif text-lg text-ink">Chat</h2>
        <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto pr-1">
          {messages.length === 0 && (
            <div className="flex h-full flex-col items-center justify-center gap-3 text-center text-ink-light">
              <Sparkles size={22} className="text-sage-400" />
              <p className="text-sm">Ask anything about your day, goals, habits, or wellness.</p>
              <div className="flex flex-wrap justify-center gap-2">
                {SUGGESTIONS.map((s) => (
                  <button key={s} onClick={() => handleSend(s)} className="btn-secondary text-xs">
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}
          {messages.map((m) => (
            <div key={m.id} className={m.role === "user" ? "flex justify-end" : "flex justify-start"}>
              <div
                className={
                  m.role === "user"
                    ? "max-w-[80%] rounded-2xl rounded-br-sm bg-sage-400 px-4 py-2 text-sm text-white"
                    : "max-w-[80%] whitespace-pre-wrap rounded-2xl rounded-bl-sm bg-cream-200 px-4 py-2 text-sm text-ink"
                }
              >
                {m.content}
              </div>
            </div>
          ))}
          {sendMutation.isPending && (
            <div className="flex justify-start">
              <div className="rounded-2xl rounded-bl-sm bg-cream-200 px-4 py-2 text-sm text-ink-light">
                <Loader2 size={14} className="inline animate-spin" /> thinking...
              </div>
            </div>
          )}
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="mt-3 flex gap-2"
        >
          <input
            className="input"
            placeholder="Ask about your day, goals, habits..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
          <button type="submit" className="btn-primary" disabled={sendMutation.isPending || !input.trim()}>
            <Send size={16} />
          </button>
        </form>
      </div>
    </div>
  );
}
