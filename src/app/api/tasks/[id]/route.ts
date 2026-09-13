import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/session";

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
