import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/session";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const event = await prisma.event.updateMany({
    where: { id: params.id, userId },
    data: {
      ...(body.title !== undefined ? { title: body.title } : {}),
      ...(body.description !== undefined ? { description: body.description } : {}),
      ...(body.startsAt !== undefined ? { startsAt: new Date(body.startsAt) } : {}),
      ...(body.endsAt !== undefined ? { endsAt: new Date(body.endsAt) } : {}),
      ...(body.allDay !== undefined ? { allDay: body.allDay } : {}),
      ...(body.location !== undefined ? { location: body.location } : {}),
    },
  });
  return NextResponse.json(event);
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await prisma.event.deleteMany({ where: { id: params.id, userId } });
  return NextResponse.json({ ok: true });
}
