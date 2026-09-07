import Anthropic from "@anthropic-ai/sdk";
import { prisma } from "@/lib/prisma";
import { toDateOnly } from "@/lib/utils";

export function getAnthropicClient(): Anthropic | null {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;
  return new Anthropic({ apiKey });
}

export const ASSISTANT_MODEL = "claude-sonnet-5";

// V3: AI planning assistant hook — builds a snapshot of the user's real data as context
export async function buildUserContext(userId: string) {
  const today = toDateOnly(new Date());
  const weekAhead = new Date(today.getTime() + 7 * 86400000);
  const thirtyDaysAgo = new Date(today.getTime() - 30 * 86400000);
  const yesterday = new Date(today.getTime() - 86400000);

  const [tasks, todayEvents, weekEvents, habits, habitLogsToday, goals, wellness, journal] = await Promise.all([
    prisma.task.findMany({ where: { userId, completed: false }, orderBy: [{ priority: "asc" }, { dueDate: "asc" }], take: 20 }),
    prisma.event.findMany({ where: { userId, startsAt: { gte: today, lt: new Date(today.getTime() + 86400000) } }, orderBy: { startsAt: "asc" } }),
    prisma.event.findMany({ where: { userId, startsAt: { gte: today, lt: weekAhead } }, orderBy: { startsAt: "asc" }, take: 20 }),
    prisma.habit.findMany({ where: { userId }, include: { logs: { where: { date: { gte: thirtyDaysAgo } } } } }),
    prisma.habitLog.findMany({ where: { habit: { userId }, date: today } }),
    prisma.goal.findMany({ where: { userId }, include: { objectives: true } }),
    prisma.wellnessLog.findUnique({ where: { userId_date: { userId, date: yesterday } } }),
    prisma.journalEntry.findMany({ where: { userId, date: { gte: new Date(today.getTime() - 7 * 86400000) } }, orderBy: { date: "desc" }, take: 7 }),
  ]);

  const habitsSummary = habits.map((h) => {
    const doneToday = habitLogsToday.some((l) => l.habitId === h.id && l.completed);
    const last30 = h.logs.filter((l) => l.completed).length;
    return `${h.name} (${h.frequency}) — done today: ${doneToday ? "yes" : "no"}, completed ${last30}x in last 30 days`;
  });

  const lines: string[] = [];
  lines.push(`Today's date: ${today.toISOString().slice(0, 10)}`);
  lines.push("");
  lines.push(`OPEN TASKS (${tasks.length}):`);
  tasks.forEach((t) => lines.push(`- [${t.priority === 1 ? "high" : t.priority === 2 ? "med" : "low"}] ${t.title}${t.dueDate ? ` (due ${t.dueDate.toISOString().slice(0, 10)})` : ""}`));
  lines.push("");
  lines.push(`TODAY'S EVENTS (${todayEvents.length}):`);
  todayEvents.forEach((e) => lines.push(`- ${e.title} ${e.allDay ? "(all day)" : `${e.startsAt.toISOString().slice(11, 16)}-${e.endsAt.toISOString().slice(11, 16)}`}`));
  lines.push("");
  lines.push(`UPCOMING WEEK EVENTS (${weekEvents.length}):`);
  weekEvents.forEach((e) => lines.push(`- ${e.title} on ${e.startsAt.toISOString().slice(0, 10)}`));
  lines.push("");
  lines.push("HABITS:");
  habitsSummary.forEach((h) => lines.push(`- ${h}`));
  lines.push("");
  lines.push("ACTIVE GOALS:");
  goals.forEach((g) => {
    lines.push(`- ${g.title}${g.vision ? `: ${g.vision}` : ""}`);
    g.objectives.forEach((o) => lines.push(`  - objective: ${o.title}`));
  });
  lines.push("");
  lines.push("WELLNESS (yesterday):");
  lines.push(wellness ? `- sleep ${wellness.sleepHours ?? "?"}h, energy ${wellness.energy ?? "?"}/10, stress ${wellness.stress ?? "?"}/10, steps ${wellness.steps ?? "?"}` : "- no log for yesterday");
  lines.push("");
  lines.push("RECENT JOURNAL (last 7 days):");
  journal.forEach((j) => lines.push(`- ${j.date.toISOString().slice(0, 10)}: mood ${j.mood}/5, energy ${j.energy}/10, stress ${j.stress}/10${j.text ? ` — "${j.text}"` : ""}`));

  return { snapshot: lines.join("\n"), tasks, todayEvents };
}

export const ASSISTANT_SYSTEM_PROMPT = `You are the built-in planning assistant inside Life OS, a calm personal life-management app. You help the user plan their day, review progress on goals, and reflect on habits, wellness, and mood using their real data below. Be warm, concise, and practical — never moralizing or judgmental about missed habits, low mood, or off-track goals; frame observations neutrally, as information, not as a verdict on the person. Keep responses focused and skimmable (short paragraphs or bullet points).`;
