import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/session";

export async function GET() {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const tasks = await prisma.task.findMany({
    where: { userId },
    orderBy: [{ completed: "asc" }, { dueDate: "asc" }],
  });
  return NextResponse.json(tasks);
}

// V2: cross-area analytics hook (task creation feeds future dashboard analytics)
export async function POST(req: Request) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const task = await prisma.task.create({
    data: {
      userId,
      title: body.title,
      notes: body.notes || null,
      dueDate: body.dueDate ? new Date(body.dueDate) : null,
      scheduledStart: body.scheduledStart ? new Date(body.scheduledStart) : null,
      scheduledEnd: body.scheduledEnd ? new Date(body.scheduledEnd) : null,
      goalId: body.goalId || null,
      objectiveId: body.objectiveId || null,
      priority: body.priority ?? 2,
    },
  });
  return NextResponse.json(task, { status: 201 });
}
