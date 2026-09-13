import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/session";
import { generateRecurrenceDates, type Recurrence } from "@/lib/recurrence";

const VALID_RECURRENCES: Recurrence[] = ["DAILY", "WEEKLY", "WEEKDAYS", "CUSTOM"];

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const data: any = {};
  if (body.title !== undefined) data.title = body.title;
  if (body.notes !== undefined) data.notes = body.notes;
  if (body.dueDate !== undefined) data.dueDate = body.dueDate ? new Date(body.dueDate) : null;
  if (body.scheduledStart !== undefined)
    data.scheduledStart = body.scheduledStart ? new Date(body.scheduledStart) : null;
  if (body.scheduledEnd !== undefined)
    data.scheduledEnd = body.scheduledEnd ? new Date(body.scheduledEnd) : null;
  if (body.priority !== undefined) data.priority = body.priority;
  if (body.goalId !== undefined) data.goalId = body.goalId;
  if (body.objectiveId !== undefined) data.objectiveId = body.objectiveId;
  if (body.order !== undefined) data.order = body.order;
  if (body.completed !== undefined) {
    data.completed = body.completed;
    data.completedAt = body.completed ? new Date() : null;
  }

  // Setting a recurrence on a task that isn't already part of a series turns
  // it into the anchor of a new one, generating the same way task creation
  // does. Changing the pattern of a task that's already in a series is out
  // of scope here (that would mean reconciling/regenerating the whole
  // series) — reject it explicitly rather than silently doing nothing.
  if (body.recurrence !== undefined) {
    const existing = await prisma.task.findFirst({ where: { id: params.id, userId } });
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

    if (existing.recurringGroupId) {
      return NextResponse.json(
        { error: "This task is already part of a recurring series — its repeat pattern can't be changed here." },
        { status: 400 }
      );
    }

    const recurrence = body.recurrence && VALID_RECURRENCES.includes(body.recurrence) ? (body.recurrence as Recurrence) : null;
    if (recurrence) {
      const anchorDueDate = data.dueDate !== undefined ? data.dueDate : existing.dueDate;
      if (!anchorDueDate) {
        return NextResponse.json({ error: "A due date is required to make a task recurring." }, { status: 400 });
      }
      const recurrenceDays: number[] = Array.isArray(body.recurrenceDays) ? body.recurrenceDays : [];
      const dates = generateRecurrenceDates(anchorDueDate, recurrence, recurrenceDays);
      const recurringGroupId = `rg_${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;

      data.dueDate = anchorDueDate;
      data.recurrence = recurrence;
      data.recurrenceDays = recurrenceDays;
      data.recurringGroupId = recurringGroupId;

      const futureDates = dates.filter((d) => d.getTime() !== anchorDueDate.getTime());
      if (futureDates.length) {
        const maxOrderTask = await prisma.task.findFirst({
          where: { userId },
          orderBy: { order: "desc" },
          select: { order: true },
        });
        let nextOrder = (maxOrderTask?.order ?? -1) + 1;
        await prisma.task.createMany({
          data: futureDates.map((dueDate, i) => ({
            userId,
            title: data.title ?? existing.title,
            notes: existing.notes,
            priority: data.priority ?? existing.priority,
            goalId: existing.goalId,
            objectiveId: existing.objectiveId,
            dueDate,
            recurrence,
            recurrenceDays,
            recurringGroupId,
            order: nextOrder + i,
          })),
        });
      }
    } else {
      data.recurrence = null;
      data.recurrenceDays = [];
    }
  }

  const task = await prisma.task.updateMany({ where: { id: params.id, userId }, data });
  return NextResponse.json(task);
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const scope = searchParams.get("scope"); // "series" deletes this + all future occurrences

  if (scope === "series") {
    const task = await prisma.task.findFirst({ where: { id: params.id, userId } });
    if (task?.recurringGroupId) {
      // Delete this occurrence and every future one in the same series.
      // Past occurrences (already due/completed) are left untouched —
      // instances are independent rows, deleting one series member never
      // affects another.
      await prisma.task.deleteMany({
        where: {
          userId,
          recurringGroupId: task.recurringGroupId,
          dueDate: { gte: task.dueDate ?? undefined },
        },
      });
      return NextResponse.json({ ok: true });
    }
  }

  await prisma.task.deleteMany({ where: { id: params.id, userId } });
  return NextResponse.json({ ok: true });
}
