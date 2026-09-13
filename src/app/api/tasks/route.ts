import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/session";
import { generateRecurrenceDates, type Recurrence } from "@/lib/recurrence";

export async function GET() {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const tasks = await prisma.task.findMany({
    where: { userId },
    // Manual order first, then completion/dueDate/priority as a fallback
    // for tasks that haven't been explicitly reordered yet.
    orderBy: [{ completed: "asc" }, { order: "asc" }, { dueDate: "asc" }, { priority: "asc" }],
  });
  return NextResponse.json(tasks);
}

const VALID_RECURRENCES: Recurrence[] = ["DAILY", "WEEKLY", "WEEKDAYS", "CUSTOM"];

// V2: cross-area analytics hook (task creation feeds future dashboard analytics)
export async function POST(req: Request) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();

  const maxOrderTask = await prisma.task.findFirst({
    where: { userId },
    orderBy: { order: "desc" },
    select: { order: true },
  });
  let nextOrder = (maxOrderTask?.order ?? -1) + 1;

  const baseData = {
    userId,
    title: body.title,
    notes: body.notes || null,
    scheduledStart: body.scheduledStart ? new Date(body.scheduledStart) : null,
    scheduledEnd: body.scheduledEnd ? new Date(body.scheduledEnd) : null,
    goalId: body.goalId || null,
    objectiveId: body.objectiveId || null,
    priority: body.priority ?? 2,
  };

  // A recurring task requires a dueDate — it's the anchor the series starts
  // from. The UI validates this too, but guard here as well: silently fall
  // back to a one-time task if recurrence was somehow sent without one.
  const recurrence: string | null =
    body.recurrence && VALID_RECURRENCES.includes(body.recurrence) && body.dueDate ? body.recurrence : null;

  if (recurrence) {
    const anchor = new Date(body.dueDate);
    const recurrenceDays: number[] = Array.isArray(body.recurrenceDays) ? body.recurrenceDays : [];
    const dates = generateRecurrenceDates(anchor, recurrence as Recurrence, recurrenceDays);
    const recurringGroupId = `rg_${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;

    await prisma.task.createMany({
      data: dates.map((dueDate, i) => ({
        ...baseData,
        dueDate,
        recurrence,
        recurrenceDays,
        recurringGroupId,
        order: nextOrder + i,
      })),
    });

    const created = await prisma.task.findMany({
      where: { recurringGroupId, userId },
      orderBy: { dueDate: "asc" },
    });
    return NextResponse.json(created, { status: 201 });
  }

  const task = await prisma.task.create({
    data: {
      ...baseData,
      dueDate: body.dueDate ? new Date(body.dueDate) : null,
      order: nextOrder,
    },
  });
  return NextResponse.json(task, { status: 201 });
}
